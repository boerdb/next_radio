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
    bindAudioRef,
    playStation,
    togglePause,
    toggleMute,
    changeVolume,
  } = useRadioPlayer();

  return (
    <div className="flex h-dvh flex-col bg-[var(--background)]">
      {/* In-DOM audio: iOS PWA speelt betrouwbaarder door op achtergrond dan losse Audio() */}
      <audio
        ref={bindAudioRef}
        preload="none"
        playsInline
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
      <AppHeader />
      <PwaUpdateBanner />
      <IosInstallBanner />
      <AndroidInstallBanner />
      <WeatherWidget />
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
