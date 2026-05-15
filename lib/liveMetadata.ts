export function parseArtistTitleFromMetadata(text: string): {
  artist: string;
  title: string;
} {
  const cleaned = text.trim();
  if (!cleaned) return { artist: "", title: "" };

  const separators = [" - ", " – ", " — ", " | "];
  for (const sep of separators) {
    const idx = cleaned.indexOf(sep);
    if (idx > 0) {
      return {
        artist: cleaned.slice(0, idx).trim(),
        title: cleaned.slice(idx + sep.length).trim(),
      };
    }
  }

  return { artist: "", title: cleaned };
}

/** Parse RSAS/live metadata: JSON `{"metadata":"Artist - Title"}` or ICY StreamTitle. */
export function parseLiveMetadataRaw(raw: string): {
  artist: string;
  title: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { artist: "", title: "" };

  if (trimmed.startsWith("{")) {
    try {
      const data = JSON.parse(trimmed) as {
        metadata?: string;
        artist?: string;
        title?: string;
        song?: string;
      };

      if (data.artist && data.title) {
        return {
          artist: String(data.artist).trim(),
          title: String(data.title).trim(),
        };
      }

      const meta =
        data.metadata ?? data.song ?? (typeof data.title === "string" ? data.title : "");
      if (meta) {
        return parseArtistTitleFromMetadata(String(meta));
      }
    } catch {
      /* fall through */
    }
  }

  const icyMatch = trimmed.match(/StreamTitle='([\s\S]*?)';/);
  if (icyMatch?.[1]) {
    return parseArtistTitleFromMetadata(icyMatch[1]);
  }

  return parseArtistTitleFromMetadata(trimmed);
}
