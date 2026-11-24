const SUBLIME_NOW_PLAYING_URL =
  "https://api.mediahuisradio.nl/api/nowplaying?stationKey=sublime";

const CACHE_MS = 15_000;

type CacheEntry = {
  value: SublimeNowPlaying | null;
  at: number;
};

let cache: CacheEntry | null = null;

/** Wanneer het huidige nummer voor het eerst gezien is. */
let track: { key: string; since: number } | null = null;
const STALE_MARGIN_S = 60;

export type SublimeNowPlaying = {
  artist: string;
  title: string;
  albumArt: string | null;
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
  const albumArt = data.albumArt?.trim() || null;

  if (!artist && !title) {
    cache = { value: null, at: Date.now() };
    return null;
  }

  // Tijdens reclame/nieuws blijft de titel soms op het vorige nummer staan.
  // Sublime stuurt niet altijd een hoes mee (sinds nov 2026 vaak leeg), dus
  // daar niet meer op letten: een nummer dat ruim langer "speelt" dan het
  // duurt, is verlopen.
  const key = `${artist}|${title}`;
  const now = Date.now();
  if (!track || track.key !== key) {
    track = { key, since: now };
  }
  const duration = typeof data.duration === "number" ? data.duration : 0;
  if (duration > 0 && now - track.since > (duration + STALE_MARGIN_S) * 1000) {
    cache = { value: null, at: now };
    return null;
  }

  const result: SublimeNowPlaying = {
    artist: artist || "Sublime FM",
    title: title || "Live",
    albumArt,
  };

  cache = { value: result, at: Date.now() };
  return result;
}
