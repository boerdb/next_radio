"use client";

import { useEffect, useState } from "react";
import { shouldShowAndroidInstallBanner } from "@/lib/isAndroidInstallable";
import {
  dismissIosInstallBanner,
  shouldShowIosInstallBanner,
} from "@/lib/isIosInstallable";
import { usePwaUpdate } from "@/hooks/usePwaUpdate";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const { updateAvailable, applyUpdate, dismissUpdate } = usePwaUpdate();
  const [showIosInstall, setShowIosInstall] = useState(false);
  const [showAndroidInstall, setShowAndroidInstall] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShowIosInstall(shouldShowIosInstallBanner());
    setShowAndroidInstall(shouldShowAndroidInstallBanner());
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Instellingen"
      onClick={onClose}
    >
      <div
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl sm:rounded-2xl safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Instellingen</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-white/10 hover:text-white"
            aria-label="Sluiten"
          >
            <CloseIcon />
          </button>
        </div>

        {updateAvailable && (
          <section className="mb-4 rounded-xl border border-[var(--secondary)]/40 bg-[var(--background)] p-4">
            <p className="mb-1 font-medium text-white">Nieuwe versie</p>
            <p className="mb-3 text-xs text-[var(--text-muted)]">
              Vernieuw als je niet aan het luisteren bent — anders stopt de
              muziek kort.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  applyUpdate();
                  onClose();
                }}
                className="flex-1 rounded-lg bg-[var(--secondary)] py-2 text-sm font-semibold text-[var(--background)]"
              >
                Nu vernieuwen
              </button>
              <button
                type="button"
                onClick={dismissUpdate}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)]"
              >
                Later
              </button>
            </div>
          </section>
        )}

        {showIosInstall && (
          <section className="mb-4 rounded-xl border border-[var(--primary)]/40 bg-[var(--background)] p-4">
            <p className="mb-2 font-medium text-white">Op iPhone installeren</p>
            <ol className="list-decimal space-y-1 pl-4 text-sm text-[var(--text-muted)]">
              <li>
                Tik op <strong className="text-white">Delen</strong>{" "}
                <ShareIcon />
              </li>
              <li>
                Kies <strong className="text-white">Zet op beginscherm</strong>
              </li>
            </ol>
            <button
              type="button"
              onClick={() => {
                dismissIosInstallBanner();
                setShowIosInstall(false);
              }}
              className="mt-3 text-xs text-[var(--text-muted)] underline"
            >
              Niet meer tonen
            </button>
          </section>
        )}

        {showAndroidInstall && (
          <section className="mb-4 rounded-xl border border-[var(--primary)]/40 bg-[var(--background)] p-4">
            <p className="mb-2 font-medium text-white">Op Android installeren</p>
            <p className="text-sm text-[var(--text-muted)]">
              Menu <span aria-hidden>(⋮)</span> →{" "}
              <strong className="text-white">App installeren</strong> of{" "}
              <strong className="text-white">Toevoegen aan startscherm</strong>.
            </p>
          </section>
        )}

        <section className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--text-muted)]">
          <p className="mb-1 font-medium text-white">Achtergrond luisteren</p>
          <p>
            Op iPhone kan muziek stoppen als je andere apps sluit in de
            app-switcher. Laat Bens Music open staan voor het beste resultaat.
          </p>
        </section>
      </div>
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

function ShareIcon() {
  return (
    <svg
      className="inline-block align-text-bottom"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.27 3.27 0 000-1.39l7.05-4.11A2.99 2.99 0 1016.5 3a2.99 2.99 0 00-.04.5L9.4 7.62a3 3 0 100 4.76l7.05 4.12c.26.88 1.09 1.5 2.05 1.5 1.22 0 2.2-.98 2.2-2.2s-.98-2.2-2.2-2.2z" />
    </svg>
  );
}
