"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DISMISS_KEY = "bens-music-update-dismissed";
const RELOAD_FALLBACK_MS = 4000;

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

function shouldOfferUpdate(reg: ServiceWorkerRegistration): boolean {
  return Boolean(reg.waiting && navigator.serviceWorker.controller);
}

export function usePwaUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const refreshingRef = useRef(false);
  const reloadFallbackRef = useRef<number | undefined>(undefined);

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

    const onControllerChange = () => {
      if (!refreshingRef.current) return;
      clearReloadFallback();
      window.location.reload();
    };

    const checkForUpdate = (reg: ServiceWorkerRegistration) => {
      registrationRef.current = reg;
      if (shouldOfferUpdate(reg) && !isUpdateDismissedThisSession()) {
        setUpdateAvailable(true);
      }
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
      if (!reg) return;
      void reg.update().then(() => checkForUpdate(reg));
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    const interval = window.setInterval(() => {
      const reg = registrationRef.current;
      if (!reg) return;
      void reg.update().then(() => checkForUpdate(reg));
    }, 60 * 60 * 1000);

    return () => {
      clearReloadFallback();
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(interval);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    const reg = registrationRef.current;
    const waiting = reg?.waiting;
    if (!waiting) {
      window.location.reload();
      return;
    }

    refreshingRef.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });

    if (reloadFallbackRef.current) {
      window.clearTimeout(reloadFallbackRef.current);
    }
    reloadFallbackRef.current = window.setTimeout(() => {
      if (!refreshingRef.current) return;
      window.location.reload();
    }, RELOAD_FALLBACK_MS);
  }, []);

  const dismissUpdate = useCallback(() => {
    markUpdateDismissed();
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, applyUpdate, dismissUpdate };
}
