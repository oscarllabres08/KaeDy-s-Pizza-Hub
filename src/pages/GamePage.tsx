import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calculator, RotateCcw, Timer, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type MathGameBestScore } from '../lib/supabase';

type GamePageProps = {
  onNavigate: (page: string) => void;
};

type Difficulty = 'easy' | 'medium';
type Phase = 'start' | 'leaderboard' | 'ready' | 'playing' | 'ended';
type EndReason = 'time' | 'wrong';

type Question = {
  a: number;
  b: number;
  correct: number;
};

const GAME_SECONDS = 30;
const SOUND_CACHE_BUST = import.meta.env.DEV ? String(Date.now()) : '1';
const GAME_STATE_STORAGE_KEY = 'kaedys_game_state_v1';

type SavedGameState = {
  v: 1;
  savedAt: string;
  phase: Phase;
  difficulty: Difficulty;
  timeLeft: number;
  score: number;
  correctCount: number;
  endReason: EndReason;
  question: Question;
  choices: number[];
  locked: boolean;
  lastPick: null | { value: number; correct: boolean };
  finalScore: number;
  finalCorrectCount: number;
};

function createChainedAudio(srcCandidates: string[]) {
  const audio = new Audio();
  audio.preload = 'auto';
  audio.volume = 0.9;

  const withCacheBust = (src: string) => {
    if (!src) return src;
    const joiner = src.includes('?') ? '&' : '?';
    return `${src}${joiner}v=${encodeURIComponent(SOUND_CACHE_BUST)}`;
  };

  let idx = 0;
  const tryNext = () => {
    idx += 1;
    if (idx >= srcCandidates.length) return;
    audio.src = withCacheBust(srcCandidates[idx] ?? '');
    audio.load();
  };

  audio.addEventListener('error', tryNext);
  audio.src = withCacheBust(srcCandidates[0] ?? '');
  return audio;
}

async function playSound(audio: HTMLAudioElement | null) {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    await audio.play();
  } catch {
    // ignore (autoplay restrictions, missing file, etc.)
  }
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeQuestion(difficulty: Difficulty): Question {
  const b = 1 + Math.floor(Math.random() * 9);
  const a =
    difficulty === 'easy'
      ? 1 + Math.floor(Math.random() * 9)
      : 10 + Math.floor(Math.random() * 90);
  return { a, b, correct: a * b };
}

function makeChoices(correct: number): number[] {
  const choices = new Set<number>([correct]);
  const baseSpread = Math.max(3, Math.round(Math.sqrt(correct)));

  while (choices.size < 4) {
    const delta = (Math.floor(Math.random() * (baseSpread * 2 + 1)) - baseSpread) || 1;
    const candidate = correct + delta;
    if (candidate > 0) choices.add(candidate);
  }
  return shuffle(Array.from(choices));
}

/** Warm yellow “radiant” layers + soft glows (replaces flat black). */
function GameRadiantBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_130%_95%_at_50%_-20%,rgba(250,204,21,0.45),rgba(251,191,36,0.14)_40%,transparent_65%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_85%_at_105%_12%,rgba(253,224,71,0.24),transparent_52%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_75%_at_-8%_88%,rgba(146,64,14,0.2),transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-950/35 via-stone-950/80 to-black"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-10 -top-28 h-[22rem] w-[22rem] rounded-full bg-yellow-400/28 blur-3xl" />
        <div className="absolute -left-20 top-[15%] h-[18rem] w-[18rem] rounded-full bg-amber-500/26 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-56 w-[135%] max-w-5xl -translate-x-1/2 rounded-[100%] bg-amber-400/18 blur-3xl" />
        <div className="absolute bottom-20 right-6 h-44 w-44 rounded-full bg-yellow-300/16 blur-2xl" />
      </div>
    </>
  );
}

export default function GamePage({ onNavigate }: GamePageProps) {
  const { user, refreshProfiles } = useAuth();
  const [gameEnabled, setGameEnabled] = useState(true);
  const [phase, setPhase] = useState<Phase>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCorrectCount, setFinalCorrectCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [endReason, setEndReason] = useState<EndReason>('time');
  const [question, setQuestion] = useState<Question>(() => makeQuestion('easy'));
  const [choices, setChoices] = useState<number[]>(() => makeChoices(question.correct));
  const [locked, setLocked] = useState(false);
  const [lastPick, setLastPick] = useState<null | { value: number; correct: boolean }>(null);
  const tickRef = useRef<number | null>(null);
  const gameOverSoundPlayedRef = useRef(false);
  const prevTimeLeftRef = useRef<number>(GAME_SECONDS);
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameOverAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameStartAudioRef = useRef<HTMLAudioElement | null>(null);
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  const scoreRecordedRef = useRef(false);
  const timePct = useMemo(() => (timeLeft / GAME_SECONDS) * 100, [timeLeft]);
  const restoredOnceRef = useRef(false);
  const userResetRef = useRef(false);
  const phaseRef = useRef(phase);
  const scoreRef = useRef(score);
  const correctCountRef = useRef(correctCount);
  const userRef = useRef(user);
  const difficultyRef = useRef(difficulty);
  const refreshProfilesRef = useRef(refreshProfiles);
  phaseRef.current = phase;
  scoreRef.current = score;
  correctCountRef.current = correctCount;
  userRef.current = user;
  difficultyRef.current = difficulty;
  refreshProfilesRef.current = refreshProfiles;
  const [leaderboardRows, setLeaderboardRows] = useState<MathGameBestScore[]>([]);
  const [myBestScores, setMyBestScores] = useState<{ best_easy: number; best_medium: number } | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    if (!user?.id) return;
    const col = difficulty === 'easy' ? 'best_easy' : 'best_medium';
    setLeaderboardLoading(true);
    try {
      const [{ data: top, error: topErr }, { data: mine, error: mineErr }] = await Promise.all([
        supabase
          .from('math_game_best_scores')
          .select('user_id,display_name,avatar_path,best_easy,best_medium,updated_at')
          .gt(col, 0)
          .order(col, { ascending: false })
          .limit(5),
        supabase.from('math_game_best_scores').select('best_easy,best_medium').eq('user_id', user.id).maybeSingle(),
      ]);
      if (topErr) console.error('leaderboard top', topErr);
      if (mineErr) console.error('leaderboard mine', mineErr);
      setLeaderboardRows((top as MathGameBestScore[] | null) ?? []);
      setMyBestScores(mine);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [user?.id, difficulty]);

  useEffect(() => {
    if (phase !== 'leaderboard' || !user?.id) return;
    void loadLeaderboard();
    const channel = supabase
      .channel(`math_game_leaderboard_${difficulty}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'math_game_best_scores' },
        () => {
          void loadLeaderboard();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [phase, user?.id, difficulty, loadLeaderboard]);

  const accentChoices = useMemo(
    () => [
      'from-amber-500/45 to-amber-800/20 border-amber-400/50 hover:border-yellow-300/70 hover:shadow-lg hover:shadow-amber-500/30',
      'from-yellow-500/35 to-yellow-800/20 border-yellow-500/45 hover:border-yellow-300/70 hover:shadow-lg hover:shadow-yellow-500/25',
      'from-orange-500/40 to-orange-900/20 border-orange-400/45 hover:border-orange-300/70 hover:shadow-lg hover:shadow-orange-500/25',
      'from-neutral-700/50 to-neutral-900/30 border-yellow-500/35 hover:border-yellow-400/55 hover:shadow-lg hover:shadow-black/40',
    ],
    []
  );

  useEffect(() => {
    // Sounds are loaded from `/public/sounds/*` (served as `/sounds/*`).
    // Put your files in `public/sounds/` and name them like:
    // - correct.(mp3|wav|ogg)
    // - game_over.(mp3|wav|ogg)
    // - game_start.(mp3|wav|ogg)  (also used as countdown tick)
    if (!correctAudioRef.current) {
      correctAudioRef.current = createChainedAudio([
        '/sounds/correct.wav',
        '/sounds/correct.mp3',
        '/sounds/correct.ogg',
      ]);
    }
    if (!gameOverAudioRef.current) {
      gameOverAudioRef.current = createChainedAudio([
        '/sounds/game_over.wav',
        '/sounds/game_over.mp3',
        '/sounds/game_over.ogg',
      ]);
    }
    if (!gameStartAudioRef.current) {
      gameStartAudioRef.current = createChainedAudio([
        '/sounds/game_start.wav',
        '/sounds/game_start.mp3',
        '/sounds/game_start.ogg',
      ]);
      gameStartAudioRef.current.volume = 0.75;
    }
    if (!tickAudioRef.current) {
      tickAudioRef.current = createChainedAudio([
        '/sounds/countdown.wav',
        '/sounds/countdown.mp3',
        '/sounds/countdown.ogg',
      ]);
      tickAudioRef.current.volume = 0.5;
    }

    return () => {
      correctAudioRef.current?.pause();
      gameOverAudioRef.current?.pause();
      gameStartAudioRef.current?.pause();
      tickAudioRef.current?.pause();
      correctAudioRef.current = null;
      gameOverAudioRef.current = null;
      gameStartAudioRef.current = null;
      tickAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    checkGameSettings();
  }, [user]);

  // Restore prior game state when returning to the Game tab/page.
  useEffect(() => {
    if (restoredOnceRef.current) return;
    restoredOnceRef.current = true;
    try {
      const raw = sessionStorage.getItem(GAME_STATE_STORAGE_KEY);
      if (!raw) {
        setHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<SavedGameState>;
      if (parsed.v !== 1) {
        setHydrated(true);
        return;
      }
      if (
        parsed.phase !== 'start' &&
        parsed.phase !== 'leaderboard' &&
        parsed.phase !== 'ready' &&
        parsed.phase !== 'playing' &&
        parsed.phase !== 'ended'
      ) {
        setHydrated(true);
        return;
      }
      if (parsed.difficulty !== 'easy' && parsed.difficulty !== 'medium') {
        setHydrated(true);
        return;
      }
      if (!parsed.question || !Array.isArray(parsed.choices)) {
        setHydrated(true);
        return;
      }

      setPhase(parsed.phase === 'ready' ? 'leaderboard' : parsed.phase);
      setDifficulty(parsed.difficulty);
      setTimeLeft(Math.max(0, Math.min(GAME_SECONDS, Number(parsed.timeLeft ?? GAME_SECONDS))));
      setScore(Math.max(0, Number(parsed.score ?? 0)));
      setCorrectCount(Math.max(0, Number(parsed.correctCount ?? 0)));
      setFinalScore(Math.max(0, Number(parsed.finalScore ?? parsed.score ?? 0)));
      setFinalCorrectCount(Math.max(0, Number(parsed.finalCorrectCount ?? parsed.correctCount ?? 0)));
      setEndReason((parsed.endReason as EndReason) || 'time');
      setQuestion({
        a: Number(parsed.question.a),
        b: Number(parsed.question.b),
        correct: Number(parsed.question.correct),
      });
      setChoices((parsed.choices as unknown[]).map((c) => Number(c)));
      setLocked(!!parsed.locked);
      setLastPick(
        parsed.lastPick && typeof parsed.lastPick === 'object'
          ? { value: Number((parsed.lastPick as any).value), correct: !!(parsed.lastPick as any).correct }
          : null
      );
      prevTimeLeftRef.current = Math.max(0, Math.min(GAME_SECONDS, Number(parsed.timeLeft ?? GAME_SECONDS)));
      gameOverSoundPlayedRef.current = parsed.phase === 'ended';
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Capture final snapshot on end.
  useEffect(() => {
    if (phase !== 'ended') return;
    setFinalScore(score);
    setFinalCorrectCount(correctCount);
  }, [phase, score, correctCount]);

  // Persist state (after hydration) so Game doesn't reset when navigating away/back.
  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload: SavedGameState = {
        v: 1,
        savedAt: new Date().toISOString(),
        phase,
        difficulty,
        timeLeft,
        score,
        correctCount,
        endReason,
        question,
        choices,
        locked,
        lastPick,
        finalScore,
        finalCorrectCount,
      };
      sessionStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [
    hydrated,
    phase,
    difficulty,
    timeLeft,
    score,
    correctCount,
    endReason,
    question,
    choices,
    locked,
    lastPick,
    finalScore,
    finalCorrectCount,
  ]);

  // Leaving the game page mid-run ends the session: count score like game over and drop saved "playing" state.
  useEffect(() => {
    return () => {
      if (phaseRef.current !== 'playing') return;
      try {
        sessionStorage.removeItem(GAME_STATE_STORAGE_KEY);
      } catch {
        // ignore
      }
      const u = userRef.current;
      const s = scoreRef.current;
      const d = difficultyRef.current;
      if (!u || s <= 0) return;
      void (async () => {
        const { error } = await supabase.rpc('record_game_score', {
          p_score: s,
          p_difficulty: d,
        });
        if (error) console.error('record_game_score (left page)', error);
        else await refreshProfilesRef.current();
      })();
    };
  }, []);

  useEffect(() => {
    if (phase === 'start' || phase === 'leaderboard' || phase === 'ready' || phase === 'playing') {
      scoreRecordedRef.current = false;
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'ended' || !user || scoreRecordedRef.current) return;
    scoreRecordedRef.current = true;
    if (score <= 0) return;
    void (async () => {
      const { error } = await supabase.rpc('record_game_score', {
        p_score: score,
        p_difficulty: difficulty,
      });
      if (error) console.error('record_game_score', error);
      else await refreshProfiles();
    })();
  }, [phase, score, user, refreshProfiles, difficulty]);

  useEffect(() => {
    if (phase !== 'playing') return;

    tickRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft !== 0) return;
    setLocked(true);
    setEndReason('time');
    setPhase('ended');
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase !== 'ended') return;
    if (gameOverSoundPlayedRef.current) return;
    gameOverSoundPlayedRef.current = true;
    playSound(gameOverAudioRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, endReason]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const prev = prevTimeLeftRef.current;
    prevTimeLeftRef.current = timeLeft;

    // Countdown tick each second (only when time decreases, not on initial set)
    if (timeLeft > 0 && prev > timeLeft) {
      playSound(tickAudioRef.current);
    }
  }, [phase, timeLeft]);

  const difficultyPoints = useMemo(() => (difficulty === 'easy' ? 1 : 2), [difficulty]);

  const checkGameSettings = async () => {
    const { data } = await supabase
      .from('game_settings')
      .select('falling_pizza_active,is_active')
      .single();

    if (data) {
      setGameEnabled((data.falling_pizza_active ?? data.is_active) === true);
    }
  };

  const chooseDifficulty = (d: Difficulty) => {
    if (!user) {
      onNavigate('auth');
      return;
    }
    setDifficulty(d);
    setPhase('leaderboard');
    setLocked(false);
    setLastPick(null);
  };

  const startGame = () => {
    if (!user) {
      onNavigate('auth');
      return;
    }
    playSound(gameStartAudioRef.current);
    setPhase('playing');
    setScore(0);
    setCorrectCount(0);
    setFinalScore(0);
    setFinalCorrectCount(0);
    setTimeLeft(GAME_SECONDS);
    setLocked(false);
    setLastPick(null);
    setEndReason('time');
    gameOverSoundPlayedRef.current = false;
    prevTimeLeftRef.current = GAME_SECONDS;
    const q = makeQuestion(difficulty);
    setQuestion(q);
    setChoices(makeChoices(q.correct));
  };

  const nextQuestion = () => {
    const q = makeQuestion(difficulty);
    setQuestion(q);
    setChoices(makeChoices(q.correct));
  };

  const handlePick = (value: number) => {
    if (locked || phase !== 'playing') return;
    const isCorrect = value === question.correct;
    setLocked(true);
    setLastPick({ value, correct: isCorrect });

    if (isCorrect) {
      playSound(correctAudioRef.current);
      setCorrectCount((c) => c + 1);
      setScore((s) => s + (difficulty === 'easy' ? 1 : 2));
      window.setTimeout(() => {
        if (timeLeft === 0) {
          setEndReason('time');
          setPhase('ended');
          return;
        }
        nextQuestion();
        setLastPick(null);
        setLocked(false);
      }, 220);
    } else {
      // Incorrect answer ends the game.
      window.setTimeout(() => {
        setEndReason('wrong');
        setPhase('ended');
      }, 320);
    }
  };

  if (!user) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#070604] py-16 px-4 flex items-center justify-center">
        <GameRadiantBackdrop />
        <div className="text-center relative z-[1]">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/25 to-yellow-600/15 border border-yellow-500/30 shadow-lg shadow-amber-900/40">
            <Calculator className="w-12 h-12 text-yellow-300" />
          </div>
          <h2 className="text-2xl font-bold text-heading-primary mb-4">
            Please sign in to play
          </h2>
          <button
            onClick={() => onNavigate('auth')}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black px-8 py-3 font-bold hover:from-amber-300 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!gameEnabled) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#070604] py-16 px-4 flex items-center justify-center">
        <GameRadiantBackdrop />
        <div className="text-center relative z-[1]">
          <Calculator className="w-24 h-24 text-yellow-500/35 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-heading-secondary mb-4">Game is currently disabled</h2>
          <p className="text-neutral-400">Check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070604] py-10 px-4">
      <GameRadiantBackdrop />
      <div className="relative z-[1] max-w-xl mx-auto">
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
          @keyframes floaty {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
        `}</style>

        <div className="text-center mb-6 animate-fadeIn">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/35 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-600/15 px-4 py-2 mb-4 shadow-lg shadow-black/40">
            <Calculator className="w-4 h-4 text-yellow-300" />
            <span className="text-xs font-extrabold tracking-wide bg-gradient-to-r from-yellow-200 to-amber-300 bg-clip-text text-transparent">
              MULTIPLICATION CHALLENGE
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight text-heading-primary drop-shadow-sm">
            Math Challenge
          </h1>
          <p className="text-sm md:text-base text-gray-200/90 leading-relaxed">
            Answer as many multiplication questions as you can in{' '}
            <span className="text-amber-300 font-bold">{GAME_SECONDS}</span> seconds.
          </p>
        </div>

        <div className="rounded-3xl border border-yellow-500/20 bg-neutral-900/80 backdrop-blur-xl p-6 md:p-8 shadow-[0_0_50px_-12px_rgba(234,179,8,0.12),0_25px_60px_rgba(0,0,0,0.55)] ring-1 ring-yellow-500/15">
          {phase === 'start' && (
            <div className="text-center">
              <div
                className="mx-auto mb-6 w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/25 to-yellow-600/20 border border-yellow-500/25 flex items-center justify-center shadow-inner shadow-amber-900/30"
                style={{ animation: 'floaty 3s ease-in-out infinite' }}
              >
                <Calculator className="w-10 h-10 text-amber-200" />
              </div>
              <h2 className="text-2xl font-black mb-2 tracking-tight text-heading-secondary">
                Choose difficulty
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => chooseDifficulty('easy')}
                  className="group rounded-2xl border-2 border-emerald-400/40 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-black/50 px-5 py-5 text-left shadow-md shadow-emerald-500/10 hover:border-emerald-300/70 hover:shadow-emerald-400/25 hover:shadow-lg transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-emerald-200 font-black text-lg drop-shadow-sm">Easy</p>
                    <span className="text-[11px] font-extrabold text-emerald-100 border border-emerald-400/40 bg-emerald-500/25 rounded-full px-2 py-0.5">
                      +1 / correct
                    </span>
                  </div>
                  <p className="text-emerald-100/80 text-sm mt-2">1-digit × 1-digit</p>
                  <p className="text-teal-300/70 text-xs mt-1">Example: 3 × 9</p>
                </button>
                <button
                  onClick={() => chooseDifficulty('medium')}
                  className="group rounded-2xl border-2 border-amber-500/45 bg-gradient-to-br from-amber-600/20 via-yellow-600/10 to-black/50 px-5 py-5 text-left shadow-md shadow-amber-900/20 hover:border-yellow-400/60 hover:shadow-amber-500/20 hover:shadow-lg transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-amber-100 font-black text-lg drop-shadow-sm">Medium</p>
                    <span className="text-[11px] font-extrabold text-yellow-100 border border-yellow-500/45 bg-amber-600/30 rounded-full px-2 py-0.5">
                      +2 / correct
                    </span>
                  </div>
                  <p className="text-amber-100/90 text-sm mt-2">2-digit × 1-digit</p>
                  <p className="text-yellow-300/80 text-xs mt-1">Example: 12 × 4</p>
                </button>
              </div>
            </div>
          )}

          {phase === 'leaderboard' && (
            <div className="text-center">
              <div
                className={`mx-auto mb-5 w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg border ${
                  difficulty === 'easy'
                    ? 'bg-gradient-to-br from-emerald-500/25 to-teal-600/20 border-emerald-400/35 shadow-emerald-900/30'
                    : 'bg-gradient-to-br from-amber-500/30 to-yellow-600/20 border-amber-400/35 shadow-amber-900/25'
                }`}
              >
                <Trophy
                  className={`w-10 h-10 ${difficulty === 'easy' ? 'text-emerald-200' : 'text-amber-200'}`}
                />
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-1 tracking-tight text-heading-primary">
                Leaderboard
              </h2>
              <p className="text-sm text-gray-200 mb-1">
                <span
                  className={`font-extrabold ${difficulty === 'easy' ? 'text-emerald-300' : 'text-amber-300'}`}
                >
                  {difficulty === 'easy' ? 'Easy' : 'Medium'}
                </span>
                <span className="text-gray-500"> · </span>
                <span className="text-gray-400">Top 5 highest scores</span>
              </p>
              <p className="text-xs text-gray-500 mb-5">
                {GAME_SECONDS}s run · Easy +1 / correct · Medium +2 / correct
              </p>

              <div
                className={`rounded-2xl border p-4 text-left mb-5 ${
                  difficulty === 'easy'
                    ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-black/60'
                    : 'border-amber-500/30 bg-gradient-to-br from-amber-950/35 to-black/60'
                }`}
              >
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Your best score</p>
                <p
                  className={`text-3xl font-black tabular-nums mt-1 ${
                    difficulty === 'easy' ? 'text-emerald-200' : 'text-amber-200'
                  }`}
                >
                  {difficulty === 'easy' ? myBestScores?.best_easy ?? 0 : myBestScores?.best_medium ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-yellow-500/20 bg-black/35 p-3 text-left min-h-[200px]">
                <p className="text-xs font-extrabold text-yellow-200/90 mb-3 px-1">Top 5</p>
                {leaderboardLoading ? (
                  <p className="text-sm text-gray-500 text-center py-8">Loading…</p>
                ) : leaderboardRows.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No scores yet. Be the first to play!
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {leaderboardRows.map((row, idx) => {
                      const rank = idx + 1;
                      const pts = difficulty === 'easy' ? row.best_easy : row.best_medium;
                      const initial = (row.display_name?.trim()?.charAt(0) || '?').toUpperCase();
                      const rowHighlight =
                        rank === 1
                          ? 'border-amber-400/60 bg-gradient-to-r from-yellow-500/25 via-amber-500/15 to-yellow-600/10 ring-1 ring-amber-400/40 shadow-[0_0_22px_rgba(234,179,8,0.18)]'
                          : rank === 2
                            ? 'border-slate-300/50 bg-gradient-to-r from-slate-400/18 to-slate-600/12 ring-1 ring-slate-400/35 shadow-[0_0_18px_rgba(148,163,184,0.12)]'
                            : rank === 3
                              ? 'border-amber-900/55 bg-gradient-to-r from-orange-950/45 to-amber-950/30 ring-1 ring-orange-800/45 shadow-[0_0_16px_rgba(180,83,9,0.15)]'
                              : 'border-white/10 bg-neutral-950/50';
                      const rankNumClass =
                        rank === 1
                          ? 'text-amber-200'
                          : rank === 2
                            ? 'text-slate-200'
                            : rank === 3
                              ? 'text-amber-700'
                              : 'text-gray-500';
                      const trophyClass =
                        rank === 1
                          ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.65)]'
                          : rank === 2
                            ? 'text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.45)]'
                            : 'text-amber-900 drop-shadow-[0_0_4px_rgba(146,64,14,0.35)]';
                      return (
                        <li
                          key={row.user_id}
                          className={`flex items-start gap-2 sm:gap-3 rounded-xl border px-2.5 sm:px-3 py-2.5 ${rowHighlight}`}
                        >
                          <div className="flex items-start gap-1 shrink-0 w-10 sm:w-[3.25rem] justify-start pt-0.5">
                            <span className={`text-center text-sm font-black tabular-nums ${rankNumClass}`}>
                              {rank}
                            </span>
                            {rank <= 3 ? (
                              <Trophy className={`w-4 h-4 shrink-0 mt-0.5 ${trophyClass}`} aria-hidden />
                            ) : null}
                          </div>
                          {row.avatar_path ? (
                            <img
                              src={row.avatar_path}
                              alt=""
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-yellow-500/25 shrink-0 bg-black mt-0.5"
                            />
                          ) : (
                            <div
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-black border shrink-0 mt-0.5 ${
                                difficulty === 'easy'
                                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100'
                                  : 'bg-amber-500/20 border-amber-400/40 text-amber-100'
                              }`}
                            >
                              {initial}
                            </div>
                          )}
                          <div className="min-w-0 flex-1 flex flex-row items-start justify-between gap-2 sm:gap-3">
                            <p className="min-w-0 flex-1 pr-1 font-bold text-gray-100 text-left text-sm sm:text-base leading-snug break-words [overflow-wrap:anywhere]">
                              {row.display_name || 'Player'}
                            </p>
                            <span
                              className={`min-w-[2.25rem] text-right text-base sm:text-lg font-black tabular-nums shrink-0 leading-snug pt-0.5 ${
                                difficulty === 'easy' ? 'text-emerald-300' : 'text-amber-300'
                              }`}
                            >
                              {pts}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
                <button
                  type="button"
                  onClick={startGame}
                  className="rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-black px-5 py-3.5 font-black hover:from-amber-300 hover:via-orange-400 hover:to-rose-400 transition-all active:scale-[0.99] shadow-lg shadow-orange-500/30"
                >
                  Start Game
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('start')}
                  className="rounded-2xl border-2 border-yellow-500/35 bg-neutral-900/80 px-5 py-3.5 font-black text-yellow-200 hover:bg-neutral-800/90 transition-all active:scale-[0.99]"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {phase === 'playing' && (
            <div>
              {/* Timer progress */}
              <div className="mb-5">
                <div className="h-2.5 rounded-full bg-black/40 border border-white/10 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-500 transition-[width] duration-500 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                    style={{ width: `${timePct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2 rounded-full border border-yellow-500/30 bg-gradient-to-r from-neutral-950/80 to-amber-950/40 px-3.5 py-2.5 shadow-md shadow-black/30">
                  <Timer className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-black text-yellow-100 tabular-nums">{timeLeft}s</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-gradient-to-r from-amber-950/50 to-orange-950/40 px-3.5 py-2.5 shadow-md shadow-amber-500/15">
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span className="text-sm font-black text-amber-100 tabular-nums">{score} pts</span>
                </div>
              </div>

              <div
                className={`rounded-3xl border-2 border-yellow-500/30 bg-gradient-to-b from-neutral-950/90 via-neutral-950 to-amber-950/25 p-6 text-center shadow-lg shadow-black/40 ${
                  lastPick && !lastPick.correct ? 'animate-[shake_300ms_ease-in-out_1] border-red-400/40' : ''
                }`}
              >
                <p className="text-gray-200 text-xs sm:text-sm mb-3">
                  Difficulty{' '}
                  <span
                    className={`font-black ${
                      difficulty === 'easy' ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {difficulty.toUpperCase()}
                  </span>
                  <span className="text-gray-500"> · </span>
                  <span className="text-gray-200">
                    +<span className="text-amber-300 font-black">{difficultyPoints}</span> per correct
                  </span>
                </p>
                <p className="text-4xl md:text-6xl font-black tracking-tight">
                  <span className="text-yellow-100">{question.a}</span>{' '}
                  <span className="text-yellow-400">×</span>{' '}
                  <span className="text-amber-200">{question.b}</span>{' '}
                  <span className="text-yellow-300/90">= ?</span>
                </p>

                {lastPick && (
                  <p
                    className={`mt-4 text-sm font-extrabold ${
                      lastPick.correct ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-rose-400'
                    }`}
                  >
                    {lastPick.correct ? 'Correct!' : 'Try again'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {choices.map((c, idx) => {
                  const picked = lastPick?.value === c;
                  const isCorrect = c === question.correct;
                  const baseAccent = accentChoices[idx % accentChoices.length];
                  const stateClass =
                    picked && lastPick
                      ? lastPick.correct
                        ? 'border-green-400/60 bg-green-500/15'
                        : 'border-red-400/60 bg-red-500/10'
                      : `bg-gradient-to-b ${baseAccent} hover:from-white/10 hover:to-white/5`;

                  return (
                    <button
                      key={c}
                      onClick={() => handlePick(c)}
                      disabled={locked}
                      className={`rounded-2xl border px-4 py-4 md:py-5 text-2xl md:text-4xl font-black text-white transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm ${stateClass}`}
                      aria-label={`Answer ${c}${picked ? (isCorrect ? ', correct' : ', wrong') : ''}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {phase === 'ended' && (
            <div className="text-center">
              <div className="mx-auto mb-6 w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/30 to-yellow-600/20 border border-yellow-500/30 flex items-center justify-center shadow-xl shadow-amber-900/35">
                <Trophy className="w-10 h-10 text-yellow-200" />
              </div>
              <h2
                className={`text-2xl md:text-3xl font-black mb-2 tracking-tight ${
                  endReason === 'wrong'
                    ? 'text-rose-400'
                    : 'text-heading-primary'
                }`}
              >
                {endReason === 'wrong' ? 'Game Over!' : 'Time’s up!'}
              </h2>
              {endReason === 'wrong' ? (
                <p className="text-sm text-rose-200/80 mb-2">Wrong answer ends the game. Try again!</p>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-3 max-w-md mx-auto">
                <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-950/50 to-orange-950/30 p-4 shadow-md shadow-amber-500/10">
                  <p className="text-xs text-amber-200/70 font-bold">FINAL SCORE</p>
                  <p className="text-3xl font-black text-amber-100 tabular-nums mt-1">{finalScore}</p>
                </div>
                <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-neutral-950/80 to-amber-950/35 p-4 shadow-md shadow-black/30">
                  <p className="text-xs text-yellow-200/80 font-bold">CORRECT</p>
                  <p className="text-3xl font-black text-yellow-100 tabular-nums mt-1">{finalCorrectCount}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
                <button
                  type="button"
                  onClick={() => {
                    userResetRef.current = true;
                    startGame();
                  }}
                  className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-black px-5 py-3.5 font-black hover:from-amber-300 hover:to-orange-400 transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart
                </button>
                <button
                  onClick={() => {
                    userResetRef.current = true;
                    setPhase('start');
                  }}
                  className="rounded-2xl border-2 border-yellow-500/35 bg-neutral-900/90 px-5 py-3.5 font-black text-yellow-200 hover:bg-neutral-800 transition-all active:scale-[0.99]"
                >
                  Change difficulty
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
