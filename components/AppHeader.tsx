"use client";

import Image from "next/image";
import { usePwaUpdate } from "@/hooks/usePwaUpdate";
import { APP_ICON } from "@/lib/appIcon";

interface AppHeaderProps {
  onOpenSettings: () => void;
}

export function AppHeader({ onOpenSettings }: AppHeaderProps) {
  const { updateAvailable } = usePwaUpdate();

  return (
    <header className="shrink-0 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 md:px-8">
        <div className="flex items-center gap-2.5">
          <span className="relative h-8 w-8 overflow-hidden rounded-lg ring-1 ring-white/15 shadow-md shadow-[var(--primary-glow)]">
            <Image src={APP_ICON} alt="" fill sizes="32px" className="object-cover" />
          </span>
          <h1 className="text-[17px] font-semibold tracking-tight text-white">
            Bens <span className="text-[var(--primary-soft)]">Music</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={updateAvailable ? "Instellingen (update beschikbaar)" : "Instellingen"}
        >
          <GearIcon />
          {updateAvailable && (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-[var(--background)] bg-[var(--primary-tint)]" />
          )}
        </button>
      </div>
    </header>
  );
}

function GearIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
