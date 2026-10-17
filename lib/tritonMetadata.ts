/** Now playing via Triton Digital (StreamTheWorld) — voor streams zonder ICY-titel. */

const CACHE_MS = 10_000;
/** Ruim na het einde van het laatste nummer: waarschijnlijk reclame/nieuws. */
const ENDED_GRACE_MS = 60_000;

export type TritonNowPlaying = {
  artist: string;
  title: string;
};

const cache = new Map<string, { value: TritonNowPlaying | null; at: number }>();

function property(block: string, name: string): string {
  const open = `<property name="${name}"><![CDATA[`;
  const start = block.indexOf(open);
  if (start < 0) return "";
  const end = block.indexOf("]]>", start + open.length);
  return end < 0 ? "" : block.slice(start + open.length, end).trim();
}

export async function fetchTritonNowPlaying(
  mountName: string,
): Promise<TritonNowPlaying | null> {
  const cached = cache.get(mountName);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;

  const url = `https://np.tritondigital.com/public/nowplaying?mountName=${encodeURIComponent(mountName)}&numberToFetch=1&eventType=track`;
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Triton now playing HTTP ${res.status}`);

  const xml = await res.text();
  const block = xml.match(/<nowplaying-info\b[\s\S]*?<\/nowplaying-info>/)?.[0] ?? "";
  const artist = property(block, "track_artist_name");
  const title = property(block, "cue_title");
  const start = Number(property(block, "cue_time_start"));
  const duration = Number(property(block, "cue_time_duration"));
  const ended =
    start > 0 && duration > 0 && Date.now() > start + duration + ENDED_GRACE_MS;

  const value = artist && title && !ended ? { artist, title } : null;
  cache.set(mountName, { value, at: Date.now() });
  return value;
}
