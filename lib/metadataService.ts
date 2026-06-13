import {
  getStationShortcode,
  isAzuracastStation,
  usesIcyStreamMetadata,
} from "./stations";
import {
  isLoadingPlaceholder,
  loadingPlaceholder,
  stationLiveNowPlaying,
} from "./appIcon";
import {
  recallStationSnapshot,
  rememberStationSnapshot,
  rememberTrackArt,
  withRecalledArt,
} from "./nowPlayingSessionCache";
import { isLiveStreamStation } from "./liveStreamUrl";
import type { NowPlaying, Station } from "./types";

const METADATA_POLL_MS = 5000;
const METADATA_POLL_LIVE_MS = 15_000;
const TRACK_CHANGE_DELAY_MS = 2500;

function isSameTrack(a: NowPlaying, b: NowPlaying): boolean {
  return a.artist === b.artist && a.title === b.title;
}

function enrichArt(
  data: NowPlaying,
  station: Station,
  prev?: NowPlaying | null,
): NowPlaying {
  const withCache = withRecalledArt(data);
  return {
    ...withCache,
    art:
      withCache.art ??
      (prev && isSameTrack(prev, withCache) ? prev.art : null) ??
      station.defaultArt ??
      null,
  };
}

function persistNowPlaying(station: Station, data: NowPlaying): void {
  if (data.art) rememberTrackArt(data.artist, data.title, data.art);
  rememberStationSnapshot(station.id, data);
}

export type MetadataListener = (nowPlaying: NowPlaying) => void;

export class MetadataService {
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private trackChangeTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingTrack: NowPlaying | null = null;
  private current: NowPlaying | null = null;
  private station: Station | null = null;
  private listener: MetadataListener | null = null;

  setListener(listener: MetadataListener | null): void {
    this.listener = listener;
  }

  initialNowPlaying(station: Station): NowPlaying {
    if (station.id === "sublime") {
      return loadingPlaceholder(station);
    }
    const cached = recallStationSnapshot(station.id);
    return cached ? enrichArt(cached, station) : loadingPlaceholder(station);
  }

  start(station: Station): void {
    this.stop();
    this.station = station;
    this.current = this.initialNowPlaying(station);
    this.emit(this.current);

    const poll = () => {
      if (
        isLiveStreamStation(station.id) &&
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      void this.fetch(station);
    };

    poll();
    const interval = isLiveStreamStation(station.id)
      ? METADATA_POLL_LIVE_MS
      : METADATA_POLL_MS;
    this.pollTimer = setInterval(poll, interval);
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.clearTrackChangeTimer();
    this.station = null;
    this.current = null;
    this.pendingTrack = null;
  }

  getCurrent(): NowPlaying | null {
    return this.current;
  }

  private emit(data: NowPlaying): void {
    this.current = data;
    this.listener?.(data);
  }

  private clearTrackChangeTimer(): void {
    if (this.trackChangeTimer) {
      clearTimeout(this.trackChangeTimer);
      this.trackChangeTimer = null;
    }
    this.pendingTrack = null;
  }

  private apply(data: NowPlaying, station: Station): void {
    const enriched = enrichArt(data, station, this.current);

    if (!this.current || isSameTrack(this.current, enriched)) {
      if (
        this.pendingTrack &&
        !isSameTrack(this.pendingTrack, enriched)
      ) {
        return;
      }
      this.clearTrackChangeTimer();
      const next =
        this.current && isSameTrack(this.current, enriched)
          ? enrichArt(enriched, station, this.current)
          : enriched;
      persistNowPlaying(station, next);
      this.emit(next);
      return;
    }

    this.pendingTrack = enriched;
    if (this.trackChangeTimer) clearTimeout(this.trackChangeTimer);
    this.trackChangeTimer = setTimeout(() => {
      if (this.pendingTrack) {
        persistNowPlaying(station, this.pendingTrack);
        this.emit(this.pendingTrack);
      }
      this.pendingTrack = null;
      this.trackChangeTimer = null;
    }, TRACK_CHANGE_DELAY_MS);
  }

  private async fetch(station: Station): Promise<void> {
    try {
      let url: string;
      if (isAzuracastStation(station.stationApiId)) {
        url = `/api/now-playing?station=${getStationShortcode(station.stationApiId)}`;
      } else if (station.id === "live") {
        url = "/api/live-metadata";
      } else if (usesIcyStreamMetadata(station.id)) {
        url = `/api/icy-metadata?id=${encodeURIComponent(station.id)}`;
      } else {
        return;
      }

      const separator = url.includes("?") ? "&" : "?";
      url = `${url}${separator}_=${Date.now()}`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as NowPlaying | null;
      if (!data) {
        this.apply(stationLiveNowPlaying(station), station);
        return;
      }
      this.apply(data, station);
    } catch {
      /* ignore poll errors */
    }
  }

  /** Called when playback starts and placeholder metadata should be replaced. */
  onPlaybackStarted(station: Station): void {
    if (this.current && isLoadingPlaceholder(this.current)) {
      this.emit(stationLiveNowPlaying(station));
    }
  }
}
