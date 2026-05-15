"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  dismissAndroidInstallBanner,
  shouldShowAndroidInstallBanner,
} from "@/lib/isAndroidInstallable";
import type { BeforeInstallPromptEvent } from "@/lib/pwaInstall";

export function useAndroidInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!shouldShowAndroidInstallBanner()) return;

    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      deferredPromptRef.current = event;
      setDeferredPrompt(event);
      setShowFallback(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    const fallbackTimer = window.setTimeout(() => {
      if (
        !deferredPromptRef.current &&
        shouldShowAndroidInstallBanner()
      ) {
        setShowFallback(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  const visible =
    shouldShowAndroidInstallBanner() &&
    (deferredPrompt !== null || showFallback);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      dismissAndroidInstallBanner();
    }
    deferredPromptRef.current = null;
    setDeferredPrompt(null);
    setShowFallback(false);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    dismissAndroidInstallBanner();
    deferredPromptRef.current = null;
    setDeferredPrompt(null);
    setShowFallback(false);
  }, []);

  return {
    visible,
    canInstall: deferredPrompt !== null,
    install,
    dismiss,
  };
}
