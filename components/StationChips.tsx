"use client";

import { stationLabel } from "@/lib/stationLabels";
import type { Station } from "@/lib/types";

interface StationChipsProps {
  stations: Station[];
  currentStation: Station | null;
  isPlaying: boolean;
  onSelect: (station: Station) => void;
}

export function StationChips({
  stations,
  currentStation,
  isPlaying,
  onSelect,
}: StationChipsProps) {
  return (
    <section className="shrink-0 px-4 pb-3" aria-label="Stations">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        Stations
      </h3>
      <div className="scrollbar-themed flex gap-2 overflow-x-auto pb-1 is-scrolling">
        {stations.map((station) => {
          const active =
            currentStation?.id === station.id && isPlaying;
          const selected = currentStation?.id === station.id;
          return (
            <button
              key={station.id}
              type="button"
              onClick={() => onSelect(station)}
              aria-current={active ? "true" : undefined}
              aria-pressed={selected}
              className={`station-chip shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : selected
                    ? "border-[var(--primary)]/60 bg-[var(--primary)]/15 text-white"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] hover:border-[var(--primary)]/50 hover:text-white"
              }`}
            >
              {stationLabel(station)}
              {station.id === "live" && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--danger)] align-middle" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
