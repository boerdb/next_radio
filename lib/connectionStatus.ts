import {
  isLiveStreamStation,
  resolveLiveStreamMode,
} from "./liveStreamUrl";

export type ConnectionMode = "direct-lan" | "proxy" | "external" | "idle";

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
      return "Intern · via server";
    case "external":
      return "Extern stream";
    default:
      return "Kies een station";
  }
}
