import type { WeatherData } from "./types";

const HARLINGEN_LAT = 52.657;
const HARLINGEN_LON = 5.219;

export async function fetchHarlingenWeather(): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", String(HARLINGEN_LAT));
  url.searchParams.set("lon", String(HARLINGEN_LON));
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "nl");
  url.searchParams.set("appid", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    main: { temp: number; feels_like: number };
    weather: { description: string; icon: string }[];
    wind: { speed: number };
  };

  const w = data.weather[0];
  return {
    location: "Harlingen",
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    description: w?.description ?? "",
    icon: w?.icon ?? "01d",
    windSpeed: Math.round(data.wind.speed * 3.6),
  };
}
