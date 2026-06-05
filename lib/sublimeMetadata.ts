const SUBLIME_NOW_PLAYING_URL =
  "https://api.mediahuisradio.nl/api/nowplaying?stationKey=sublime";

const CACHE_MS = 15_000;

type CacheEntry = {
  value: SublimeNowPlaying | null;
  at: number;
};

let cache: CacheEntry | null = null;

export type SublimeNowPlaying = {
  artist: string;
  title: string;
  albumArt: string | null;
  duration: number;
};

export async function fetchSublimeNowPlaying(): Promise<SublimeNowPlaying | null> {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.value;
  }

  const res = await fetch(SUBLIME_NOW_PLAYING_URL, {
    headers: {
      "User-Agent": "BensMusicPWA/1.0 (https://benswebradio.nl)",
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Sublime now playing HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    artist?: string;
    title?: string;
    albumArt?: string;
    duration?: number;
  };

  const artist = data.artist?.trim() ?? "";
  const title = data.title?.trim() ?? "";

  if (!artist && !title) {
    cache = { value: null, at: Date.now() };
    return null;
  }

  const result: SublimeNowPlaying = {
    artist: artist || "Sublime FM",
    title: title || "Live",
    albumArt: data.albumArt?.trim() || null,
    duration: typeof data.duration === "number" ? data.duration : 0,
  };

  cache = { value: result, at: Date.now() };
  return result;
}
