import { supabase } from './supabase';

const STORAGE_LOCAL_COUNTS = 'kaedys-reel-local-counts-v1';

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

/** Public totals per video — always shown (kahit na-unheart na ang user). */
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

async function refreshCountsMap(): Promise<Record<string, number> | undefined> {
  const { data, error } = await supabase.from('video_reel_likes').select('video_id, heart_count');
  if (error || !data) return undefined;
  const out: Record<string, number> = {};
  for (const row of data) {
    out[row.video_id] = Number(row.heart_count) || 0;
  }
  return out;
}

/** Current session: alin sa mga reel ang naka-heart na (isang beses lang kada user kada video). */
export async function fetchUserLikedReelIds(
  videoIds: string[]
): Promise<Record<string, boolean>> {
  const base: Record<string, boolean> = {};
  for (const id of videoIds) base[id] = false;

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) return base;

  const { data, error } = await supabase
    .from('video_reel_user_likes')
    .select('video_id')
    .in('video_id', videoIds);

  if (error || !data) return base;

  for (const row of data) {
    if (typeof row.video_id === 'string' && videoIds.includes(row.video_id)) {
      base[row.video_id] = true;
    }
  }
  return base;
}

/**
 * Like — idagdag lang ang count kung first time ng user para sa video na ito (server-side).
 * Returns ok: true kung nagdagdag ng heart; false kung duplicate / error.
 */
export async function heartVideoReel(videoId: string): Promise<{ ok: boolean; counts?: Record<string, number> }> {
  const { data, error } = await supabase.rpc('reel_heart_like', { p_video_id: videoId });

  if (error || data !== true) {
    return { ok: false };
  }

  const counts = await refreshCountsMap();
  return { ok: true, counts };
}

/**
 * Unlike — bawas sa total; ang numero ng hearts ay nandiyan pa rin (public total).
 */
export async function unheartVideoReel(videoId: string): Promise<{ ok: boolean; counts?: Record<string, number> }> {
  const { data, error } = await supabase.rpc('reel_heart_unlike', { p_video_id: videoId });

  if (error || data !== true) {
    return { ok: false };
  }

  const counts = await refreshCountsMap();
  return { ok: true, counts };
}
