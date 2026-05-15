import { KNOWN_AZURA_DEFAULT_ART } from "./stations";
import { trackArtKey } from "./trackKey";

const MB_USER_AGENT = "BensMusicPWA/1.0 (https://benswebradio.nl)";
const ART_CACHE_TTL_MS = 60 * 60 * 1000;
const ART_CACHE_MAX = 120;

const artCache = new Map<string, { url: string; expires: number }>();

function normalizeArtworkUrl(url: string | null | undefined): string | null {
  const value = url?.trim();
  if (!value) return null;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("http://")) return `https://${value.slice("http://".length)}`;
  return value;
}

function cleanLookupText(input: string): string {
  return input
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(remaster(?:ed)?|version|edit|mono|stereo)\b/gi, " ")
    .replace(/[\s_-]{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildLookupCandidates(artist: string, title: string): Array<{ artist: string; title: string }> {
  const rawArtist = artist.trim();
  const rawTitle = title.trim();
  const cleanArtist = cleanLookupText(rawArtist);
  const cleanTitle = cleanLookupText(rawTitle);

  const candidates: Array<{ artist: string; title: string }> = [];
  const seen = new Set<string>();
  const pushCandidate = (a: string, t: string) => {
    const key = trackArtKey(a, t);
    if (!key || seen.has(key)) return;
    seen.add(key);
    candidates.push({ artist: a, title: t });
  };

  pushCandidate(rawArtist, rawTitle);
  pushCandidate(rawArtist, cleanTitle);
  pushCandidate(cleanArtist, cleanTitle);
  return candidates.filter((c) => c.artist || c.title);
}

function getCachedArtwork(artist: string, title: string): string | null {
  const key = trackArtKey(artist, title);
  const entry = artCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    artCache.delete(key);
    return null;
  }
  return entry.url;
}

function setCachedArtwork(artist: string, title: string, url: string | null): void {
  if (!url) return;
  const key = trackArtKey(artist, title);
  if (artCache.size >= ART_CACHE_MAX && !artCache.has(key)) {
    const oldest = artCache.keys().next().value;
    if (oldest) artCache.delete(oldest);
  }
  artCache.set(key, { url, expires: Date.now() + ART_CACHE_TTL_MS });
}

export function isGenericAzuraArt(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  return KNOWN_AZURA_DEFAULT_ART.test(url.trim());
}

export async function lookupItunesCoverArt(
  artist: string,
  title: string,
): Promise<string | null> {
  const term = encodeURIComponent(`${artist} ${title}`.trim());
  if (!term || term === "%20") return null;

  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=1`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: { artworkUrl100?: string }[];
    };
    const art = data.results?.[0]?.artworkUrl100;
    if (!art) return null;
    return normalizeArtworkUrl(art.replace("100x100bb", "600x600bb"));
  } catch {
    return null;
  }
}

export async function lookupMusicBrainzCoverArt(
  artist: string,
  title: string,
): Promise<string | null> {
  const query = encodeURIComponent(`recording:"${title}" AND artist:"${artist}"`);
  const searchUrl = `https://musicbrainz.org/ws/2/recording?query=${query}&fmt=json&limit=1`;

  try {
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": MB_USER_AGENT },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    });
    if (!searchRes.ok) return null;

    const searchData = (await searchRes.json()) as {
      recordings?: { releases?: { id: string }[] }[];
    };
    const releaseId = searchData.recordings?.[0]?.releases?.[0]?.id;
    if (!releaseId) return null;

    const artRes = await fetch(
      `https://coverartarchive.org/release/${releaseId}`,
      {
        headers: { "User-Agent": MB_USER_AGENT },
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!artRes.ok) return null;

    const artData = (await artRes.json()) as {
      images?: {
        front?: boolean;
        image?: string;
        thumbnails?: { small?: string; large?: string };
      }[];
    };
    const front = artData.images?.find((img) => img.front) ?? artData.images?.[0];
    if (!front) return null;

    return normalizeArtworkUrl(
      front.thumbnails?.large ??
      front.image ??
      front.thumbnails?.small ??
      null
    );
  } catch {
    return null;
  }
}

export async function findGenericCoverArt(
  artist: string,
  title: string,
): Promise<string | null> {
  if (!artist.trim() && !title.trim()) return null;

  const candidates = buildLookupCandidates(artist, title);
  for (const candidate of candidates) {
    const [itunes, musicBrainz] = await Promise.allSettled([
      lookupItunesCoverArt(candidate.artist, candidate.title),
      lookupMusicBrainzCoverArt(candidate.artist, candidate.title),
    ]);

    if (itunes.status === "fulfilled" && itunes.value) return itunes.value;
    if (musicBrainz.status === "fulfilled" && musicBrainz.value) {
      return musicBrainz.value;
    }
  }

  return null;
}

export async function resolveArtwork(
  artist: string,
  title: string,
  azuraArt?: string | null,
  fallback?: string | null,
): Promise<string | null> {
  const normalizedFallback = normalizeArtworkUrl(fallback);
  const normalizedAzuraArt = normalizeArtworkUrl(azuraArt);

  if (normalizedAzuraArt && !isGenericAzuraArt(normalizedAzuraArt)) {
    setCachedArtwork(artist, title, normalizedAzuraArt);
    return normalizedAzuraArt;
  }

  const cached = getCachedArtwork(artist, title);
  if (cached && cached !== normalizedFallback) return cached;
  if (cached && cached === normalizedFallback) {
    artCache.delete(trackArtKey(artist, title));
  }

  const generic = await findGenericCoverArt(artist, title);
  const resolved = normalizeArtworkUrl(generic) ?? normalizedFallback ?? null;
  if (generic && resolved) {
    setCachedArtwork(artist, title, resolved);
  }
  return resolved;
}
