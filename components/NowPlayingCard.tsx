"use client";

import Image from "next/image";
import { APP_ICON, isAppIconArt, isLoadingPlaceholder } from "@/lib/appIcon";
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
  const stationArt = station?.defaultArt ?? station?.logo ?? APP_ICON;
  const hasRealArt = art && !isAppIconArt(art);
  if (loading && !hasRealArt) return stationArt;
  return art ?? stationArt;
}

export function NowPlayingCard({
  station,
  nowPlaying,
  isPlaying,
  loading = false,
}: NowPlayingCardProps) {
  const coverSrc = resolveCoverSrc(nowPlaying?.art, station, loading);
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
      : isPlaying || loading
        ? "Live radio"
        : "Tik op afspelen om te luisteren"
    : "Kies hieronder een station";
  const showLiveBadge =
    isPlaying && !loading && (station?.id === "live" || nowPlaying?.isLive);

  return (
    <section
      className="flex shrink-0 flex-col items-center px-6 pb-4 pt-5 md:py-8"
      aria-label="Nu aan het spelen"
    >
      <div className="relative mb-5 aspect-square w-[min(62vw,32dvh,300px)] md:w-full md:max-w-[360px]">
        {/* Zachte gloed van de hoes achter de artwork */}
        {coverSrc && (
          <Image
            src={coverSrc}
            alt=""
            fill
            aria-hidden
            className="scale-110 rounded-3xl object-cover opacity-50 blur-2xl saturate-150"
            sizes="300px"
            unoptimized={coverSrc.startsWith("http") || coverSrc.endsWith(".svg")}
          />
        )}
        <div className="relative h-full w-full overflow-hidden rounded-3xl bg-[var(--card)] shadow-2xl shadow-black/60 ring-1 ring-white/10">
          {coverSrc ? (
            <Image
              key={coverSrc}
              src={coverSrc}
              alt={`${artist} - ${title}`}
              fill
              className="album-art-enter object-cover"
              sizes="(min-width: 768px) 360px, 300px"
              priority
              unoptimized={coverSrc.startsWith("http") || coverSrc.endsWith(".svg")}
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

        {station && <StatusLine loading={loading} isPlaying={isPlaying} />}
      </div>
    </section>
  );
}

function StatusLine({
  loading,
  isPlaying,
}: {
  loading: boolean;
  isPlaying: boolean;
}) {
  const [label, dot] = loading
    ? ["Verbinden…", "animate-pulse bg-[var(--warning)]"]
    : isPlaying
      ? ["Speelt af", "bg-[var(--success)]"]
      : ["Gepauzeerd", "bg-[var(--text-subtle)]"];

  return (
    <p
      className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-[var(--text-muted)]"
      aria-live="polite"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      {label}
    </p>
  );
}
