"use client";

import Image from "next/image";
import type { NowPlaying, Station } from "@/lib/types";

const APP_ICON = "/icons/icon-512.png";

interface NowPlayingCardProps {
  station: Station | null;
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  loading?: boolean;
}

export function NowPlayingCard({
  station,
  nowPlaying,
  isPlaying,
  loading = false,
}: NowPlayingCardProps) {
  const art = nowPlaying?.art ?? station?.defaultArt ?? "/icons/icon-192.png";
  const artist = nowPlaying?.artist ?? station?.name ?? "Kies een station";
  const title = nowPlaying?.title ?? (station ? "Klik om te luisteren" : "");
  const progress =
    nowPlaying && nowPlaying.duration > 0
      ? Math.min(100, (nowPlaying.elapsed / nowPlaying.duration) * 100)
      : 0;
  const showLiveBadge =
    isPlaying && (station?.id === "live" || nowPlaying?.isLive);

  return (
    <section className="flex shrink-0 flex-col items-center px-4 pb-4 pt-2">
      <div className="relative mb-4 aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg shadow-black/40">
        <Image
          src={art}
          alt={`${artist} - ${title}`}
          fill
          className={`object-cover rounded-2xl transition-opacity duration-300 ${loading ? "opacity-25" : "opacity-100"}`}
          sizes="280px"
          priority
          unoptimized={art.startsWith("http")}
        />
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <Image
              src={APP_ICON}
              alt=""
              width={160}
              height={160}
              className="rounded-2xl animate-pulse drop-shadow-lg"
              priority
            />
          </div>
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
