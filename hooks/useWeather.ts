"use client";

import { useCallback, useEffect, useState } from "react";
import type { WeatherData } from "@/lib/types";

const POLL_INTERVAL = 10 * 60 * 1000;
/** Wait after load so radio stream + metadata get network priority first. */
const INITIAL_DELAY_MS = 8_000;

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (document.visibilityState === "hidden") return;
    try {
      const res = await fetch("/api/weather", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Weer niet beschikbaar");
        setWeather(null);
        return;
      }
      const data = (await res.json()) as WeatherData;
      setWeather(data);
      setError(null);
    } catch {
      setError("Weer niet beschikbaar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => void fetchWeather(), INITIAL_DELAY_MS);
    const id = setInterval(() => void fetchWeather(), POLL_INTERVAL);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [fetchWeather]);

  return { weather, loading, error };
}
