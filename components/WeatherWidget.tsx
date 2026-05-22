"use client";

import Image from "next/image";
import { useWeather } from "@/hooks/useWeather";

export function WeatherWidget() {
  const { weather, loading, error } = useWeather();

  if (loading) {
    return (
      <div className="mx-4 mt-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm text-[var(--text-muted)]">
        Weer laden...
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="mx-4 mt-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm text-[var(--text-muted)]">
        {error ?? "Weer niet beschikbaar"}
      </div>
    );
  }

  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
  const updatedLabel = formatWeatherAge(weather.updatedAt);

  return (
    <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5">
      <Image
        src={iconUrl}
        alt={weather.description}
        width={40}
        height={40}
        unoptimized
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
          {weather.location}
        </p>
        <p className="truncate text-sm capitalize text-white">
          {weather.description}
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-[var(--secondary)]">
          {weather.temp}°
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Voelt als {weather.feelsLike}° · Wind {weather.windSpeed} km/u
          {updatedLabel ? ` · ${updatedLabel}` : ""}
        </p>
      </div>
    </div>
  );
}

function formatWeatherAge(updatedAt?: number): string | null {
  if (!updatedAt) return null;
  const mins = Math.max(1, Math.round((Date.now() - updatedAt) / 60_000));
  if (mins < 60) return `${mins} min geleden`;
  const hours = Math.round(mins / 60);
  return `${hours} uur geleden`;
}
