import { NextResponse } from "next/server";
import { resolveArtwork } from "@/lib/artwork";
import { parseLiveMetadataRaw } from "@/lib/liveMetadata";
import { getStationById, LIVE_METADATA_URL } from "@/lib/stations";
import { trackArtKey } from "@/lib/trackKey";
import type { NowPlaying } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Avoid repeated cover lookups + extra load on the live stream host. */
let lastLiveTrackKey = "";
let lastLiveResult: NowPlaying | null = null;

export async function GET() {
  try {
    const res = await fetch(LIVE_METADATA_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(null);
    }

    const raw = await res.text();
    const { artist, title } = parseLiveMetadataRaw(raw);
    const displayArtist = artist || "Bens Web Radio Live";
    const displayTitle = title || "Live";
    const trackKey = trackArtKey(displayArtist, displayTitle);

    if (trackKey && trackKey === lastLiveTrackKey && lastLiveResult) {
      return NextResponse.json(lastLiveResult);
    }

    const liveStation = getStationById("live");
    const art =
      trackKey && trackKey === lastLiveTrackKey && lastLiveResult?.art
        ? lastLiveResult.art
        : await resolveArtwork(
            displayArtist,
            displayTitle,
            null,
            liveStation?.defaultArt ?? null,
          );

    const result: NowPlaying = {
      artist: displayArtist,
      title: displayTitle,
      art,
      elapsed: 0,
      duration: 0,
      listeners: 0,
      isLive: true,
    };

    lastLiveTrackKey = trackKey;
    lastLiveResult = result;

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(null);
  }
}
