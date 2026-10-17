"use client";

import Image from "next/image";
import { APP_ICON } from "@/lib/appIcon";
import type { NowPlaying, Station } from "@/lib/types";

interface PlayerBarProps {
  station: Station | null;
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  loading: boolean;
  volume: number;
  muted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function PlayerBar({
  station,
  nowPlaying,
  isPlaying,
  loading,
  volume,
  muted,
  onTogglePause,
  onToggleMute,
  onVolumeChange,
  onNext,
  onPrevious,
}: PlayerBarProps) {
  const effectiveVolume = muted ? 0 : volume;
  const thumb = nowPlaying?.art ?? station?.defaultArt ?? station?.logo ?? APP_ICON;
  const subtitle =
    nowPlaying?.title &&
    nowPlaying.title !== station?.name &&
    nowPlaying.title !== "Live"
      ? `${nowPlaying.artist} · ${nowPlaying.title}`
      : station
        ? isPlaying
          ? "Speelt af"
          : "Gepauzeerd"
        : "Selecteer een station";

  return (
    <footer className="shrink-0 border-t border-white/[0.06] bg-[var(--toolbar)]/85 px-4 pt-2.5 backdrop-blur-xl player-safe-bottom">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-3 md:px-4">
        {/* Links: huidig station (vanaf tablet) */}
        <div className="hidden min-w-0 items-center gap-3 md:flex">
          {station && (
            <>
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                <Image
                  src={thumb}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover"
                  unoptimized={thumb.startsWith("http") || thumb.endsWith(".svg")}
                />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{station.name}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">{subtitle}</p>
              </div>
            </>
          )}
        </div>
        <div className="md:hidden" />

        {/* Midden: transportknoppen */}
        <div className="flex items-center gap-2">
          <IconButton label="Vorig station" onClick={onPrevious} disabled={!station}>
            <PrevIcon />
          </IconButton>
          <button
            type="button"
            onClick={onTogglePause}
            aria-label={isPlaying ? "Pauzeren" : "Afspelen"}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-tint)] to-[var(--primary-shade)] text-white shadow-lg shadow-[var(--primary-glow)] transition-transform hover:scale-105 active:scale-95"
          >
            {loading ? (
              <span className="h-6 w-6 animate-spin rounded-full border-[2.5px] border-white border-t-transparent" />
            ) : isPlaying ? (
              <PauseIcon />
            ) : (
              <PlayIcon />
            )}
          </button>
          <IconButton label="Volgend station" onClick={onNext} disabled={!station}>
            <NextIcon />
          </IconButton>
        </div>

        {/* Rechts: volume */}
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? "Geluid aan" : "Geluid uit"}
            aria-pressed={muted}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-white"
          >
            {muted || effectiveVolume === 0 ? <MuteIcon /> : <VolumeIcon />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={effectiveVolume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="volume-slider w-full min-w-0 max-w-[110px]"
            style={{ "--fill": `${effectiveVolume * 100}%` } as React.CSSProperties}
            aria-label="Volume"
          />
        </div>
      </div>
    </footer>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="translate-x-[1px]">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1.2" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zm13 .87v12.26a1 1 0 0 1-1.52.85L8.6 13.4a1.6 1.6 0 0 1 0-2.8l8.88-4.58A1 1 0 0 1 19 5.87z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zM5 5.87v12.26a1 1 0 0 0 1.52.85l8.88-4.58a1.6 1.6 0 0 0 0-2.8L6.52 5.02A1 1 0 0 0 5 5.87z" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
    </svg>
  );
}

function MuteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  );
}
