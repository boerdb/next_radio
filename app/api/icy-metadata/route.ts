import { type NextRequest, NextResponse } from "next/server";
import { resolveArtwork } from "@/lib/artwork";
import {
  fetchIcyStreamTitle,
  isLikelyNonMusicIcyTitle,
  parseArtistTitle,
} from "@/lib/npoMetadata";
import { fetchSublimeNowPlaying } from "@/lib/sublimeMetadata";
import { fetchTritonNowPlaying } from "@/lib/tritonMetadata";
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
    isLive: false,
  };

  try {
    if (station.id === "sublime") {
      const sublime = await fetchSublimeNowPlaying();
      if (!sublime) {
        return NextResponse.json(fallback);
      }

      const result: NowPlaying = {
        artist: sublime.artist,
        title: sublime.title,
        art: sublime.albumArt ?? station.defaultArt ?? null,
        isLive: false,
      };

      return NextResponse.json(result);
    }

    if (station.tritonMount) {
      const triton = await fetchTritonNowPlaying(station.tritonMount).catch(
        () => null,
      );
      if (triton) {
        const result: NowPlaying = {
          artist: triton.artist,
          title: triton.title,
          art: await resolveArtwork(
            triton.artist,
            triton.title,
            station.defaultArt ?? null,
          ),
          isLive: false,
        };
        return NextResponse.json(result);
      }
    }

    const streamTitle = await fetchIcyStreamTitle(station.streamUrl);

    if (!streamTitle.trim()) {
      return NextResponse.json(fallback);
    }

    if (isLikelyNonMusicIcyTitle(streamTitle, station.name)) {
      return NextResponse.json(fallback);
    }

    const { artist, title } = parseArtistTitle(streamTitle, {
      defaultArtist: station.name,
      defaultTitle: "Live",
    });
    // Alleen een hoes zoeken bij "Artiest - Titel"; losse slogans geven willekeurige covers.
    const art =
      artist && title
        ? await resolveArtwork(artist, title, station.defaultArt ?? null)
        : (station.defaultArt ?? null);

    const result: NowPlaying = {
      artist: artist || station.name,
      title: title || "Live",
      art,
      isLive: false,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error(`ICY metadata error (${station.id}):`, err);
    return NextResponse.json(fallback);
  }
}
