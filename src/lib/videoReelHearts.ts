import { supabase } from './supabase';

const STORAGE_LIKED = 'kaedys-reel-liked-v1';
const STORAGE_LOCAL_COUNTS = 'kaedys-reel-local-counts-v1';

function readLikedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_LIKED);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? new Set(arr.filter((x): x is string => typeof x === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function writeLikedSet(s: Set<string>) {
  localStorage.setItem(STORAGE_LIKED, JSON.stringify([...s]));
}

function readLocalCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_LOCAL_COUNTS);
    const o = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(o)) {
      const n = typeof v === 'number' ? v : Number(v);
      if (Number.isFinite(n) && n >= 0) out[k] = Math.floor(n);
    }
    return out;
  } catch {
    return {};
  }
}

function writeLocalCounts(c: Record<string, number>) {
  localStorage.setItem(STORAGE_LOCAL_COUNTS, JSON.stringify(c));
}

export function hasUserLikedReel(videoId: string): boolean {
  return readLikedSet().has(videoId);
}

export async function fetchVideoReelCounts(
  videoIds: string[]
): Promise<Record<string, number>> {
  const base: Record<string, number> = {};
  for (const id of videoIds) base[id] = 0;

  const { data, error } = await supabase.from('video_reel_likes').select('video_id, heart_count');
  if (error || !data) {
    const local = readLocalCounts();
    for (const id of videoIds) {
      base[id] = local[id] ?? 0;
    }
    return base;
  }

  for (const row of data) {
    if (videoIds.includes(row.video_id)) {
      base[row.video_id] = Number(row.heart_count) || 0;
    }
  }
  return base;
}

/** One like per browser per video (local); count synced via Supabase when possible. */
export async function heartVideoReel(videoId: string): Promise<{ ok: boolean; counts?: Record<string, number> }> {
  if (hasUserLikedReel(videoId)) {
    return { ok: false };
  }

  const { error } = await supabase.rpc('increment_video_reel_heart', { p_video_id: videoId });

  if (error) {
    const local = readLocalCounts();
    local[videoId] = (local[videoId] ?? 0) + 1;
    writeLocalCounts(local);
    const liked = readLikedSet();
    liked.add(videoId);
    writeLikedSet(liked);
    return { ok: true, counts: { ...local } };
  }

  const liked = readLikedSet();
  liked.add(videoId);
  writeLikedSet(liked);

  const { data } = await supabase.from('video_reel_likes').select('video_id, heart_count');
  const out: Record<string, number> = {};
  if (data) {
    for (const row of data) {
      out[row.video_id] = Number(row.heart_count) || 0;
    }
  }
  return { ok: true, counts: out };
}
