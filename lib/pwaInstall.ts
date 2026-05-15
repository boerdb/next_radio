export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type InstallPromptListener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let captureInitialized = false;
const listeners = new Set<InstallPromptListener>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

/** Capture before React hydrates so we never miss `beforeinstallprompt`. */
export function initInstallPromptCapture(): void {
  if (typeof window === "undefined" || captureInitialized) return;
  captureInitialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null;
}

export function subscribeInstallPrompt(listener: InstallPromptListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
  initInstallPromptCapture();
}
