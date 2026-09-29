import {
  isLiveStreamStation,
  resolveLiveStreamMode,
} from "./liveStreamUrl";

export type ConnectionMode = "direct-lan" | "external" | "idle";

export interface ConnectionStatus {
  mode: ConnectionMode;
  label: string;
}

export function connectionModeForStation(
  stationId: string | undefined,
): ConnectionMode {
  if (!stationId) return "idle";
  if (isLiveStreamStation(stationId) && resolveLiveStreamMode() === "direct-lan") {
    return "direct-lan";
  }
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
    case "external":
      return "Extern stream";
    default:
      return "Kies een station";
  }
}
