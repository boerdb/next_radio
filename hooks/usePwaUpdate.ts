"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DISMISS_KEY = "bens-music-update-dismissed";

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

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const onControllerChange = () => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      window.location.reload();
    };

    const markIfWaiting = (reg: ServiceWorkerRegistration) => {
      if (shouldOfferUpdate(reg) && !isUpdateDismissedThisSession()) {
        setUpdateAvailable(true);
      }
    };

    const trackWorker = (reg: ServiceWorkerRegistration, worker: ServiceWorker) => {
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") {
          markIfWaiting(reg);
        }
      });
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker.ready.then((reg) => {
      registrationRef.current = reg;
      markIfWaiting(reg);

      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (worker) trackWorker(reg, worker);
      });
    });

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const reg = registrationRef.current;
      if (!reg) return;
      void reg.update().then(() => markIfWaiting(reg));
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    const interval = window.setInterval(() => {
      const reg = registrationRef.current;
      if (!reg) return;
      void reg.update().then(() => markIfWaiting(reg));
    }, 60 * 60 * 1000);

    return () => {
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
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
      return;
    }
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    markUpdateDismissed();
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, applyUpdate, dismissUpdate };
}
