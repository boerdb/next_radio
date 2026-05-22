import { NextResponse } from "next/server";
import { fetchHarlingenWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  const weather = await fetchHarlingenWeather();
  if (!weather) {
    return NextResponse.json(
      {
        error:
          "Weer niet beschikbaar. Zet OPENWEATHER_API_KEY in .env.local of .env.production op de server.",
      },
      { status: 503, headers: NO_CACHE_HEADERS },
    );
  }
  return NextResponse.json(weather, { status: 200, headers: NO_CACHE_HEADERS });
}
