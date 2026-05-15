"use client";

import { useCallback, useEffect, useState } from "react";
import {
  dismissAndroidInstallBanner,
  shouldShowAndroidInstallBanner,
} from "@/lib/isAndroidInstallable";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  subscribeInstallPrompt,
} from "@/lib/pwaInstall";

export function useAndroidInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (!shouldShowAndroidInstallBanner()) return;

    const sync = () => {
      setCanInstall(getDeferredInstallPrompt() !== null);
    };

    setVisible(true);
    sync();

    const unsubscribe = subscribeInstallPrompt(sync);
    return unsubscribe;
  }, []);

  const install = useCallback(async () => {
    const prompt = getDeferredInstallPrompt();
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      dismissAndroidInstallBanner();
      setVisible(false);
    }
    clearDeferredInstallPrompt();
    setCanInstall(false);
  }, []);

  const dismiss = useCallback(() => {
    dismissAndroidInstallBanner();
    clearDeferredInstallPrompt();
    setVisible(false);
    setCanInstall(false);
  }, []);

  useEffect(() => {
    const onInstalled = () => dismiss();
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, [dismiss]);

  return {
    visible,
    canInstall,
    install,
    dismiss,
  };
}
