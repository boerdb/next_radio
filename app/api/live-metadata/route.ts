import { NextResponse } from "next/server";
import { resolveArtwork } from "@/lib/artwork";
import { parseLiveMetadataRaw } from "@/lib/liveMetadata";
import { getStationById, LIVE_METADATA_URL } from "@/lib/stations";
import type { NowPlaying } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(LIVE_METADATA_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json(null);
    }

    const raw = await res.text();
    const { artist, title } = parseLiveMetadataRaw(raw);
    const liveStation = getStationById("live");
    const art = await resolveArtwork(
      artist,
      title,
      null,
      liveStation?.defaultArt ?? null,
    );

    const result: NowPlaying = {
      artist: artist || "Bens Web Radio Live",
      title: title || "Live",
      art,
      elapsed: 0,
      duration: 0,
      listeners: 0,
      isLive: true,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(null);
  }
}
