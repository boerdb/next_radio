"use client";

import { connectionStatusLabel } from "@/lib/connectionStatus";
import type { ConnectionMode } from "@/lib/connectionStatus";

interface ConnectionStatusProps {
  mode: ConnectionMode;
  loading: boolean;
  isPlaying: boolean;
}

export function ConnectionStatus({
  mode,
  loading,
  isPlaying,
}: ConnectionStatusProps) {
  const label = connectionStatusLabel(mode, loading, isPlaying);
  const active = mode !== "idle";

  return (
    <div
      className="mx-4 flex shrink-0 items-center justify-center gap-2 py-1"
      aria-live="polite"
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          loading && isPlaying
            ? "animate-pulse bg-[var(--warning)]"
            : active && isPlaying
              ? "bg-[var(--success)]"
              : active
                ? "bg-[var(--text-muted)]"
                : "bg-[var(--border)]"
        }`}
        aria-hidden
      />
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
    </div>
  );
}
