import type { NowPlaying, Station } from "./types";

export const APP_ICON = "/icons/icon-512.png";

export function isAppIconArt(art: string | null | undefined): boolean {
  if (!art) return false;
  return art === APP_ICON || art.endsWith("/icon-512.png");
}

export function loadingPlaceholder(station: Station): NowPlaying {
  return {
    artist: station.name,
    title: "Even geduld...",
    art: APP_ICON,
    elapsed: 0,
    duration: 0,
    listeners: 0,
    isLive: station.id === "live",
  };
}
