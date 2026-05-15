import { NextResponse } from "next/server";
import { resolveArtwork } from "@/lib/artwork";
import {
  fetchNpoStreamTitle,
  parseArtistTitle,
} from "@/lib/npoMetadata";
import { getStationById } from "@/lib/stations";
import type { NowPlaying } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const streamTitle = await fetchNpoStreamTitle();
    const { artist, title } = parseArtistTitle(streamTitle);
    const npoStation = getStationById("nposoul");
    const art = await resolveArtwork(
      artist,
      title,
      null,
      npoStation?.defaultArt ?? null,
    );

    const result: NowPlaying = {
      artist: artist || "NPO Soul & Jazz",
      title: title || "Live",
      art,
      elapsed: 0,
      duration: 0,
      listeners: 0,
      isLive: false,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("NPO metadata error:", err);
    const npoStation = getStationById("nposoul");
    return NextResponse.json({
      artist: "NPO Soul & Jazz",
      title: "Live",
      art: npoStation?.defaultArt ?? null,
      elapsed: 0,
      duration: 0,
      listeners: 0,
      isLive: false,
    } satisfies NowPlaying);
  }
}
