import type { Station } from "./types";

/** Public stream for Bens Web Radio Live. Playback uses the internal encoder instead. */
export const LIVE_STREAM_PUBLIC_URL = "https://benswebradio.nl/radio";

/** Same-origin proxy to the internal live encoder (HTTPS, works on iPhone). */
export const LIVE_STREAM_PATH = "/api/live-stream";

/** Direct PlayIt/RSAS on LAN — browser on HTTP app or server-side upstream. */
export const LIVE_STREAM_DIRECT_BASE =
  process.env.NEXT_PUBLIC_LIVE_STREAM_DIRECT ??
  process.env.LIVE_STREAM_INTERNAL_BASE ??
  "http://192.168.1.81:8000/radio";

/** PlayIt on TerraMaster — server-side metadata + proxy upstream. */
export const LIVE_STREAM_INTERNAL_BASE =
  process.env.LIVE_STREAM_INTERNAL_BASE ?? LIVE_STREAM_DIRECT_BASE;

export const LIVE_METADATA_URL =
  process.env.LIVE_METADATA_URL ??
  `${LIVE_STREAM_INTERNAL_BASE}/metadata`;

export const STATIONS: Station[] = [
  {
    id: "live",
    name: "Bens Web Radio Live",
    streamUrl: LIVE_STREAM_PUBLIC_URL,
  },
  {
    id: "sublime",
    name: "Sublime FM",
    streamUrl:
      "https://playerservices.streamtheworld.com/api/livestream-redirect/SUBLIME.mp3?dist=sublime_website",
    defaultArt:
      "https://6nl7xj2ntppk.b-cdn.net/73cf20f2-a361-480b-bc2f-bec43b6a2bd5",
    playbackVolume: 0.75,
  },
  {
    id: "npoblend",
    name: "NPO Blend",
    streamUrl: "https://icecast.omroep.nl/npoblend-bb-mp3",
  },
  {
    id: "radio10soul",
    name: "Radio 10 Soul & Jazz",
    streamUrl:
      "https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR04.mp3",
    defaultArt: "/stations/radio10-soul.png",
  },
  {
    id: "truernb181",
    name: "181.fm True R&B",
    streamUrl: "https://listen.181fm.com/181-rnb_128k.mp3",
  },
  {
    id: "gotradio-rnb",
    name: "GotRadio R&B Classics",
    streamUrl: "https://pureplay.cdnstream1.com/6023_128.mp3",
  },
  {
    id: "gotradio-urban",
    name: "Urban Lounge",
    streamUrl: "https://pureplay.cdnstream1.com/6053_128.mp3",
  },
];

const ICY_METADATA_STATION_IDS = new Set([
  "npoblend",
  "radio10soul",
  "truernb181",
  "gotradio-rnb",
  "gotradio-urban",
  "sublime",
]);

export function usesIcyStreamMetadata(stationId: string): boolean {
  return ICY_METADATA_STATION_IDS.has(stationId);
}

export function getStationById(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}
