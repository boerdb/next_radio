import { NextRequest, NextResponse } from "next/server";
import { resolveArtwork } from "@/lib/artwork";

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get("artist") ?? "";
  const title = request.nextUrl.searchParams.get("title") ?? "";
  const azuraArt = request.nextUrl.searchParams.get("azuraArt");
  const fallback = request.nextUrl.searchParams.get("fallback");

  const art = await resolveArtwork(artist, title, azuraArt, fallback);
  return NextResponse.json({ art });
}
