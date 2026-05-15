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

const METADATA_POLL_MS = 12000;

export function useRadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    updateMediaSession(nowPlaying, currentStation?.name ?? "Bens Music", isPlaying);
  }, [nowPlaying, currentStation, isPlaying]);

  const fetchMetadata = useCallback(async (station: Station) => {
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
      if (data) setNowPlaying(data);
    } catch {
      /* ignore poll errors */
    }
  }, []);

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
    [currentStation, isPlaying, nowPlaying, startPolling],
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
