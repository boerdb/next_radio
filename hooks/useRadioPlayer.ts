"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getStationShortcode,
  isAzuracastStation,
  STATIONS,
  usesIcyStreamMetadata,
} from "@/lib/stations";
import {
  setupMediaSessionHandlers,
  updateMediaSession,
} from "@/lib/mediaSession";
import {
  isLoadingPlaceholder,
  loadingPlaceholder,
  stationLiveNowPlaying,
} from "@/lib/appIcon";
import {
  recallStationSnapshot,
  rememberStationSnapshot,
  rememberTrackArt,
  withRecalledArt,
} from "@/lib/nowPlayingSessionCache";
import { streamSrcWithCacheBust } from "@/lib/streamSrc";
import type { NowPlaying, Station } from "@/lib/types";

const METADATA_POLL_MS = 5000;
/** Live metadata hits the same host as the audio stream — poll less often. */
const METADATA_POLL_LIVE_MS = 20_000;
/** Korte pauze bij trackwissel zodat jingle-metadata niet flitst. */
const TRACK_CHANGE_DELAY_MS = 2500;
/** Herverbind na buffer-stilstand (mobiel / PWA / live-stream). */
const STALL_RECONNECT_MS = 10_000;
const LIVE_STALL_RECONNECT_MS = 8_000;
const MAX_RECONNECT_ATTEMPTS = 8;

function isSameTrack(a: NowPlaying, b: NowPlaying): boolean {
  return a.artist === b.artist && a.title === b.title;
}

export function useRadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nowPlayingRef = useRef<NowPlaying | null>(null);
  const trackChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTrackRef = useRef<NowPlaying | null>(null);
  const currentStationRef = useRef<Station | null>(null);
  const intendsPlayRef = useRef(false);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);

  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const reloadStream = useCallback(() => {
    const audio = audioRef.current;
    const station = currentStationRef.current;
    if (!audio || !station || !intendsPlayRef.current) return;

    setLoading(true);
    audio.src = streamSrcWithCacheBust(station.streamUrl);
    audio.load();
    void audio.play().catch(() => setLoading(false));
  }, []);

  const scheduleReconnect = useCallback(
    (delayMs = 0) => {
      if (!intendsPlayRef.current || !currentStationRef.current) return;
      clearReconnectTimer();
      clearStallTimer();

      const attempt = reconnectAttemptRef.current;
      if (attempt >= MAX_RECONNECT_ATTEMPTS) {
        setLoading(false);
        return;
      }

      const backoff = delayMs > 0 ? delayMs : Math.min(1000 * 2 ** attempt, 15_000);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (!intendsPlayRef.current) return;
        reconnectAttemptRef.current += 1;
        reloadStream();
      }, backoff);
    },
    [clearReconnectTimer, clearStallTimer, reloadStream],
  );

  const scheduleStallWatch = useCallback(() => {
    if (!intendsPlayRef.current || stallTimerRef.current) return;
    const station = currentStationRef.current;
    const timeout =
      station?.id === "live" ? LIVE_STALL_RECONNECT_MS : STALL_RECONNECT_MS;

    stallTimerRef.current = setTimeout(() => {
      stallTimerRef.current = null;
      const audio = audioRef.current;
      if (!audio || !intendsPlayRef.current) return;
      if (audio.paused) return;
      scheduleReconnect(500);
    }, timeout);
  }, [scheduleReconnect]);

  useEffect(() => {
    currentStationRef.current = currentStation;
  }, [currentStation]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    const onPlaying = () => {
      reconnectAttemptRef.current = 0;
      clearStallTimer();
      clearReconnectTimer();
      setIsPlaying(true);
      setLoading(false);
      const station = currentStationRef.current;
      if (station && isLoadingPlaceholder(nowPlayingRef.current)) {
        const live = stationLiveNowPlaying(station);
        nowPlayingRef.current = live;
        setNowPlaying(live);
      }
    };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => {
      setLoading(true);
      scheduleStallWatch();
    };
    const onCanPlay = () => {
      clearStallTimer();
      setLoading(false);
    };
    const onError = () => {
      if (intendsPlayRef.current) scheduleReconnect(800);
    };
    const onStalled = () => {
      if (intendsPlayRef.current) scheduleStallWatch();
    };
    const onEnded = () => {
      if (intendsPlayRef.current) scheduleReconnect(500);
    };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);
    audio.addEventListener("stalled", onStalled);
    audio.addEventListener("ended", onEnded);

    setupMediaSessionHandlers(
      () => {
        intendsPlayRef.current = true;
        void audio.play();
      },
      () => {
        intendsPlayRef.current = false;
        clearStallTimer();
        clearReconnectTimer();
        audio.pause();
      },
    );

    const onOnline = () => {
      if (intendsPlayRef.current) scheduleReconnect(300);
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible" || !intendsPlayRef.current) return;
      const a = audioRef.current;
      if (!a || a.paused) return;
      if (a.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        scheduleReconnect(300);
      }
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("stalled", onStalled);
      audio.removeEventListener("ended", onEnded);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      clearStallTimer();
      clearReconnectTimer();
      audio.pause();
      audio.src = "";
    };
  }, [
    clearReconnectTimer,
    clearStallTimer,
    scheduleReconnect,
    scheduleStallWatch,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const gain = currentStation?.playbackVolume ?? 1;
    audio.volume = muted ? 0 : volume * gain;
    audio.muted = muted;
  }, [volume, muted, currentStation]);

  useEffect(() => {
    nowPlayingRef.current = nowPlaying;
  }, [nowPlaying]);

  useEffect(() => {
    updateMediaSession(nowPlaying, currentStation?.name ?? "Bens Music", isPlaying);
  }, [nowPlaying, currentStation, isPlaying]);

  const clearTrackChangeTimer = useCallback(() => {
    if (trackChangeTimerRef.current) {
      clearTimeout(trackChangeTimerRef.current);
      trackChangeTimerRef.current = null;
    }
    pendingTrackRef.current = null;
  }, []);

  const enrichArt = useCallback(
    (data: NowPlaying, station: Station, prev?: NowPlaying | null) => {
      const withCache = withRecalledArt(data);
      return {
        ...withCache,
        art:
          withCache.art ??
          (prev && isSameTrack(prev, withCache) ? prev.art : null) ??
          station.defaultArt ??
          null,
      };
    },
    [],
  );

  const persistNowPlaying = useCallback(
    (station: Station, data: NowPlaying) => {
      if (data.art) rememberTrackArt(data.artist, data.title, data.art);
      rememberStationSnapshot(station.id, data);
    },
    [],
  );

  const applyMetadata = useCallback(
    (data: NowPlaying, station: Station) => {
      const current = nowPlayingRef.current;
      const enriched = enrichArt(data, station, current);

      if (!current || isSameTrack(current, enriched)) {
        clearTrackChangeTimer();
        setNowPlaying((prev) => {
          const next =
            prev && isSameTrack(prev, enriched)
              ? enrichArt(enriched, station, prev)
              : enriched;
          persistNowPlaying(station, next);
          return next;
        });
        return;
      }

      pendingTrackRef.current = enriched;
      if (trackChangeTimerRef.current) {
        clearTimeout(trackChangeTimerRef.current);
      }
      trackChangeTimerRef.current = setTimeout(() => {
        if (pendingTrackRef.current) {
          const next = pendingTrackRef.current;
          persistNowPlaying(station, next);
          setNowPlaying(next);
        }
        pendingTrackRef.current = null;
        trackChangeTimerRef.current = null;
      }, TRACK_CHANGE_DELAY_MS);
    },
    [clearTrackChangeTimer, enrichArt, persistNowPlaying],
  );

  const fetchMetadata = useCallback(
    async (station: Station) => {
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

        // Avoid stale API responses from browser/service-worker caches.
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}_=${Date.now()}`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as NowPlaying | null;
        if (!data) {
          if (isLoadingPlaceholder(nowPlayingRef.current)) {
            applyMetadata(stationLiveNowPlaying(station), station);
          }
          return;
        }
        applyMetadata(data, station);
      } catch {
        /* ignore poll errors */
      }
    },
    [applyMetadata],
  );

  const metadataPollMs = useCallback((station: Station) => {
    return station.id === "live" ? METADATA_POLL_LIVE_MS : METADATA_POLL_MS;
  }, []);

  const startPolling = useCallback(
    (station: Station) => {
      if (pollRef.current) clearInterval(pollRef.current);
      const poll = () => {
        if (station.id === "live" && document.visibilityState === "hidden") return;
        void fetchMetadata(station);
      };
      poll();
      pollRef.current = setInterval(poll, metadataPollMs(station));
    },
    [fetchMetadata, metadataPollMs],
  );

  const playStation = useCallback(
    async (station: Station) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (currentStation?.id === station.id && isPlaying) {
        intendsPlayRef.current = false;
        clearStallTimer();
        clearReconnectTimer();
        audio.pause();
        return;
      }

      clearTrackChangeTimer();
      clearStallTimer();
      clearReconnectTimer();
      reconnectAttemptRef.current = 0;
      intendsPlayRef.current = true;
      setCurrentStation(station);
      setLoading(true);

      audio.src = streamSrcWithCacheBust(station.streamUrl);

      const cached = recallStationSnapshot(station.id);
      if (cached) {
        setNowPlaying(enrichArt(cached, station));
      } else {
        setNowPlaying(loadingPlaceholder(station));
      }

      startPolling(station);

      try {
        await audio.play();
      } catch {
        setLoading(false);
      }
    },
    [
      clearReconnectTimer,
      clearStallTimer,
      clearTrackChangeTimer,
      currentStation,
      enrichArt,
      isPlaying,
      startPolling,
    ],
  );

  const togglePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentStation) return;

    if (isPlaying) {
      intendsPlayRef.current = false;
      clearStallTimer();
      clearReconnectTimer();
      audio.pause();
    } else {
      intendsPlayRef.current = true;
      reconnectAttemptRef.current = 0;
      void audio.play();
    }
  }, [clearReconnectTimer, clearStallTimer, currentStation, isPlaying]);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  const changeVolume = useCallback((v: number) => {
    setVolume(Math.max(0, Math.min(1, v)));
    setMuted(false);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (trackChangeTimerRef.current) {
        clearTimeout(trackChangeTimerRef.current);
        trackChangeTimerRef.current = null;
      }
      clearStallTimer();
      clearReconnectTimer();
      pendingTrackRef.current = null;
    };
  }, [clearReconnectTimer, clearStallTimer]);

  return {
    stations: STATIONS,
    currentStation,
    nowPlaying,
    isPlaying,
    loading,
    volume,
    muted,
    playStation,
    togglePause,
    toggleMute,
    changeVolume,
  };
}
