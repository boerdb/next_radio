"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getStationShortcode,
  isAzuracastStation,
  STATIONS,
} from "@/lib/stations";
import {
  setupMediaSessionHandlers,
  updateMediaSession,
} from "@/lib/mediaSession";
import type { NowPlaying, Station } from "@/lib/types";

const METADATA_POLL_MS = 5000;
/** Korte pauze bij trackwissel zodat jingle-metadata niet flitst. */
const TRACK_CHANGE_DELAY_MS = 2500;

function isSameTrack(a: NowPlaying, b: NowPlaying): boolean {
  return a.artist === b.artist && a.title === b.title;
}

export function useRadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nowPlayingRef = useRef<NowPlaying | null>(null);
  const trackChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTrackRef = useRef<NowPlaying | null>(null);

  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    const onPlaying = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);

    setupMediaSessionHandlers(
      () => void audio.play(),
      () => audio.pause(),
    );

    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
    audio.muted = muted;
  }, [volume, muted]);

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
    (data: NowPlaying, station: Station, prev?: NowPlaying | null) => ({
      ...data,
      art:
        data.art ??
        (prev && isSameTrack(prev, data) ? prev.art : null) ??
        station.defaultArt ??
        null,
    }),
    [],
  );

  const applyMetadata = useCallback(
    (data: NowPlaying, station: Station) => {
      const current = nowPlayingRef.current;
      const enriched = enrichArt(data, station, current);

      if (!current || isSameTrack(current, enriched)) {
        clearTrackChangeTimer();
        setNowPlaying((prev) =>
          prev && isSameTrack(prev, enriched)
            ? enrichArt(enriched, station, prev)
            : enriched,
        );
        return;
      }

      pendingTrackRef.current = enriched;
      if (trackChangeTimerRef.current) {
        clearTimeout(trackChangeTimerRef.current);
      }
      trackChangeTimerRef.current = setTimeout(() => {
        if (pendingTrackRef.current) {
          setNowPlaying(pendingTrackRef.current);
        }
        pendingTrackRef.current = null;
        trackChangeTimerRef.current = null;
      }, TRACK_CHANGE_DELAY_MS);
    },
    [clearTrackChangeTimer, enrichArt],
  );

  const fetchMetadata = useCallback(
    async (station: Station) => {
      try {
        let url: string;
        if (isAzuracastStation(station.stationApiId)) {
          url = `/api/now-playing?station=${getStationShortcode(station.stationApiId)}`;
        } else if (station.id === "live") {
          url = "/api/live-metadata";
        } else {
          url = "/api/npo-metadata";
        }

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as NowPlaying | null;
        if (data) applyMetadata(data, station);
      } catch {
        /* ignore poll errors */
      }
    },
    [applyMetadata],
  );

  const startPolling = useCallback(
    (station: Station) => {
      if (pollRef.current) clearInterval(pollRef.current);
      void fetchMetadata(station);
      pollRef.current = setInterval(() => void fetchMetadata(station), METADATA_POLL_MS);
    },
    [fetchMetadata],
  );

  const playStation = useCallback(
    async (station: Station) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (currentStation?.id === station.id && isPlaying) {
        audio.pause();
        return;
      }

      clearTrackChangeTimer();
      setCurrentStation(station);
      setLoading(true);

      const separator = station.streamUrl.includes("?") ? "&" : "?";
      audio.src = `${station.streamUrl}${separator}nocache=${Date.now()}`;

      if (!nowPlaying || currentStation?.id !== station.id) {
        setNowPlaying({
          artist: station.name,
          title: "Verbinden...",
          art: station.defaultArt ?? null,
          elapsed: 0,
          duration: 0,
          listeners: 0,
          isLive: station.id === "live",
        });
      }

      startPolling(station);

      try {
        await audio.play();
      } catch {
        setLoading(false);
      }
    },
    [clearTrackChangeTimer, currentStation, isPlaying, nowPlaying, startPolling],
  );

  const togglePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentStation) return;

    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
  }, [currentStation, isPlaying]);

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
      pendingTrackRef.current = null;
    };
  }, []);

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
