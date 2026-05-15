"use client";

import { useCallback, useEffect, useState } from "react";
import type { WeatherData } from "@/lib/types";

const POLL_INTERVAL = 10 * 60 * 1000;

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch("/api/weather");
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
    fetchWeather();
    const id = setInterval(fetchWeather, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchWeather]);

  return { weather, loading, error };
}
