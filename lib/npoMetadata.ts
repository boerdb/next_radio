/** Parse ICY StreamTitle; uses '; terminator so apostrophes in titles work (e.g. "Don't"). */
export function parseStreamTitleFromIcyBlock(buffer: Buffer): string {
  const text = buffer.toString("utf8");
  const match = text.match(/StreamTitle='([\s\S]*?)';/);
  return match?.[1]?.replace(/\\'/g, "'").trim() ?? "";
}

export function parseArtistTitle(raw: string): { artist: string; title: string } {
  const text = raw.trim();
  if (!text) {
    return { artist: "NPO Soul & Jazz", title: "Live" };
  }

  const separators = [" - ", " – ", " — ", " | "];
  for (const sep of separators) {
    const idx = text.indexOf(sep);
    if (idx > 0) {
      return {
        artist: text.slice(0, idx).trim(),
        title: text.slice(idx + sep.length).trim(),
      };
    }
  }

  return { artist: "", title: text };
}

let cachedTitle: { value: string; at: number } | null = null;
const CACHE_MS = 15_000;

export async function fetchNpoStreamTitle(): Promise<string> {
  if (cachedTitle && Date.now() - cachedTitle.at < CACHE_MS) {
    return cachedTitle.value;
  }
  const { NPO_STREAM_URL } = await import("./stations");

  const res = await fetch(NPO_STREAM_URL, {
    headers: {
      "Icy-MetaData": "1",
      "User-Agent": "BensMusicPWA/1.0 (https://benswebradio.nl)",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok || !res.body) {
    throw new Error(`NPO stream HTTP ${res.status}`);
  }

  const metaInt = parseInt(res.headers.get("icy-metaint") ?? "0", 10);
  if (metaInt <= 0) {
    throw new Error("No icy-metaint header");
  }

  const reader = res.body.getReader();
  const targetBytes = metaInt + 1 + 255 * 16;
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < targetBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.length;
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  const combined = Buffer.concat(chunks);
  if (combined.length <= metaInt) {
    throw new Error("Insufficient stream data for ICY metadata");
  }

  const metaByteLen = combined[metaInt];
  if (metaByteLen === 0) {
    return "";
  }

  const metaLen = metaByteLen * 16;
  const streamTitle = parseStreamTitleFromIcyBlock(
    combined.subarray(metaInt + 1, metaInt + 1 + metaLen),
  );
  cachedTitle = { value: streamTitle, at: Date.now() };
  return streamTitle;
}
