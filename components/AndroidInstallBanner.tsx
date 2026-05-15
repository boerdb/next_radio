"use client";

import { useAndroidInstallPrompt } from "@/hooks/useAndroidInstallPrompt";

export function AndroidInstallBanner() {
  const { visible, canInstall, install, dismiss } = useAndroidInstallPrompt();

  if (!visible) return null;

  return (
    <div
      className="android-install-banner mx-4 mt-2 shrink-0 rounded-xl border border-[var(--primary)]/40 bg-[var(--card)] p-4 shadow-lg shadow-black/30"
      role="region"
      aria-label="App installeren op Android"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/20">
            <img
              src="/icons/icon-192.png"
              alt=""
              width={32}
              height={32}
              className="rounded-md"
            />
          </div>
          <div>
            <p className="font-semibold text-white">Bens Music op je telefoon</p>
            <p className="text-xs text-[var(--text-muted)]">
              Installeer de app voor sneller luisteren
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-[var(--text-muted)] hover:bg-white/10 hover:text-white"
          aria-label="Sluiten"
        >
          <CloseIcon />
        </button>
      </div>

      {canInstall ? (
        <div>
          <p className="text-sm text-[var(--foreground)]">
            Voeg Bens Music toe aan je startscherm voor snelle toegang en
            fullscreen luisteren.
          </p>
          <button
            type="button"
            onClick={() => void install()}
            className="mt-3 w-full rounded-lg bg-[var(--primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-tint)]"
          >
            App installeren
          </button>
        </div>
      ) : (
        <ol className="space-y-2.5 text-sm text-[var(--foreground)]">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
              1
            </span>
            <span>
              Tik rechtsboven op het{" "}
              <strong className="text-[var(--secondary)]">menu</strong>{" "}
              <span aria-hidden>(⋮)</span>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
              2
            </span>
            <span>
              Kies{" "}
              <strong className="text-[var(--secondary)]">
                App installeren
              </strong>
              <span className="text-[var(--text-muted)]">
                {" "}
                (of &quot;Toevoegen aan startscherm&quot;)
              </span>
              .
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
              3
            </span>
            <span>
              Bevestig met{" "}
              <strong className="text-[var(--secondary)]">Installeren</strong>.
            </span>
          </li>
        </ol>
      )}

      <button
        type="button"
        onClick={dismiss}
        className="mt-3 w-full rounded-lg border border-[var(--border)] py-2 text-xs text-[var(--text-muted)] hover:border-[var(--primary)]/50 hover:text-white"
      >
        Begrepen, verberg dit bericht
      </button>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.3 5.71a1 1 0 00-1.41 0L12 10.59 7.11 5.7A1 1 0 105.7 7.11L10.59 12l-4.89 4.89a1 1 0 101.41 1.41L12 13.41l4.89 4.89a1 1 0 001.41-1.41L13.41 12l4.89-4.89a1 1 0 000-1.4z" />
    </svg>
  );
}
