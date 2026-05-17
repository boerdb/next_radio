import { type NextRequest, NextResponse } from "next/server";
import { resolveArtwork } from "@/lib/artwork";
import { fetchIcyStreamTitle, parseArtistTitle } from "@/lib/npoMetadata";
import { getStationById } from "@/lib/stations";
import type { NowPlaying } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const station = id ? getStationById(id) : undefined;

  if (!station) {
    return NextResponse.json({ error: "Unknown station" }, { status: 400 });
  }

  const fallback: NowPlaying = {
    artist: station.name,
    title: "Live",
    art: station.defaultArt ?? null,
    elapsed: 0,
    duration: 0,
    listeners: 0,
    isLive: false,
  };

  try {
    const streamTitle = await fetchIcyStreamTitle(station.streamUrl);
    const { artist, title } = parseArtistTitle(streamTitle);
    const art = await resolveArtwork(
      artist,
      title,
      null,
      station.defaultArt ?? null,
    );

    const result: NowPlaying = {
      artist: artist || station.name,
      title: title || "Live",
      art,
      elapsed: 0,
      duration: 0,
      listeners: 0,
      isLive: false,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error(`ICY metadata error (${station.id}):`, err);
    return NextResponse.json(fallback);
  }
}
