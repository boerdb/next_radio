"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DISMISS_KEY = "bens-music-update-dismissed";
const APPLIED_SW_KEY = "bens-music-update-applied-sw";
const RELOAD_FALLBACK_MS = 2500;

function isUpdateDismissedThisSession(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function markUpdateDismissed(): void {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}

function wasWorkerUpdateApplied(scriptUrl: string): boolean {
  try {
    return sessionStorage.getItem(APPLIED_SW_KEY) === scriptUrl;
  } catch {
    return false;
  }
}

function markWorkerUpdateApplied(scriptUrl: string): void {
  try {
    sessionStorage.setItem(APPLIED_SW_KEY, scriptUrl);
  } catch {
    /* ignore */
  }
}

function shouldOfferUpdate(reg: ServiceWorkerRegistration): boolean {
  const waiting = reg.waiting;
  if (!waiting || !navigator.serviceWorker.controller) return false;
  if (isUpdateDismissedThisSession()) return false;
  if (wasWorkerUpdateApplied(waiting.scriptURL)) return false;
  return true;
}

function hideUpdateBanner(setUpdateAvailable: (v: boolean) => void): void {
  setUpdateAvailable(false);
}

export function usePwaUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const refreshingRef = useRef(false);
  const reloadFallbackRef = useRef<number | undefined>(undefined);
  const waitingListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const clearReloadFallback = () => {
      if (reloadFallbackRef.current) {
        window.clearTimeout(reloadFallbackRef.current);
        reloadFallbackRef.current = undefined;
      }
    };

    const clearWaitingListener = () => {
      waitingListenerRef.current?.();
      waitingListenerRef.current = null;
    };

    const reloadForUpdate = () => {
      if (!refreshingRef.current) return;
      clearReloadFallback();
      clearWaitingListener();
      window.location.reload();
    };

    const onControllerChange = () => {
      reloadForUpdate();
    };

    const checkForUpdate = (reg: ServiceWorkerRegistration) => {
      registrationRef.current = reg;
      if (refreshingRef.current) return;

      if (shouldOfferUpdate(reg)) {
        setUpdateAvailable(true);
        return;
      }

      hideUpdateBanner(setUpdateAvailable);
    };

    const trackInstalling = (
      reg: ServiceWorkerRegistration,
      worker: ServiceWorker,
    ) => {
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") {
          queueMicrotask(() => checkForUpdate(reg));
        }
      });
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    void navigator.serviceWorker.ready.then((reg) => {
      checkForUpdate(reg);

      if (reg.waiting) {
        reg.waiting.addEventListener("statechange", () => checkForUpdate(reg));
      }

      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (worker) trackInstalling(reg, worker);
      });
    });

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const reg = registrationRef.current;
      if (!reg || refreshingRef.current) return;
      void reg.update().then(() => checkForUpdate(reg));
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    const interval = window.setInterval(() => {
      const reg = registrationRef.current;
      if (!reg || refreshingRef.current) return;
      void reg.update().then(() => checkForUpdate(reg));
    }, 60 * 60 * 1000);

    return () => {
      clearReloadFallback();
      clearWaitingListener();
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(interval);
    };
  }, []);

  const scheduleReloadFallback = useCallback(() => {
    if (reloadFallbackRef.current) {
      window.clearTimeout(reloadFallbackRef.current);
    }
    reloadFallbackRef.current = window.setTimeout(() => {
      if (!refreshingRef.current) return;
      window.location.reload();
    }, RELOAD_FALLBACK_MS);
  }, []);

  const applyUpdate = useCallback(() => {
    const reg = registrationRef.current;
    const waiting = reg?.waiting;

    markUpdateDismissed();
    hideUpdateBanner(setUpdateAvailable);

    if (!waiting) {
      window.location.reload();
      return;
    }

    markWorkerUpdateApplied(waiting.scriptURL);
    refreshingRef.current = true;

    const onWaitingStateChange = () => {
      if (waiting.state === "activated") {
        window.location.reload();
      }
    };
    waiting.addEventListener("statechange", onWaitingStateChange);
    waitingListenerRef.current = () => {
      waiting.removeEventListener("statechange", onWaitingStateChange);
    };

    waiting.postMessage({ type: "SKIP_WAITING" });
    scheduleReloadFallback();
  }, [scheduleReloadFallback]);

  const dismissUpdate = useCallback(() => {
    markUpdateDismissed();
    const waiting = registrationRef.current?.waiting;
    if (waiting) markWorkerUpdateApplied(waiting.scriptURL);
    hideUpdateBanner(setUpdateAvailable);
  }, []);

  return { updateAvailable, applyUpdate, dismissUpdate };
}
