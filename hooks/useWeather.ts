"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WEATHER_SERVER_CACHE_MS } from "@/lib/weatherConstants";
import type { WeatherData } from "@/lib/types";

/** Aligned with server cache — avoids pointless /api/weather traffic. */
const POLL_INTERVAL = WEATHER_SERVER_CACHE_MS;

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchAtRef = useRef(0);

  const fetchWeather = useCallback(async (force = false) => {
    if (document.visibilityState === "hidden") return;
    if (
      !force &&
      lastFetchAtRef.current &&
      Date.now() - lastFetchAtRef.current < POLL_INTERVAL - 60_000
    ) {
      return;
    }
    try {
      const res = await fetch("/api/weather", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Weer niet beschikbaar");
        setWeather(null);
        return;
      }
      const data = (await res.json()) as WeatherData;
      lastFetchAtRef.current = Date.now();
      setWeather(data);
      setError(null);
    } catch {
      setError("Weer niet beschikbaar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWeather(true);
    const id = setInterval(() => void fetchWeather(false), POLL_INTERVAL);

    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchWeather(false);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchWeather]);

  return { weather, loading, error };
}
