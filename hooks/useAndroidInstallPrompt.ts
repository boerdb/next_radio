"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  dismissAndroidInstallBanner,
  shouldShowAndroidInstallBanner,
} from "@/lib/isAndroidInstallable";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  subscribeInstallPrompt,
} from "@/lib/pwaInstall";

const hasInstallPrompt = () => getDeferredInstallPrompt() !== null;
const noInstallPromptOnServer = () => false;

export function useAndroidInstallPrompt() {
  const [visible, setVisible] = useState(shouldShowAndroidInstallBanner);
  const canInstall = useSyncExternalStore(
    subscribeInstallPrompt,
    hasInstallPrompt,
    noInstallPromptOnServer,
  );

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
  }, []);

  const dismiss = useCallback(() => {
    dismissAndroidInstallBanner();
    clearDeferredInstallPrompt();
    setVisible(false);
  }, []);

  useEffect(() => {
    const onInstalled = () => dismiss();
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, [dismiss]);

  return { visible, canInstall, install, dismiss };
}
