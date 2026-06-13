"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AudioEngine,
  type EngineState,
} from "@/lib/audioEngine";
import { STATIONS } from "@/lib/stations";
import type { Station } from "@/lib/types";

interface PlayerContextValue extends EngineState {
  stations: Station[];
  playStation: (station: Station) => void;
  togglePause: () => void;
  toggleMute: () => void;
  changeVolume: (volume: number) => void;
  nextStation: () => void;
  previousStation: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EngineState>(() => ({
    currentStation: null,
    nowPlaying: null,
    isPlaying: false,
    loading: false,
    volume: 1,
    muted: false,
    connectionMode: "idle",
  }));

  useEffect(() => {
    const engine = AudioEngine.getInstance();
    engine.init();
    return engine.subscribe(setState);
  }, []);

  const playStation = useCallback((station: Station) => {
    AudioEngine.getInstance().playStation(station);
  }, []);

  const togglePause = useCallback(() => {
    AudioEngine.getInstance().togglePause();
  }, []);

  const toggleMute = useCallback(() => {
    AudioEngine.getInstance().toggleMute();
  }, []);

  const changeVolume = useCallback((volume: number) => {
    AudioEngine.getInstance().setVolume(volume);
  }, []);

  const nextStation = useCallback(() => {
    AudioEngine.getInstance().nextStation();
  }, []);

  const previousStation = useCallback(() => {
    AudioEngine.getInstance().previousStation();
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      ...state,
      stations: STATIONS,
      playStation,
      togglePause,
      toggleMute,
      changeVolume,
      nextStation,
      previousStation,
    }),
    [
      state,
      playStation,
      togglePause,
      toggleMute,
      changeVolume,
      nextStation,
      previousStation,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return ctx;
}
