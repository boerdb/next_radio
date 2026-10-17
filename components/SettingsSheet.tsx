"use client";

import { useEffect, useState } from "react";
import { useAndroidInstallPrompt } from "@/hooks/useAndroidInstallPrompt";
import {
  dismissIosInstallBanner,
  isIosDevice,
  shouldShowIosInstallBanner,
} from "@/lib/isIosInstallable";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  updateAvailable: boolean;
  onApplyUpdate: () => void;
  onDismissUpdate: () => void;
}

export function SettingsSheet({
  open,
  onClose,
  updateAvailable,
  onApplyUpdate,
  onDismissUpdate,
}: SettingsSheetProps) {
  const android = useAndroidInstallPrompt();
  const [iosInstallHidden, setIosInstallHidden] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // Alleen client-side gerenderd (sheet is dicht bij de eerste render).
  const isIos = isIosDevice();
  const showIosInstall = !iosInstallHidden && shouldShowIosInstallBanner();

  return (
    <div
      className="overlay-enter fixed inset-0 z-[100] flex items-end justify-center bg-black/65 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Instellingen"
      onClick={onClose}
    >
      <div
        className="sheet-enter max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-[var(--card)] p-5 pt-3 shadow-2xl sm:rounded-3xl sm:pt-5 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Instellingen</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Sluiten"
          >
            <CloseIcon />
          </button>
        </div>

        {updateAvailable && (
          <section className="mb-4 rounded-2xl border border-[var(--primary)]/50 bg-[var(--background)] p-4">
            <p className="mb-1 font-medium text-white">Nieuwe versie</p>
            <p className="mb-3 text-xs text-[var(--text-muted)]">
              Vernieuwen herlaadt de app; de muziek stopt daarbij even.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onApplyUpdate();
                  onClose();
                }}
                className="flex-1 rounded-lg bg-[var(--primary)] py-2 text-sm font-semibold text-white hover:bg-[var(--primary-tint)]"
              >
                Nu vernieuwen
              </button>
              <button
                type="button"
                onClick={onDismissUpdate}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)]"
              >
                Later
              </button>
            </div>
          </section>
        )}

        {showIosInstall && (
          <section className="mb-4 rounded-2xl border border-[var(--primary)]/40 bg-[var(--background)] p-4">
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
                setIosInstallHidden(true);
              }}
              className="mt-3 text-xs text-[var(--text-muted)] underline"
            >
              Niet meer tonen
            </button>
          </section>
        )}

        {android.visible && (
          <section className="mb-4 rounded-2xl border border-[var(--primary)]/40 bg-[var(--background)] p-4">
            <p className="mb-2 font-medium text-white">Op Android installeren</p>
            {android.canInstall ? (
              <button
                type="button"
                onClick={() => void android.install()}
                className="w-full rounded-lg bg-[var(--primary)] py-2 text-sm font-semibold text-white hover:bg-[var(--primary-tint)]"
              >
                App installeren
              </button>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                Menu <span aria-hidden>(⋮)</span> →{" "}
                <strong className="text-white">App installeren</strong> of{" "}
                <strong className="text-white">Toevoegen aan startscherm</strong>.
              </p>
            )}
            <button
              type="button"
              onClick={android.dismiss}
              className="mt-3 text-xs text-[var(--text-muted)] underline"
            >
              Niet meer tonen
            </button>
          </section>
        )}

        {isIos && (
          <section className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--text-muted)]">
            <p className="mb-1 font-medium text-white">Achtergrond luisteren</p>
            <p>
              Op iPhone kan muziek stoppen als je Bens Music wegveegt in de
              app-switcher. Laat de app openstaan voor het beste resultaat.
            </p>
          </section>
        )}

        <section className="hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--text-muted)] md:block">
          <p className="mb-2 font-medium text-white">Sneltoetsen</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <dt><Kbd>Spatie</Kbd></dt>
            <dd>Afspelen / pauzeren</dd>
            <dt><Kbd>↑</Kbd> <Kbd>↓</Kbd></dt>
            <dd>Vorig / volgend station</dd>
            <dt><Kbd>M</Kbd></dt>
            <dd>Geluid aan / uit</dd>
          </dl>
        </section>

        <p className="mt-2 text-center text-xs text-[var(--text-subtle)]">
          Bens Music · Bens Web Radio en meer
        </p>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-sans text-xs text-white">
      {children}
    </kbd>
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
