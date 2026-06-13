"use client";

import { usePwaUpdate } from "@/hooks/usePwaUpdate";

interface AppHeaderProps {
  onOpenSettings: () => void;
}

export function AppHeader({ onOpenSettings }: AppHeaderProps) {
  const { updateAvailable } = usePwaUpdate();

  return (
    <header className="shrink-0 border-b border-[var(--primary-shade)] bg-[var(--primary)] pt-[env(safe-area-inset-top)]">
      <div className="relative flex items-center justify-center px-4 py-3">
        <h1 className="text-lg font-semibold tracking-wide text-white">
          Bens Music
        </h1>
        <button
          type="button"
          onClick={onOpenSettings}
          className="absolute right-4 rounded-lg p-2 text-white/90 hover:bg-white/10"
          aria-label="Instellingen"
        >
          <span className="relative inline-flex">
            <GearIcon />
            {updateAvailable && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--secondary)]" />
            )}
          </span>
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
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
