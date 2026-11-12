import { getStoredArtwork, storeArtwork } from "./artStore";
import { trackArtKey } from "./trackKey";

const MB_USER_AGENT = "BensMusicPWA/1.0 (https://benswebradio.nl)";

/** Houdt bij of een zoekvraag mislukte (storing, time-out) in plaats van "niets gevonden". */
type LookupStatus = { failed: boolean };

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

export async function lookupItunesCoverArt(
  artist: string,
  title: string,
  status?: LookupStatus,
): Promise<string | null> {
  const term = encodeURIComponent(`${artist} ${title}`.trim());
  if (!term || term === "%20") return null;

  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=1`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      if (status) status.failed = true;
      return null;
    }
    const data = (await res.json()) as {
      results?: { artworkUrl100?: string }[];
    };
    const art = data.results?.[0]?.artworkUrl100;
    if (!art) return null;
    return normalizeArtworkUrl(art.replace("100x100bb", "600x600bb"));
  } catch {
    if (status) status.failed = true;
    return null;
  }
}

export async function lookupMusicBrainzCoverArt(
  artist: string,
  title: string,
  status?: LookupStatus,
): Promise<string | null> {
  const query = encodeURIComponent(`recording:"${title}" AND artist:"${artist}"`);
  const searchUrl = `https://musicbrainz.org/ws/2/recording?query=${query}&fmt=json&limit=1`;

  try {
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": MB_USER_AGENT },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    });
    if (!searchRes.ok) {
      if (status) status.failed = true;
      return null;
    }

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
    if (!artRes.ok) {
      // 404 = deze uitgave heeft geen hoes; al het andere is een storing.
      if (status && artRes.status !== 404) status.failed = true;
      return null;
    }

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
    if (status) status.failed = true;
    return null;
  }
}

type GenericResult = {
  url: string | null;
  /** Mag dit antwoord voorgoed onthouden worden? */
  certain: boolean;
};

async function findGenericCoverArt(
  artist: string,
  title: string,
): Promise<GenericResult> {
  if (!artist.trim() && !title.trim()) return { url: null, certain: false };

  const status: LookupStatus = { failed: false };
  const candidates = buildLookupCandidates(artist, title);
  for (const candidate of candidates) {
    const [itunes, musicBrainz] = await Promise.all([
      lookupItunesCoverArt(candidate.artist, candidate.title, status),
      lookupMusicBrainzCoverArt(candidate.artist, candidate.title, status),
    ]);

    if (itunes) return { url: itunes, certain: true };
    // Een hoes van MusicBrainz terwijl Apple haperde: wel tonen, maar de
    // volgende keer opnieuw zoeken, want Apple heeft meestal de betere.
    if (musicBrainz) return { url: musicBrainz, certain: !status.failed };
  }

  // "Niet gevonden" alleen onthouden als elke zoekvraag echt antwoord gaf.
  return { url: null, certain: !status.failed };
}

export async function resolveArtwork(
  artist: string,
  title: string,
  fallback?: string | null,
): Promise<string | null> {
  const normalizedFallback = normalizeArtworkUrl(fallback) ?? null;

  const stored = await getStoredArtwork(artist, title);
  if (stored) return stored;
  if (stored === null) return normalizedFallback;

  const { url, certain } = await findGenericCoverArt(artist, title);
  const resolved = normalizeArtworkUrl(url);
  if (certain) storeArtwork(artist, title, resolved);
  return resolved ?? normalizedFallback;
}
