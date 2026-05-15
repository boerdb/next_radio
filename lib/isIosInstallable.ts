const DISMISS_KEY = "bens-music-ios-install-dismissed";

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS legacy
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isClassicIos = /iPad|iPhone|iPod/i.test(ua);
  const isIpadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isClassicIos || isIpadOs;
}

/** Safari on iOS (not Chrome/Firefox in-app browsers). */
export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!isIosDevice()) return false;
  const ua = navigator.userAgent;
  if (/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)) return false;
  return /Safari/i.test(ua);
}

export function shouldShowIosInstallBanner(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandalonePwa()) return false;
  if (!isIosSafari()) return false;
  try {
    return localStorage.getItem(DISMISS_KEY) !== "1";
  } catch {
    return true;
  }
}

export function dismissIosInstallBanner(): void {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}
