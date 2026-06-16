"use client";

import { useState } from "react";
import { AppHeader } from "./AppHeader";
import { ConnectionStatus } from "./ConnectionStatus";
import { NowPlayingCard } from "./NowPlayingCard";
import { PlayerBar } from "./PlayerBar";
import { SettingsSheet } from "./SettingsSheet";
import { StationPicker } from "./StationPicker";
import { usePlayer } from "./PlayerProvider";

export function RadioApp() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    stations,
    currentStation,
    nowPlaying,
    isPlaying,
    loading,
    volume,
    muted,
    connectionMode,
    playStation,
    togglePause,
    toggleMute,
    changeVolume,
  } = usePlayer();

  return (
    <div className="flex h-dvh flex-col bg-[var(--background)]">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      <ConnectionStatus
        mode={connectionMode}
        loading={loading}
        isPlaying={isPlaying}
      />
      <NowPlayingCard
        station={currentStation}
        nowPlaying={nowPlaying}
        isPlaying={isPlaying}
        loading={loading}
      />
      <StationPicker
        stations={stations}
        currentStation={currentStation}
        isPlaying={isPlaying}
        onSelect={playStation}
      />
      <PlayerBar
        station={currentStation}
        nowPlaying={nowPlaying}
        isPlaying={isPlaying}
        loading={loading}
        volume={volume}
        muted={muted}
        onTogglePause={togglePause}
        onToggleMute={toggleMute}
        onVolumeChange={changeVolume}
      />
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
