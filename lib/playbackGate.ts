/** Lets PWA update logic know when a reload would interrupt playback. */
let playbackActive = false;

export function setPlaybackActive(active: boolean): void {
  playbackActive = active;
}

export function safeToReloadForUpdate(): boolean {
  return !playbackActive;
}
