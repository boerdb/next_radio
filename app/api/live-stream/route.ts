import { LIVE_STREAM_INTERNAL_BASE } from "@/lib/stations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PASSTHROUGH_HEADERS = [
  "content-type",
  "icy-br",
  "ice-audio-info",
  "icy-name",
  "icy-genre",
  "icy-url",
  "icy-samplerate",
  "icy-description",
  "icy-pub",
];

/** Proxy live audio via Next.js — same HTTPS origin as the PWA (works on 5G). */
export async function GET(request: Request) {
  const upstream = `${LIVE_STREAM_INTERNAL_BASE}?type=.mp3`;

  try {
    const res = await fetch(upstream, {
      cache: "no-store",
      signal: request.signal,
      headers: {
        // Raw MP3. Interleaved ICY metadata makes iOS report silence.
        "Icy-MetaData": "0",
      },
    });

    if (!res.ok || !res.body) {
      return new Response("Live stream niet bereikbaar", { status: 502 });
    }

    const headers = new Headers();
    for (const name of PASSTHROUGH_HEADERS) {
      const value = res.headers.get(name);
      if (value) headers.set(name, value);
    }
    if (!headers.get("content-type")) {
      headers.set("Content-Type", "audio/mpeg");
    }
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    headers.set("X-Accel-Buffering", "no");
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(res.body, { status: 200, headers });
  } catch {
    return new Response("Live stream niet bereikbaar", { status: 502 });
  }
}
