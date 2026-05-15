"use client";

import { AppHeader } from "./AppHeader";
import { AndroidInstallBanner } from "./AndroidInstallBanner";
import { IosInstallBanner } from "./IosInstallBanner";
import { PwaUpdateBanner } from "./PwaUpdateBanner";
import { NowPlayingCard } from "./NowPlayingCard";
import { PlayerBar } from "./PlayerBar";
import { StationList } from "./StationList";
import { WeatherWidget } from "./WeatherWidget";
import { useRadioPlayer } from "@/hooks/useRadioPlayer";

export function RadioApp() {
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
  } = useRadioPlayer();

  return (
    <div className="flex h-dvh flex-col bg-[var(--background)]">
      <AppHeader />
      <PwaUpdateBanner />
      <IosInstallBanner />
      <AndroidInstallBanner />
      <WeatherWidget />
      <NowPlayingCard
        station={currentStation}
        nowPlaying={nowPlaying}
        isPlaying={isPlaying}
      />
      <StationList
        stations={stations}
        currentStation={currentStation}
        isPlaying={isPlaying}
        onSelect={playStation}
      />
      <PlayerBar
        station={currentStation}
        isPlaying={isPlaying}
        loading={loading}
        volume={volume}
        muted={muted}
        onTogglePause={togglePause}
        onToggleMute={toggleMute}
        onVolumeChange={changeVolume}
      />
    </div>
  );
}
