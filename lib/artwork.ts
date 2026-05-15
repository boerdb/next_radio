import { KNOWN_AZURA_DEFAULT_ART } from "./stations";

const MB_USER_AGENT = "BensMusicPWA/1.0 (https://benswebradio.nl)";

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
    return art.replace("100x100bb", "600x600bb");
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

    return (
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

  const [itunes, musicBrainz] = await Promise.allSettled([
    lookupItunesCoverArt(artist, title),
    lookupMusicBrainzCoverArt(artist, title),
  ]);

  if (itunes.status === "fulfilled" && itunes.value) return itunes.value;
  if (musicBrainz.status === "fulfilled" && musicBrainz.value) {
    return musicBrainz.value;
  }

  return null;
}

export async function resolveArtwork(
  artist: string,
  title: string,
  azuraArt?: string | null,
  fallback?: string | null,
): Promise<string | null> {
  if (azuraArt && !isGenericAzuraArt(azuraArt)) {
    return azuraArt;
  }

  const generic = await findGenericCoverArt(artist, title);
  return generic ?? fallback ?? null;
}
