import type { Station } from "./types";

export const AZURACAST_BASE =
  process.env.NEXT_PUBLIC_AZURACAST_URL ?? "https://benswebradio.nl";

export const NPO_STREAM_URL = "https://icecast.omroep.nl/radio6-bb-mp3";

export const LIVE_METADATA_URL =
  "https://stream.benswebradio.nl/live/metadata";

export const KNOWN_AZURA_DEFAULT_ART =
  /\/static\/uploads\/station[123]\/album_art\.\d+\.(png|jpe?g|webp)(\?.*)?$/i;

export const STATIONS: Station[] = [
  {
    id: "bens",
    stationApiId: 1,
    name: "Bens Web Radio",
    streamUrl: `${AZURACAST_BASE}/listen/station1/radio.mp3?type=.mp3`,
    defaultArt: `${AZURACAST_BASE}/static/uploads/station1/album_art.1772232083.png`,
  },
  {
    id: "noordijs",
    stationApiId: 2,
    name: "Bens 70s & 80s hits",
    streamUrl: `${AZURACAST_BASE}/listen/station2/radio.mp3`,
    defaultArt: `${AZURACAST_BASE}/static/uploads/station2/album_art.1772232122.png`,
  },
  {
    id: "soul",
    stationApiId: 3,
    name: "Bens R&B and Soul Music",
    streamUrl: `${AZURACAST_BASE}/listen/station3/radio.mp3`,
    defaultArt: `${AZURACAST_BASE}/static/uploads/station3/album_art.1772217617.jpg`,
  },
  {
    id: "live",
    stationApiId: 4,
    name: "Bens Web Radio Live",
    streamUrl: "https://stream.benswebradio.nl/live",
    defaultArt: `${AZURACAST_BASE}/static/uploads/station1/album_art.1772232083.png`,
  },
  {
    id: "nposoul",
    stationApiId: 0,
    name: "NPO Soul & Jazz",
    streamUrl: NPO_STREAM_URL,
    defaultArt: `${AZURACAST_BASE}/static/uploads/station3/album_art.1772217617.jpg`,
  },
];

export function getStationByShortcode(shortcode: string): Station | undefined {
  const match = /^station(\d)$/.exec(shortcode);
  if (!match) return undefined;
  const apiId = Number(match[1]);
  return STATIONS.find((s) => s.stationApiId === apiId);
}

export function getStationById(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}

export function getStationShortcode(stationApiId: number): string {
  return `station${stationApiId}`;
}

export function isAzuracastStation(stationApiId: number): boolean {
  return stationApiId >= 1 && stationApiId <= 3;
}
