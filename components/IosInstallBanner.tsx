"use client";

import { useEffect, useState } from "react";
import {
  dismissIosInstallBanner,
  shouldShowIosInstallBanner,
} from "@/lib/isIosInstallable";

export function IosInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowIosInstallBanner());
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    dismissIosInstallBanner();
    setVisible(false);
  };

  return (
    <div
      className="ios-install-banner mx-4 mt-2 shrink-0 rounded-xl border border-[var(--primary)]/40 bg-[var(--card)] p-4 shadow-lg shadow-black/30"
      role="region"
      aria-label="App installeren op iPhone of iPad"
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
            <p className="font-semibold text-white">Bens Music op je beginscherm</p>
            <p className="text-xs text-[var(--text-muted)]">
              Installeer de app voor sneller luisteren
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-lg p-1 text-[var(--text-muted)] hover:bg-white/10 hover:text-white"
          aria-label="Sluiten"
        >
          <CloseIcon />
        </button>
      </div>

      <ol className="space-y-2.5 text-sm text-[var(--foreground)]">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
            1
          </span>
          <span>
            Tik onderin Safari op het{" "}
            <strong className="inline-flex items-center gap-1 text-[var(--secondary)]">
              Deel
              <ShareIcon />
            </strong>
            -icoon.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
            2
          </span>
          <span>
            Kies{" "}
            <strong className="text-[var(--secondary)]">
              Zet op beginscherm
            </strong>
            <span className="text-[var(--text-muted)]">
              {" "}
              (of &quot;Voeg toe aan beginscherm&quot;)
            </span>
            .
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
            3
          </span>
          <span>
            Tik op <strong className="text-[var(--secondary)]">Voeg toe</strong>
            . De app verschijnt op je beginscherm.
          </span>
        </li>
      </ol>

      <button
        type="button"
        onClick={handleDismiss}
        className="mt-3 w-full rounded-lg border border-[var(--border)] py-2 text-xs text-[var(--text-muted)] hover:border-[var(--primary)]/50 hover:text-white"
      >
        Begrepen, verberg dit bericht
      </button>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
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
