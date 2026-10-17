"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NowPlaying, Station } from "@/lib/types";

const SCROLLBAR_HIDE_MS = 800;

interface StationListProps {
  stations: Station[];
  currentStation: Station | null;
  isPlaying: boolean;
  loading: boolean;
  nowPlaying: NowPlaying | null;
  onSelect: (station: Station) => void;
}

export function StationList({
  stations,
  currentStation,
  isPlaying,
  loading,
  nowPlaying,
  onSelect,
}: StationListProps) {
  const [scrolling, setScrolling] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeRef = useRef<HTMLLIElement>(null);

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

  // Houd het actieve station in beeld (bv. na volgende/vorige)
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentStation?.id]);

  return (
    <section
      className="flex min-h-0 flex-1 flex-col px-4 md:h-full md:max-h-[560px] md:px-0 md:py-8"
      aria-labelledby="stations-heading"
    >
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2
          id="stations-heading"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]"
        >
          Stations
        </h2>
        <span className="text-xs text-[var(--text-subtle)]">
          {stations.length} zenders
        </span>
      </div>
      <ul
        className={`scrollbar-themed -mx-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-y-contain px-1 pb-3${scrolling ? " is-scrolling" : ""}`}
        onScroll={handleScroll}
      >
        {stations.map((station) => {
          const isCurrent = currentStation?.id === station.id;
          const isActive = isCurrent && (isPlaying || loading);
          const subtitle = stationSubtitle(station, isCurrent, isPlaying, loading, nowPlaying);

          return (
            <li key={station.id} ref={isCurrent ? activeRef : undefined}>
              <button
                type="button"
                onClick={() => onSelect(station)}
                aria-current={isCurrent ? "true" : undefined}
                aria-label={
                  isCurrent && isPlaying
                    ? `${station.name} pauzeren`
                    : `${station.name} afspelen`
                }
                className={`station-item group flex w-full items-center gap-3 rounded-2xl border p-2.5 pr-4 text-left transition-[background-color,border-color,transform] duration-150 ${
                  isCurrent
                    ? "border-[var(--primary)]/60 bg-[var(--primary)]/15 shadow-lg shadow-[var(--primary)]/10"
                    : "border-transparent bg-white/[0.035] hover:border-white/10 hover:bg-white/[0.06]"
                }`}
              >
                <StationAvatar station={station} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-semibold text-white">
                      {station.name}
                    </span>
                    {station.id === "live" && (
                      <span className="shrink-0 rounded bg-[var(--danger)]/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-[#ff8a80]">
                        Live
                      </span>
                    )}
                  </span>
                  <span
                    className={`mt-0.5 block truncate text-[13px] ${
                      isCurrent ? "text-[var(--primary-soft)]" : "text-[var(--text-subtle)]"
                    }`}
                  >
                    {subtitle}
                  </span>
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {isCurrent && loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary-soft)] border-t-transparent" />
                  ) : isActive ? (
                    <EqualizerIcon />
                  ) : (
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity ${
                        isCurrent
                          ? "bg-[var(--primary)] opacity-100"
                          : "bg-white/10 opacity-60 group-hover:opacity-100"
                      }`}
                    >
                      <PlayIcon />
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function stationSubtitle(
  station: Station,
  isCurrent: boolean,
  isPlaying: boolean,
  loading: boolean,
  nowPlaying: NowPlaying | null,
): string {
  if (!isCurrent) return station.id === "live" ? "Bens eigen uitzending" : "Tik om te luisteren";
  if (loading) return "Verbinden…";
  if (!isPlaying) return "Gepauzeerd";
  const title = nowPlaying?.title;
  if (title && title !== "Live" && title !== station.name && nowPlaying.artist !== station.name) {
    return `${nowPlaying.artist} – ${title}`;
  }
  return "Speelt nu";
}

const AVATAR_GRADIENTS = [
  "from-[#9c27b0] to-[#4a148c]",
  "from-[#ab47bc] to-[#6a1b9a]",
  "from-[#8e24aa] to-[#311b92]",
  "from-[#ba68c8] to-[#7b1fa2]",
];

function StationAvatar({ station }: { station: Station }) {
  const local = station.defaultArt?.startsWith("/");
  if (station.defaultArt) {
    return (
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--card)] ring-1 ring-white/10">
        <Image
          src={station.defaultArt}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
          unoptimized={!local}
        />
      </span>
    );
  }

  const initials = station.name
    .replace(/[^\p{L}\p{N}& ]/gu, "")
    .split(/\s+/)
    .filter((w) => w && w !== "&")
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const gradient =
    AVATAR_GRADIENTS[
      [...station.id].reduce((sum, c) => sum + c.charCodeAt(0), 0) %
        AVATAR_GRADIENTS.length
    ];

  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-sm font-bold tracking-wide text-white ring-1 ring-white/10`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function EqualizerIcon() {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden>
      <span className="eq-bar block h-full w-[3px] rounded-full bg-[var(--primary-soft)]" />
      <span className="eq-bar block h-full w-[3px] rounded-full bg-[var(--primary-soft)]" />
      <span className="eq-bar block h-full w-[3px] rounded-full bg-[var(--primary-soft)]" />
    </span>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" />
    </svg>
  );
}
