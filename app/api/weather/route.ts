import { NextResponse } from "next/server";
import { fetchHarlingenWeather } from "@/lib/weather";

export async function GET() {
  const weather = await fetchHarlingenWeather();
  if (!weather) {
    return NextResponse.json(
      { error: "Weather unavailable. Set OPENWEATHER_API_KEY in .env.local" },
      { status: 503 },
    );
  }
  return NextResponse.json(weather);
}
