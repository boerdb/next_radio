"use client";

import { useCallback, useEffect, useState } from "react";
import { usePwaUpdate } from "@/hooks/usePwaUpdate";
import { AppHeader } from "./AppHeader";
import { NowPlayingCard } from "./NowPlayingCard";
import { PlayerBar } from "./PlayerBar";
import { SettingsSheet } from "./SettingsSheet";
import { StationList } from "./StationList";
import { usePlayer } from "./PlayerProvider";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    tag === "BUTTON" ||
    target.isContentEditable
  );
}

export function RadioApp() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const { updateAvailable, applyUpdate, dismissUpdate } = usePwaUpdate();
  const {
    stations,
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
    nextStation,
    previousStation,
  } = usePlayer();

  const handleTogglePause = () => {
    if (!currentStation) {
      if (stations[0]) playStation(stations[0]);
      return;
    }
    togglePause();
  };

  const handleSelectStation = (station: (typeof stations)[number]) => {
    if (currentStation?.id === station.id && !loading) {
      togglePause();
      return;
    }
    playStation(station);
  };

  // Sneltoetsen: spatie = afspelen/pauze, pijltjes = vorige/volgende, M = dempen
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (settingsOpen || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (event.key === " ") {
        event.preventDefault();
        handleTogglePause();
      } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        nextStation();
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        previousStation();
      } else if (event.key === "m" || event.key === "M") {
        toggleMute();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="app-backdrop fixed inset-0 flex flex-col">
      <AppHeader
        onOpenSettings={() => setSettingsOpen(true)}
        updateAvailable={updateAvailable}
      />

      <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-10 md:px-8">
        <NowPlayingCard
          station={currentStation}
          nowPlaying={nowPlaying}
          isPlaying={isPlaying}
          loading={loading}
        />
        <StationList
          stations={stations}
          currentStation={currentStation}
          isPlaying={isPlaying}
          loading={loading}
          nowPlaying={nowPlaying}
          onSelect={handleSelectStation}
        />
      </main>

      <PlayerBar
        station={currentStation}
        nowPlaying={nowPlaying}
        isPlaying={isPlaying}
        loading={loading}
        volume={volume}
        muted={muted}
        onTogglePause={handleTogglePause}
        onToggleMute={toggleMute}
        onVolumeChange={changeVolume}
        onNext={nextStation}
        onPrevious={previousStation}
      />
      <SettingsSheet
        open={settingsOpen}
        onClose={closeSettings}
        updateAvailable={updateAvailable}
        onApplyUpdate={applyUpdate}
        onDismissUpdate={dismissUpdate}
      />
    </div>
  );
}
