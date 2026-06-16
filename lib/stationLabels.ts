import type { Station } from "./types";

export const STATION_LABELS: Record<string, string> = {
  bens: "Bens Web",
  noordijs: "70s & 80s",
  soul: "R&B",
  live: "Live",
  sublime: "Sublime",
  nposoul: "NPO Soul",
  truernb181: "181 R&B",
  "gotradio-rnb": "GotRadio",
  "gotradio-urban": "Urban",
};

export function stationLabel(station: Station): string {
  return STATION_LABELS[station.id] ?? station.name;
}
