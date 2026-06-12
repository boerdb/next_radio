import type { Station } from "./types";

export const AZURACAST_BASE =
  process.env.NEXT_PUBLIC_AZURACAST_URL ?? "https://benswebradio.nl";

export const NPO_STREAM_URL = "https://icecast.omroep.nl/radio6-bb-mp3";

/** Same-origin proxy — browser uses /api/live-stream (works on WiFi and 5G). */
export const LIVE_STREAM_PATH = "/api/live-stream";

/** RSAS on NUC — server-side only (Next.js → .232 on LAN). */
export const LIVE_STREAM_INTERNAL_BASE =
  process.env.LIVE_STREAM_INTERNAL_BASE ?? "http://192.168.1.232:8500";

export const LIVE_METADATA_URL =
  process.env.LIVE_METADATA_URL ??
  `${LIVE_STREAM_INTERNAL_BASE}/live/metadata`;

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
    streamUrl: `${LIVE_STREAM_PATH}?type=.mp3`,
    defaultArt: `${AZURACAST_BASE}/static/uploads/station1/album_art.1772232083.png`,
  },
  {
    id: "sublime",
    stationApiId: 0,
    name: "Sublime FM",
    streamUrl:
      "https://playerservices.streamtheworld.com/api/livestream-redirect/SUBLIME.mp3?dist=sublime_website",
    defaultArt:
      "https://6nl7xj2ntppk.b-cdn.net/73cf20f2-a361-480b-bc2f-bec43b6a2bd5",
    playbackVolume: 0.75,
  },
  {
    id: "nposoul",
    stationApiId: 0,
    name: "NPO Soul & Jazz",
    streamUrl: NPO_STREAM_URL,
    defaultArt: `${AZURACAST_BASE}/static/uploads/station3/album_art.1772217617.jpg`,
  },
  {
    id: "truernb181",
    stationApiId: 0,
    name: "181.fm True R&B",
    streamUrl: "https://listen.181fm.com/181-rnb_128k.mp3",
    defaultArt: `${AZURACAST_BASE}/static/uploads/station3/album_art.1772217617.jpg`,
  },
  {
    id: "gotradio-rnb",
    stationApiId: 0,
    name: "GotRadio R&B Classics",
    streamUrl: "https://pureplay.cdnstream1.com/6023_128.mp3",
    defaultArt: `${AZURACAST_BASE}/static/uploads/station3/album_art.1772217617.jpg`,
  },
  {
    id: "gotradio-urban",
    stationApiId: 0,
    name: "Urban Lounge",
    streamUrl: "https://pureplay.cdnstream1.com/6053_128.mp3",
    defaultArt: `${AZURACAST_BASE}/static/uploads/station3/album_art.1772217617.jpg`,
  },
];

const ICY_METADATA_STATION_IDS = new Set([
  "nposoul",
  "truernb181",
  "gotradio-rnb",
  "gotradio-urban",
  "sublime",
]);

export function usesIcyStreamMetadata(stationId: string): boolean {
  return ICY_METADATA_STATION_IDS.has(stationId);
}

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
