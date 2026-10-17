"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { APP_ICON, isAppIconArt, isLoadingPlaceholder } from "@/lib/appIcon";
import { connectionStatusLabel, type ConnectionMode } from "@/lib/connectionStatus";
import type { NowPlaying, Station } from "@/lib/types";

interface NowPlayingCardProps {
  station: Station | null;
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  loading?: boolean;
  connectionMode: ConnectionMode;
}

function resolveCoverSrc(
  art: string | null | undefined,
  station: Station | null,
  loading: boolean,
): string {
  const hasRealArt = art && !isAppIconArt(art);
  if (loading && !hasRealArt) return APP_ICON;
  return art ?? station?.defaultArt ?? APP_ICON;
}

export function NowPlayingCard({
  station,
  nowPlaying,
  isPlaying,
  loading = false,
  connectionMode,
}: NowPlayingCardProps) {
  const art = nowPlaying?.art ?? station?.defaultArt ?? null;
  const coverSrc = resolveCoverSrc(art, station, loading);
  const hasTrack =
    !!nowPlaying?.title &&
    nowPlaying.title !== station?.name &&
    nowPlaying.title !== "Live" &&
    !isLoadingPlaceholder(nowPlaying);
  const title = station
    ? hasTrack
      ? nowPlaying!.title
      : station.name
    : "Welkom bij Bens Music";
  const artist = station
    ? hasTrack
      ? nowPlaying!.artist
      : loading
        ? "Verbinden…"
        : isPlaying
          ? "Live radio"
          : "Tik op afspelen om te luisteren"
    : "Kies hieronder een station";
  const progress =
    nowPlaying && nowPlaying.duration > 0
      ? Math.min(100, (nowPlaying.elapsed / nowPlaying.duration) * 100)
      : 0;
  const showLiveBadge =
    isPlaying && !loading && (station?.id === "live" || nowPlaying?.isLive);

  const [displayedSrc, setDisplayedSrc] = useState<string | null>(null);
  const swapTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastCoverRef = useRef<string | null>(null);

  useEffect(() => {
    if (!coverSrc) {
      lastCoverRef.current = null;
      setDisplayedSrc(null);
      return;
    }

    if (coverSrc === lastCoverRef.current) return;
    lastCoverRef.current = coverSrc;

    if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);

    setDisplayedSrc(null);
    swapTimeoutRef.current = setTimeout(() => {
      setDisplayedSrc(coverSrc);
    }, 35);

    return () => {
      if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
    };
  }, [coverSrc]);

  return (
    <section
      className="flex shrink-0 flex-col items-center px-6 pb-4 pt-1 md:py-8"
      aria-label="Nu aan het spelen"
    >
      <div className="relative mb-5 aspect-square w-[min(62vw,32dvh,300px)] md:w-full md:max-w-[360px]">
        {/* Zachte gloed van de hoes achter de artwork */}
        {displayedSrc && (
          <Image
            src={displayedSrc}
            alt=""
            fill
            aria-hidden
            className="scale-110 rounded-3xl object-cover opacity-50 blur-2xl saturate-150"
            sizes="300px"
            unoptimized={displayedSrc.startsWith("http")}
          />
        )}
        <div className="relative h-full w-full overflow-hidden rounded-3xl bg-[var(--card)] shadow-2xl shadow-black/60 ring-1 ring-white/10">
          {displayedSrc ? (
            <Image
              key={displayedSrc}
              src={displayedSrc}
              alt={`${artist} - ${title}`}
              fill
              className="album-art-enter object-cover"
              sizes="(min-width: 768px) 360px, 300px"
              priority
              unoptimized={displayedSrc.startsWith("http")}
            />
          ) : (
            <div className="h-full w-full bg-[var(--card)]" aria-hidden />
          )}
          {showLiveBadge && (
            <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
              Live
            </span>
          )}
        </div>
      </div>

      <div className="w-full max-w-[360px] text-center">
        <h2 className="truncate text-xl font-bold tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-1 truncate text-[15px] font-medium text-[var(--primary-soft)]">
          {artist}
        </p>

        {station && nowPlaying && nowPlaying.duration > 0 && (
          <div className="mx-auto mt-4 w-full max-w-[280px]">
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-tint)] transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <StatusLine
          mode={connectionMode}
          loading={loading}
          isPlaying={isPlaying}
          listeners={nowPlaying?.listeners ?? 0}
        />
      </div>
    </section>
  );
}

function StatusLine({
  mode,
  loading,
  isPlaying,
  listeners,
}: {
  mode: ConnectionMode;
  loading: boolean;
  isPlaying: boolean;
  listeners: number;
}) {
  if (mode === "idle") return null;
  const label = connectionStatusLabel(mode, loading, isPlaying);
  const dot =
    loading && isPlaying
      ? "animate-pulse bg-[var(--warning)]"
      : isPlaying
        ? "bg-[var(--success)]"
        : "bg-[var(--text-subtle)]";

  return (
    <p
      className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-[var(--text-muted)]"
      aria-live="polite"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      {isPlaying || loading ? label : "Gepauzeerd"}
      {listeners > 0 && (
        <>
          <span aria-hidden>·</span>
          {listeners} {listeners === 1 ? "luisteraar" : "luisteraars"}
        </>
      )}
    </p>
  );
}
