"use client";

import { useWeather } from "@/hooks/useWeather";
import { WeatherIcon } from "./WeatherIcon";

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

  const updatedLabel = formatWeatherAge(weather.updatedAt);

  return (
    <div className="mx-4 mt-3 grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5">
      <WeatherIcon
        icon={weather.icon}
        description={weather.description}
        size={44}
        className="mt-0.5"
      />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
          {weather.location}
        </p>
        <p className="text-pretty text-sm capitalize leading-snug text-white">
          {weather.description}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-2xl font-bold leading-none text-[var(--secondary)]">
          {weather.temp}°
        </p>
        <p className="mt-1 max-w-[11rem] text-pretty text-right text-xs leading-snug text-[var(--text-muted)] sm:max-w-none">
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
