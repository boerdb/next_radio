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
    .replace(/[`´‘’]/g, "'") // "I`m Coming Out" vindt Apple alleen als "I'm"
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

  // Zonder media=music vindt Apple sommige nummers niet (bv. Taylor Swift - Opalite).
  // De Amerikaanse winkel mist veel Nederlandse nummers en andersom: vraag beide.
  const [us, nl] = await Promise.all(
    ITUNES_COUNTRIES.map((country) =>
      lookupItunesIn(term, artist, title, country, status),
    ),
  );
  if (!us && !nl) {
    // "Kris Kross Amsterdam X Antoon X Sigourney K" vindt Apple niet, alleen de
    // eerste artiest wel. Nog één keer zoeken met alleen die artiest.
    const lead = firstArtist(artist).trim();
    if (lead && lead !== artist.trim()) {
      return lookupItunesCoverArt(lead, title, status);
    }
    return null;
  }
  if (!us || !nl) return (us ?? nl)!.url;
  return us.score >= nl.score ? us.url : nl.url;
}

const ITUNES_COUNTRIES = ["US", "NL"] as const;

/** Zelfde vergelijking als de losse webspeler, zodat beide dezelfde hoes kiezen. */
const matchKey = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
const firstArtist = (s: string) =>
  s.split(/\s+(?:x|&|feat\.?|ft\.?|featuring|vs\.?)\s+|[,;]/i)[0] ?? s;

function scoreItunesHit(
  hitArtist: string,
  hitTitle: string,
  wantArtist: string,
  wantTitle: string,
): number {
  const a = matchKey(hitArtist);
  const t = matchKey(cleanLookupText(hitTitle));
  const wa = matchKey(wantArtist);
  const wt = matchKey(cleanLookupText(wantTitle));
  const fa = matchKey(firstArtist(hitArtist));
  const fwa = matchKey(firstArtist(wantArtist));
  let score = 0;
  if (a && wa && (a.includes(wa) || wa.includes(a) || (fa && fwa && fa === fwa))) score += 2;
  if (t && wt && (t.includes(wt) || wt.includes(t))) score += 2;
  if (t && t === wt) score += 1;
  return score;
}

async function lookupItunesIn(
  term: string,
  artist: string,
  title: string,
  country: string,
  status?: LookupStatus,
): Promise<{ url: string; score: number } | null> {
  // limit=1 geeft bij Apple soms 0 resultaten terwijl er wel treffers zijn
  // (bv. The Weeknd - Dancing In The Flames); vraag er een paar en kies de beste.
  const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=8&country=${country}`;

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
      results?: { artworkUrl100?: string; artistName?: string; trackName?: string }[];
    };
    let best: { art: string; score: number } | null = null;
    for (const r of data.results ?? []) {
      if (!r.artworkUrl100) continue;
      const score = scoreItunesHit(r.artistName ?? "", r.trackName ?? "", artist, title);
      if (!best || score > best.score) best = { art: r.artworkUrl100, score };
    }
    // Minstens artiest of titel moet kloppen, anders liever het logo dan een verkeerde hoes.
    if (!best || best.score < 2) return null;
    const art = normalizeArtworkUrl(best.art.replace(/\/\d+x\d+bb\./, "/600x600bb."));
    return art ? { url: art, score: best.score } : null;
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
