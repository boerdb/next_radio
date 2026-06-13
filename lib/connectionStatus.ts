import { LIVE_STREAM_PATH } from "./stations";
import {
  isLiveStreamStation,
  resolveLiveStreamMode,
  type LiveStreamMode,
} from "./liveStreamUrl";

export type ConnectionMode =
  | "direct-lan"
  | "proxy"
  | "azuracast"
  | "external"
  | "idle";

export interface ConnectionStatus {
  mode: ConnectionMode;
  label: string;
}

export function connectionModeForStation(
  stationId: string | undefined,
): ConnectionMode {
  if (!stationId) return "idle";
  if (isLiveStreamStation(stationId)) {
    return resolveLiveStreamMode() === "direct-lan" ? "direct-lan" : "proxy";
  }
  if (["bens", "noordijs", "soul"].includes(stationId)) return "azuracast";
  return "external";
}

export function connectionStatusLabel(
  mode: ConnectionMode,
  loading: boolean,
  isPlaying: boolean,
): string {
  if (loading && isPlaying) return "Bufferen…";
  switch (mode) {
    case "direct-lan":
      return "Direct · LAN";
    case "proxy":
      return "Via server";
    case "azuracast":
      return "Azuracast";
    case "external":
      return "Extern stream";
    default:
      return "Kies een station";
  }
}

export function liveStreamModeLabel(mode: LiveStreamMode): string {
  return mode === "direct-lan" ? "Direct · LAN" : "Via server";
}

/** For debugging / status strip detail on live station. */
export function liveStreamPathHint(mode: LiveStreamMode): string {
  return mode === "direct-lan" ? "RSAS direct" : LIVE_STREAM_PATH;
}
