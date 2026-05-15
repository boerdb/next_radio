import { trackArtKey } from "./trackKey";
import type { NowPlaying } from "./types";

const STATION_SNAPSHOT_TTL_MS = 15 * 60 * 1000;
const ART_BY_TRACK_MAX = 80;

export type StationSnapshot = {
  nowPlaying: NowPlaying;
  updatedAt: number;
};

const artByTrack = new Map<string, string>();
const stationSnapshots = new Map<string, StationSnapshot>();

function isFresh(updatedAt: number, ttlMs: number): boolean {
  return Date.now() - updatedAt < ttlMs;
}

export function rememberTrackArt(artist: string, title: string, art: string | null): void {
  if (!art) return;
  const key = trackArtKey(artist, title);
  if (artByTrack.size >= ART_BY_TRACK_MAX && !artByTrack.has(key)) {
    const oldest = artByTrack.keys().next().value;
    if (oldest) artByTrack.delete(oldest);
  }
  artByTrack.set(key, art);
}

export function recallTrackArt(artist: string, title: string): string | null {
  return artByTrack.get(trackArtKey(artist, title)) ?? null;
}

export function rememberStationSnapshot(stationId: string, nowPlaying: NowPlaying): void {
  stationSnapshots.set(stationId, { nowPlaying, updatedAt: Date.now() });
}

export function recallStationSnapshot(stationId: string): NowPlaying | null {
  const snapshot = stationSnapshots.get(stationId);
  if (!snapshot || !isFresh(snapshot.updatedAt, STATION_SNAPSHOT_TTL_MS)) {
    if (snapshot) stationSnapshots.delete(stationId);
    return null;
  }
  return snapshot.nowPlaying;
}

export function withRecalledArt(data: NowPlaying): NowPlaying {
  if (data.art) return data;
  const recalled = recallTrackArt(data.artist, data.title);
  return recalled ? { ...data, art: recalled } : data;
}
