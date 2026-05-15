"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { APP_ICON, isAppIconArt } from "@/lib/appIcon";
import type { NowPlaying, Station } from "@/lib/types";

interface NowPlayingCardProps {
  station: Station | null;
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  loading?: boolean;
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
}: NowPlayingCardProps) {
  const art = nowPlaying?.art ?? station?.defaultArt ?? null;
  const coverSrc = resolveCoverSrc(art, station, loading);
  const artist = nowPlaying?.artist ?? station?.name ?? "Kies een station";
  const title = nowPlaying?.title ?? (station ? "Klik om te luisteren" : "");
  const progress =
    nowPlaying && nowPlaying.duration > 0
      ? Math.min(100, (nowPlaying.elapsed / nowPlaying.duration) * 100)
      : 0;
  const showLiveBadge =
    isPlaying && (station?.id === "live" || nowPlaying?.isLive);

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
    <section className="flex shrink-0 flex-col items-center px-4 pb-4 pt-2">
      <div className="relative mb-4 aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg shadow-black/40">
        {displayedSrc ? (
          <Image
            key={displayedSrc}
            src={displayedSrc}
            alt={`${artist} - ${title}`}
            fill
            className="album-art-enter object-cover rounded-2xl"
            sizes="280px"
            priority
            unoptimized={displayedSrc.startsWith("http")}
          />
        ) : (
          <div className="h-full w-full rounded-2xl bg-[var(--card)]" aria-hidden />
        )}
        {showLiveBadge && !loading && (
          <span className="absolute bottom-2 right-2 rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs font-medium text-white">
            LIVE
          </span>
        )}
      </div>
      <h2 className="max-w-full truncate text-center text-xl font-semibold text-white">
        {title}
      </h2>
      <p className="max-w-full truncate text-center text-sm text-[var(--secondary)]">
        {artist}
      </p>
      {station && nowPlaying && nowPlaying.duration > 0 && (
        <div className="mt-3 w-full max-w-[280px]">
          <div className="h-1 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-1000"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {nowPlaying.listeners > 0 && (
            <p className="mt-1 text-center text-xs text-[var(--text-muted)]">
              {nowPlaying.listeners}{" "}
              {nowPlaying.listeners === 1 ? "luisteraar" : "luisteraars"}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
