"use client";

import type { Station } from "@/lib/types";

interface PlayerBarProps {
  station: Station | null;
  isPlaying: boolean;
  loading: boolean;
  volume: number;
  muted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
}

export function PlayerBar({
  station,
  isPlaying,
  loading,
  volume,
  muted,
  onTogglePause,
  onToggleMute,
  onVolumeChange,
}: PlayerBarProps) {
  const effectiveVolume = muted ? 0 : volume;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--toolbar)] px-4 py-3 safe-bottom">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <button
          type="button"
          onClick={onTogglePause}
          disabled={!station}
          aria-label={isPlaying ? "Pauzeren" : "Afspelen"}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white transition-opacity disabled:opacity-40"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : isPlaying ? (
            <PauseIcon />
          ) : (
            <PlayIcon />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {station?.name ?? "Geen station"}
          </p>
          <p className="truncate text-xs text-[var(--text-muted)]">
            {station ? (isPlaying ? "Speelt af" : "Gepauzeerd") : "Selecteer een station"}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? "Geluid aan" : "Geluid uit"}
          className="shrink-0 text-[var(--text-muted)] hover:text-white"
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
          className="w-20 accent-[var(--primary)]"
          aria-label="Volume"
        />
      </div>
    </footer>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
    </svg>
  );
}

function MuteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  );
}
