import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Volume2, VolumeX, X } from 'lucide-react';
import {
  fetchVideoReelCounts,
  hasUserLikedReel,
  heartVideoReel,
} from '../lib/videoReelHearts';

export type ReelItem = {
  id: string;
  label: string;
  /** Optional static poster only if you want a custom image instead of the video’s first frame. */
  poster?: string;
};

/** Try common paths: folder should be `public/Videos/` (capital V — case-sensitive sa hosting). */
function reelSourceList(id: string): { src: string; type: string }[] {
  return [
    { src: `/Videos/${id}.mp4`, type: 'video/mp4' },
    { src: `/videos/${id}.mp4`, type: 'video/mp4' },
    { src: `/Videos/${id}.webm`, type: 'video/webm' },
    { src: `/videos/${id}.webm`, type: 'video/webm' },
  ];
}

export const REEL_VIDEOS: ReelItem[] = [
  { id: 'video1', label: 'Spotlight 1' },
  { id: 'video2', label: 'Spotlight 2' },
  { id: 'video3', label: 'Spotlight 3' },
];

function formatHeartCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

type HomeReelsSectionProps = {
  className?: string;
};

type ReelMediaState = 'loading' | 'ready' | 'error';

export function HomeReelsSection({ className = '' }: HomeReelsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const touchStartX = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const v of REEL_VIDEOS) m[v.id] = hasUserLikedReel(v.id);
    return m;
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expandedVideoRef = useRef<HTMLVideoElement>(null);
  const [mediaState, setMediaState] = useState<Record<string, ReelMediaState>>({});
  /** User tapped speaker — kapag true, unmuted habang ito ang naka-autoplay na reel */
  const [audioEnabled, setAudioEnabled] = useState<Record<string, boolean>>({});

  const n = REEL_VIDEOS.length;
  const canPrev = n > 1 && activeIndex > 0;
  const canNext = n > 1 && activeIndex < n - 1;

  useEffect(() => {
    const ids = REEL_VIDEOS.map((v) => v.id);
    fetchVideoReelCounts(ids).then(setCounts);
  }, []);

  const setReelState = useCallback((id: string, s: ReelMediaState) => {
    setMediaState((prev) => ({ ...prev, [id]: s }));
  }, []);

  const scrollToIndex = useCallback((i: number) => {
    const el = slideRefs.current[REEL_VIDEOS[i]?.id];
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  const goNext = useCallback(() => {
    if (!canNext) return;
    scrollToIndex(activeIndex + 1);
  }, [activeIndex, canNext, scrollToIndex]);

  const goPrev = useCallback(() => {
    if (!canPrev) return;
    scrollToIndex(activeIndex - 1);
  }, [activeIndex, canPrev, scrollToIndex]);

  const onScrollSnap = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    const mid = root.getBoundingClientRect().left + root.getBoundingClientRect().width / 2;
    let best = 0;
    let bestDist = Infinity;
    REEL_VIDEOS.forEach((v, i) => {
      const slide = slideRefs.current[v.id];
      if (!slide) return;
      const r = slide.getBoundingClientRect();
      const c = r.left + r.width / 2;
      const d = Math.abs(c - mid);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActiveIndex(best);
  }, []);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    root.addEventListener('scroll', onScrollSnap, { passive: true });
    return () => root.removeEventListener('scroll', onScrollSnap);
  }, [onScrollSnap]);

  useEffect(() => {
    if (expandedId) return;
    const root = scrollRef.current;
    if (!root) return;

    const syncPlayback = () => {
      const vids = REEL_VIDEOS.map((v) => videoRefs.current[v.id]).filter(
        (el): el is HTMLVideoElement => !!el
      );
      if (vids.length === 0) return;

      let best: HTMLVideoElement | null = null;
      let bestRatio = 0;
      const rootR = root.getBoundingClientRect();

      for (const vid of vids) {
        const r = vid.getBoundingClientRect();
        const interLeft = Math.max(r.left, rootR.left);
        const interRight = Math.min(r.right, rootR.right);
        const interW = Math.max(0, interRight - interLeft);
        const ratio = r.width > 0 ? interW / r.width : 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = vid;
        }
      }

      for (const v of REEL_VIDEOS) {
        const vid = videoRefs.current[v.id];
        if (!vid) continue;
        if (best && vid === best && bestRatio >= 0.5) {
          vid.play().catch(() => {});
        } else {
          vid.pause();
        }
      }
    };

    const obs = new IntersectionObserver(syncPlayback, {
      root,
      rootMargin: '0px',
      threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
    });

    const t = window.setTimeout(() => {
      for (const v of REEL_VIDEOS) {
        const vid = videoRefs.current[v.id];
        if (vid) obs.observe(vid);
      }
      syncPlayback();
    }, 0);

    root.addEventListener('scroll', syncPlayback, { passive: true });
    window.addEventListener('resize', syncPlayback);

    return () => {
      window.clearTimeout(t);
      root.removeEventListener('scroll', syncPlayback);
      window.removeEventListener('resize', syncPlayback);
      obs.disconnect();
    };
  }, [expandedId, audioEnabled]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || n < 2) {
      touchStartX.current = null;
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -48) goNext();
    else if (dx > 48) goPrev();
  };

  const toggleReelAudio = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAudioEnabled((prev) => {
      const nextOn = !prev[id];
      queueMicrotask(() => {
        const v = videoRefs.current[id];
        if (!v) return;
        if (nextOn) {
          v.muted = false;
          v.play().catch(() => {});
        } else {
          v.muted = true;
        }
      });
      return { ...prev, [id]: nextOn };
    });
  };

  const onHeart = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedMap[videoId]) return;
    const res = await heartVideoReel(videoId);
    if (!res.ok) return;
    setLikedMap((m) => ({ ...m, [videoId]: true }));
    if (res.counts) {
      setCounts((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(res.counts!)) {
          if (typeof v === 'number') next[k] = v;
        }
        return next;
      });
    } else {
      const ids = REEL_VIDEOS.map((v) => v.id);
      fetchVideoReelCounts(ids).then(setCounts);
    }
  };

  const openExpanded = (videoId: string) => {
    setExpandedId(videoId);
    for (const v of REEL_VIDEOS) {
      videoRefs.current[v.id]?.pause();
    }
  };

  const closeExpanded = () => {
    setExpandedId(null);
  };

  useEffect(() => {
    if (!expandedId) return;
    const v = expandedVideoRef.current;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeExpanded();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      v.pause();
    };
  }, [expandedId]);

  const expandedItem = expandedId ? REEL_VIDEOS.find((v) => v.id === expandedId) : null;

  return (
    <section className={`max-w-full overflow-x-hidden ${className}`} aria-label="Featured videos">
      <div className="flex items-end justify-between gap-2 mb-2">
        <div>
          <div className="text-[11px] font-bold tracking-widest text-yellow-300/90">REELS</div>
          <div className="text-xs text-gray-400 mt-0.5">Swipe o arrows — tap para palakihin</div>
        </div>
        {n > 1 ? (
          <span className="text-[10px] font-semibold tabular-nums text-yellow-300/90 shrink-0">
            {activeIndex + 1}/{n}
          </span>
        ) : null}
      </div>

      <div className="relative max-w-full overflow-x-hidden px-0.5">
        {canPrev ? (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-1 top-1/2 z-10 -translate-y-1/2 p-1 rounded-lg text-yellow-400 hover:text-yellow-200 bg-black/50 border border-yellow-500/20 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60"
            aria-label="Previous reel"
          >
            <ChevronLeft className="w-5 h-5 drop-shadow-md" strokeWidth={2.5} />
          </button>
        ) : null}
        {canNext ? (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-1 top-1/2 z-10 -translate-y-1/2 p-1 rounded-lg text-yellow-400 hover:text-yellow-200 bg-black/50 border border-yellow-500/20 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60"
            aria-label="Next reel"
          >
            <ChevronRight className="w-5 h-5 drop-shadow-md" strokeWidth={2.5} />
          </button>
        ) : null}

        <div
          ref={scrollRef}
          onScroll={onScrollSnap}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1 pl-0.5 pr-0.5 justify-start sm:justify-center [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {REEL_VIDEOS.map((item, reelIndex) => {
            const count = counts[item.id] ?? 0;
            const liked = !!likedMap[item.id];
            const state = mediaState[item.id] ?? 'loading';
            const soundOn = !!audioEnabled[item.id];
            const isActiveReel = reelIndex === activeIndex;

            return (
              <div
                key={item.id}
                ref={(el) => {
                  slideRefs.current[item.id] = el;
                }}
                className="relative shrink-0 snap-center snap-always w-[min(42vw,10.5rem)] sm:w-[11rem]"
              >
                <button
                  type="button"
                  onClick={() => openExpanded(item.id)}
                  className="relative w-full rounded-xl overflow-hidden border border-yellow-500/25 bg-neutral-950 shadow-[0_8px_28px_rgba(0,0,0,0.4)] block cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80 aspect-[9/16] max-h-[min(34vh,200px)]"
                  aria-label={`Play ${item.label} fullscreen`}
                >
                  {/* Preview = mismong video (unang frame pag na-load); walang shared static image */}
                  <video
                    ref={(el) => {
                      videoRefs.current[item.id] = el;
                    }}
                    data-reel-id={item.id}
                    poster={item.poster}
                    className={`absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-300 ${
                      state === 'ready' ? 'opacity-100' : 'opacity-0'
                    }`}
                    muted={!(soundOn && isActiveReel)}
                    playsInline
                    loop
                    preload="auto"
                    onLoadedData={() => setReelState(item.id, 'ready')}
                    onError={() => setReelState(item.id, 'error')}
                  >
                    {reelSourceList(item.id).map((s) => (
                      <source key={s.src} src={s.src} type={s.type} />
                    ))}
                  </video>

                  {state === 'error' ? (
                    <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center bg-black/80 px-2 text-center">
                      <p className="text-[10px] text-yellow-200/90 leading-tight">
                        Hindi mahanap ang video. Ilagay ang file sa{' '}
                        <span className="font-mono text-yellow-300">public/Videos/{item.id}.mp4</span>
                      </p>
                    </div>
                  ) : null}

                  <div className="absolute inset-0 z-[3] bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />
                  <div className="absolute bottom-1.5 left-1.5 right-11 z-[3] pointer-events-none">
                    <span className="text-[10px] font-semibold text-yellow-200/95 drop-shadow-md truncate block">
                      {item.label}
                    </span>
                  </div>
                </button>

                {state !== 'error' ? (
                  <button
                    type="button"
                    onClick={(e) => toggleReelAudio(item.id, e)}
                    className="absolute top-2 right-2 z-20 rounded-full p-1.5 text-white/95 bg-black/45 border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.6)] backdrop-blur-[2px] transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70"
                    aria-label={soundOn ? 'Mute video sound' : 'Unmute video sound'}
                    title={soundOn ? 'Mute' : 'Tap for sound'}
                  >
                    {soundOn ? (
                      <Volume2 className="w-4 h-4 drop-shadow-md" strokeWidth={2.25} />
                    ) : (
                      <VolumeX className="w-4 h-4 text-white/85 drop-shadow-md" strokeWidth={2.25} />
                    )}
                  </button>
                ) : null}

                <div className="absolute bottom-2 right-2 z-20 pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => onHeart(item.id, e)}
                    className="flex flex-col items-center gap-0.5 rounded-md border-0 bg-transparent p-0.5 shadow-none transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
                    aria-pressed={liked}
                    aria-label={liked ? 'Liked' : 'Like video'}
                  >
                    <Heart
                      className={`w-6 h-6 transition-[filter,transform] ${
                        liked
                          ? 'fill-red-500 text-red-500 drop-shadow-[0_0_14px_rgba(239,68,68,0.95)]'
                          : 'text-red-500 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] hover:drop-shadow-[0_0_12px_rgba(248,113,113,0.75)]'
                      }`}
                      strokeWidth={2}
                    />
                    <span
                      className={`text-[9px] font-bold tabular-nums leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] ${
                        liked ? 'text-red-100' : 'text-red-200'
                      }`}
                    >
                      {formatHeartCount(count)}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {n > 1 ? (
        <div className="flex justify-center gap-1.5 mt-2.5">
          {REEL_VIDEOS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? 'w-5 bg-yellow-400' : 'w-1.5 bg-yellow-500/35 hover:bg-yellow-500/55'
              }`}
              aria-label={`Reel ${i + 1} of ${n}`}
            />
          ))}
        </div>
      ) : null}

      {expandedId && expandedItem ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 animate-menuBackdrop motion-reduce:animate-none"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded reel"
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-yellow-500/20 shrink-0">
            <span className="text-sm font-semibold text-yellow-300 truncate pr-2">
              {expandedItem.label}
            </span>
            <button
              type="button"
              onClick={closeExpanded}
              className="p-2 rounded-full text-yellow-300 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0 p-3 overflow-hidden">
            <div className="relative w-full max-w-[min(100%,320px)] max-h-[min(72vh,520px)] aspect-[9/16] rounded-xl overflow-hidden border border-yellow-500/20 bg-black">
              <video
                key={expandedId}
                ref={expandedVideoRef}
                poster={expandedItem.poster}
                className="absolute inset-0 z-[1] h-full w-full object-contain bg-black"
                controls
                playsInline
                loop
                autoPlay
              >
                {reelSourceList(expandedItem.id).map((s) => (
                  <source key={s.src} src={s.src} type={s.type} />
                ))}
              </video>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
