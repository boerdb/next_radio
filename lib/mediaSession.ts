import { APP_ICON } from "./appIcon";
import type { NowPlaying } from "./types";

/** iOS toont soms alleen klein artwork (mini-speler), soms alleen groot: geef ze allemaal. */
const ARTWORK_SIZES = [96, 256, 512];

let textKey = "";
let artworkSource = "";
let artworkImages: MediaImage[] = [];
let artworkBlobUrls: string[] = [];
let currentText: Pick<MediaMetadataInit, "title" | "artist" | "album"> = {};

function applyMetadata(): void {
  navigator.mediaSession.metadata = new MediaMetadata({
    ...currentText,
    artwork: artworkImages,
  });
}

function renderArtwork(img: HTMLImageElement, size: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (!side) return Promise.reject(new Error("image has no size"));
  canvas.getContext("2d")?.drawImage(
    img,
    (img.naturalWidth - side) / 2,
    (img.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.88,
    );
  });
}

/**
 * Maakt vierkante JPEG's op maat, zodat de opgegeven afmetingen altijd kloppen
 * en ook SVG-logo's op het vergrendelscherm en via Bluetooth zichtbaar zijn.
 */
async function refreshArtwork(source: string): Promise<void> {
  artworkSource = source;
  let images: MediaImage[];
  let blobUrls: string[] = [];
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = source;
    await img.decode();
    const blobs = await Promise.all(
      ARTWORK_SIZES.map((size) => renderArtwork(img, size)),
    );
    blobUrls = blobs.map((blob) => URL.createObjectURL(blob));
    images = blobs.map((blob, i) => ({
      src: blobUrls[i],
      sizes: `${ARTWORK_SIZES[i]}x${ARTWORK_SIZES[i]}`,
      type: blob.type,
    }));
  } catch {
    // Bron staat geen CORS toe: dan het origineel, zonder afmetingen te gokken.
    const fallback = /\.svg($|\?)/i.test(source) ? APP_ICON : source;
    images = [{ src: new URL(fallback, window.location.href).href }];
  }

  if (source !== artworkSource) {
    blobUrls.forEach((url) => URL.revokeObjectURL(url));
    return;
  }
  artworkImages = images;
  applyMetadata();
  artworkBlobUrls.forEach((url) => URL.revokeObjectURL(url));
  artworkBlobUrls = blobUrls;
}

export function updateMediaSession(
  nowPlaying: NowPlaying | null,
  stationName: string,
  isPlaying: boolean,
  /** iOS kan metadata vergeten die vóór het afspelen is gezet: dan opnieuw zetten. */
  reapply = false,
): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
    return;
  }

  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

  const text = {
    title: nowPlaying?.title || stationName,
    artist: nowPlaying?.artist || stationName,
    album: stationName,
  };
  const key = JSON.stringify(text);
  const source = nowPlaying?.art || APP_ICON;
  const textChanged = key !== textKey;

  // De metadata-poll roept dit elke paar seconden aan, ook als er niets wisselt.
  if (textChanged || reapply) {
    textKey = key;
    currentText = text;
    applyMetadata();
  }
  if (source !== artworkSource) void refreshArtwork(source);
}

export function setupMediaSessionHandlers(
  onPlay: () => void,
  onPause: () => void,
  onNext?: () => void,
  onPrevious?: () => void,
): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
    return;
  }

  navigator.mediaSession.setActionHandler("play", onPlay);
  navigator.mediaSession.setActionHandler("pause", onPause);
  navigator.mediaSession.setActionHandler("stop", onPause);

  if (onNext) {
    try {
      navigator.mediaSession.setActionHandler("nexttrack", onNext);
    } catch {
      /* unsupported */
    }
  }
  if (onPrevious) {
    try {
      navigator.mediaSession.setActionHandler("previoustrack", onPrevious);
    } catch {
      /* unsupported */
    }
  }
}
