"use client";

import { usePwaUpdate } from "@/hooks/usePwaUpdate";

export function PwaUpdateBanner() {
  const { updateAvailable, applyUpdate, dismissUpdate } = usePwaUpdate();

  if (!updateAvailable) return null;

  return (
    <div
      className="pwa-update-banner mx-4 mt-2 shrink-0 rounded-xl border border-[var(--secondary)]/40 bg-[var(--card)] p-4 shadow-lg shadow-black/30"
      role="region"
      aria-label="Nieuwe versie beschikbaar"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)]/20 text-[var(--secondary)]">
            <UpdateIcon />
          </div>
          <div>
            <p className="font-semibold text-white">Nieuwe versie beschikbaar</p>
            <p className="text-xs text-[var(--text-muted)]">
              Vernieuw de app om de laatste verbeteringen te gebruiken
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissUpdate}
          className="shrink-0 rounded-lg p-1 text-[var(--text-muted)] hover:bg-white/10 hover:text-white"
          aria-label="Later"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={applyUpdate}
          className="flex-1 rounded-lg bg-[var(--secondary)] py-2.5 text-sm font-semibold text-[var(--background)] hover:opacity-90"
        >
          Nu vernieuwen
        </button>
        <button
          type="button"
          onClick={dismissUpdate}
          className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-muted)] hover:border-[var(--secondary)]/50 hover:text-white"
        >
          Later
        </button>
      </div>
    </div>
  );
}

function UpdateIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 11-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.3 5.71a1 1 0 00-1.41 0L12 10.59 7.11 5.7A1 1 0 105.7 7.11L10.59 12l-4.89 4.89a1 1 0 101.41 1.41L12 13.41l4.89 4.89a1 1 0 001.41-1.41L13.41 12l4.89-4.89a1 1 0 000-1.4z" />
    </svg>
  );
}
