import { LIVE_STREAM_PATH, LIVE_STREAM_DIRECT_BASE } from "./stations";

const LAN_HOST =
  /^(192\.168\.|10\.|172\.(1[6-9]|2\d?|3[01])\.|localhost|127\.)/;

/** Direct RSAS on LAN when the app is served over HTTP; otherwise same-origin proxy. */
export function resolveLiveStreamUrl(): string {
  if (typeof window !== "undefined") {
    const onLanApp =
      window.location.protocol === "http:" &&
      LAN_HOST.test(window.location.hostname);
    if (onLanApp) {
      return `${LIVE_STREAM_DIRECT_BASE}/live?type=.mp3`;
    }
  }
  return `${LIVE_STREAM_PATH}?type=.mp3`;
}

export function isLiveStreamStation(stationId: string): boolean {
  return stationId === "live";
}
