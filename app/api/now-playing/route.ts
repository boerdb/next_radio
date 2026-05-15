import { NextRequest, NextResponse } from "next/server";
import { resolveArtwork } from "@/lib/artwork";
import { AZURACAST_BASE } from "@/lib/stations";
import type { NowPlaying } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const stationId = request.nextUrl.searchParams.get("station");
  if (!stationId || !/^station[1-3]$/.test(stationId)) {
    return NextResponse.json({ error: "Invalid station" }, { status: 400 });
  }

  try {
    const res = await fetch(`${AZURACAST_BASE}/api/nowplaying/${stationId}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Azuracast unavailable" }, { status: 502 });
    }

    const data = await res.json();
    const np = data.now_playing;
    const song = np?.song;

    if (!song) {
      return NextResponse.json(null);
    }

    const artist = song.artist ?? "";
    const title = song.title ?? "";
    const art = await resolveArtwork(
      artist,
      title,
      song.art,
      data.station?.fallback_art,
    );

    const result: NowPlaying = {
      artist,
      title,
      art,
      elapsed: np.elapsed ?? 0,
      duration: np.duration ?? 0,
      listeners: data.listeners?.current ?? 0,
      isLive: data.live?.is_live ?? false,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch now playing" }, { status: 500 });
  }
}
