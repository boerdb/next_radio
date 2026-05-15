import { NextResponse } from "next/server";
import { resolveArtwork } from "@/lib/artwork";
import {
  fetchNpoStreamTitle,
  parseArtistTitle,
} from "@/lib/npoMetadata";
import type { NowPlaying } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const streamTitle = await fetchNpoStreamTitle();
    const { artist, title } = parseArtistTitle(streamTitle);
    const art = await resolveArtwork(artist, title);

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
    return NextResponse.json({
      artist: "NPO Soul & Jazz",
      title: "Live",
      art: null,
      elapsed: 0,
      duration: 0,
      listeners: 0,
      isLive: false,
    } satisfies NowPlaying);
  }
}
