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
      { error: "Weather unavailable. Set OPENWEATHER_API_KEY in .env.local" },
      { status: 503 },
      { headers: NO_CACHE_HEADERS },
    );
  }
  return NextResponse.json(weather, { headers: NO_CACHE_HEADERS });
}
