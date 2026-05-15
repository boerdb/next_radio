import { isAndroidDevice, isStandalonePwa } from "@/lib/pwa";
import { isIosDevice } from "@/lib/isIosInstallable";

const DISMISS_KEY = "bens-music-android-install-dismissed";

export function isAndroidInstallDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function shouldShowAndroidInstallBanner(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandalonePwa()) return false;
  if (!isAndroidDevice() || isIosDevice()) return false;
  return !isAndroidInstallDismissed();
}

export function dismissAndroidInstallBanner(): void {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}
