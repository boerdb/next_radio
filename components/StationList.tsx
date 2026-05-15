"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Station } from "@/lib/types";

const SCROLLBAR_HIDE_MS = 800;

interface StationListProps {
  stations: Station[];
  currentStation: Station | null;
  isPlaying: boolean;
  onSelect: (station: Station) => void;
}

export function StationList({
  stations,
  currentStation,
  isPlaying,
  onSelect,
}: StationListProps) {
  const [scrolling, setScrolling] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleScroll = useCallback(() => {
    setScrolling(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setScrolling(false), SCROLLBAR_HIDE_MS);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col px-4 pb-28">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--text-muted)]">
        Kies een station
      </h3>
      <ul
        className={`scrollbar-themed flex flex-col gap-2 overflow-y-auto${scrolling ? " is-scrolling" : ""}`}
        onScroll={handleScroll}
      >
        {stations.map((station) => {
          const active =
            currentStation?.id === station.id && isPlaying;
          return (
            <li key={station.id}>
              <button
                type="button"
                onClick={() => onSelect(station)}
                aria-current={active ? "true" : undefined}
                className={`station-item w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                  active
                    ? "border-[var(--primary)] bg-[var(--primary)]/15"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50"
                }`}
              >
                <span className="block font-medium text-white">
                  {station.name}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {active ? "Nu aan het spelen" : "Klik om te luisteren"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
