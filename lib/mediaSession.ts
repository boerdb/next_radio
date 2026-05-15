import type { NowPlaying } from "./types";

export function updateMediaSession(
  nowPlaying: NowPlaying | null,
  stationName: string,
  isPlaying: boolean,
): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
    return;
  }

  const ms = navigator.mediaSession;
  ms.playbackState = isPlaying ? "playing" : "paused";

  if (!nowPlaying) {
    ms.metadata = new MediaMetadata({ title: stationName });
    return;
  }

  const artwork: MediaImage[] = [];
  if (nowPlaying.art) {
    artwork.push(
      { src: nowPlaying.art, sizes: "96x96", type: "image/jpeg" },
      { src: nowPlaying.art, sizes: "256x256", type: "image/jpeg" },
      { src: nowPlaying.art, sizes: "512x512", type: "image/jpeg" },
    );
  }

  ms.metadata = new MediaMetadata({
    title: nowPlaying.title || stationName,
    artist: nowPlaying.artist || stationName,
    album: stationName,
    artwork,
  });
}

export function setupMediaSessionHandlers(
  onPlay: () => void,
  onPause: () => void,
): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
    return;
  }

  navigator.mediaSession.setActionHandler("play", onPlay);
  navigator.mediaSession.setActionHandler("pause", onPause);
  navigator.mediaSession.setActionHandler("stop", onPause);
}
