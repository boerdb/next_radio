import {
  connectionModeForStation,
  type ConnectionMode,
} from "./connectionStatus";
import { MetadataService } from "./metadataService";
import {
  setupMediaSessionHandlers,
  updateMediaSession,
} from "./mediaSession";
import { isLiveStreamStation } from "./liveStreamUrl";
import { setPlaybackActive } from "./playbackGate";
import { STATIONS } from "./stations";
import { streamUrlFor } from "./streamTransport";
import type { NowPlaying, Station } from "./types";

const STALL_RECONNECT_MS = 10_000;
const LIVE_STALL_RECONNECT_MS = 45_000;
const MAX_RECONNECT_ATTEMPTS = 8;
const IOS_BACKGROUND_RESUME_MS = 500;

export interface EngineState {
  currentStation: Station | null;
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  loading: boolean;
  volume: number;
  muted: boolean;
  connectionMode: ConnectionMode;
}

type StateListener = (state: EngineState) => void;

function defaultState(): EngineState {
  return {
    currentStation: null,
    nowPlaying: null,
    isPlaying: false,
    loading: false,
    volume: 1,
    muted: false,
    connectionMode: "idle",
  };
}

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private audio: HTMLAudioElement;
  private state: EngineState = defaultState();
  private listeners = new Set<StateListener>();
  private intendsPlay = false;
  private metadata = new MetadataService();
  private initialized = false;

  private stallTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private backgroundResumeTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;

  static getInstance(): AudioEngine {
    if (typeof window === "undefined") {
      throw new Error("AudioEngine is only available in the browser");
    }
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private constructor() {
    this.audio = document.createElement("audio");
    this.audio.preload = "none";
    this.audio.setAttribute("playsinline", "");
    this.audio.className = "sr-only-audio";
    document.body.appendChild(this.audio);

    this.metadata.setListener((nowPlaying) => {
      this.patch({ nowPlaying });
      updateMediaSession(
        nowPlaying,
        this.state.currentStation?.name ?? "Bens Music",
        this.state.isPlaying,
      );
    });
  }

  /** Wire listeners once — survives React remounts. */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.audio.addEventListener("playing", () => this.onPlaying());
    this.audio.addEventListener("pause", () => this.onPause());
    this.audio.addEventListener("waiting", () => this.onWaiting());
    this.audio.addEventListener("canplay", () => this.onCanPlay());
    this.audio.addEventListener("error", () => this.onError());
    this.audio.addEventListener("stalled", () => this.onStalled());
    this.audio.addEventListener("ended", () => this.onEnded());

    setupMediaSessionHandlers(
      () => this.userPlay(),
      () => this.userPause(),
      () => this.nextStation(),
      () => this.previousStation(),
    );

    window.addEventListener("online", () => this.onOnline());
    window.addEventListener("pageshow", () => this.resumeIfIntended());
    document.addEventListener("visibilitychange", () => this.onVisibilityChange());
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): EngineState {
    return this.state;
  }

  getAudioElement(): HTMLAudioElement {
    return this.audio;
  }

  playStation(station: Station): void {
    if (this.state.currentStation?.id === station.id && this.state.isPlaying) {
      this.userPause();
      return;
    }

    this.clearStallTimer();
    this.clearReconnectTimer();
    this.clearBackgroundResumeTimer();
    this.reconnectAttempt = 0;
    this.intendsPlay = true;

    const nowPlaying = this.metadata.initialNowPlaying(station);
    this.patch({
      currentStation: station,
      nowPlaying,
      loading: true,
      connectionMode: connectionModeForStation(station.id),
    });

    this.metadata.start(station);
    this.audio.src = streamUrlFor(station, true);
    this.applyVolume();
    void this.audio.play().catch(() => this.patch({ loading: false }));

    updateMediaSession(
      nowPlaying,
      station.name,
      false,
    );
  }

  togglePause(): void {
    if (!this.state.currentStation) return;
    if (this.state.isPlaying) {
      this.userPause();
    } else {
      this.userPlay();
    }
  }

  toggleMute(): void {
    this.patch({ muted: !this.state.muted });
    this.applyVolume();
  }

  setVolume(volume: number): void {
    this.patch({ volume: Math.max(0, Math.min(1, volume)), muted: false });
    this.applyVolume();
  }

  nextStation(): void {
    if (!this.state.currentStation) return;
    const idx = STATIONS.findIndex((s) => s.id === this.state.currentStation!.id);
    const next = STATIONS[(idx + 1) % STATIONS.length];
    this.playStation(next);
  }

  previousStation(): void {
    if (!this.state.currentStation) return;
    const idx = STATIONS.findIndex((s) => s.id === this.state.currentStation!.id);
    const prev = STATIONS[(idx - 1 + STATIONS.length) % STATIONS.length];
    this.playStation(prev);
  }

  private userPlay(): void {
    this.intendsPlay = true;
    this.clearBackgroundResumeTimer();
    this.reconnectAttempt = 0;
    void this.audio.play().catch(() => this.patch({ loading: false }));
  }

  private userPause(): void {
    this.intendsPlay = false;
    this.clearBackgroundResumeTimer();
    this.clearStallTimer();
    this.clearReconnectTimer();
    this.audio.pause();
  }

  private reloadStream(): void {
    const station = this.state.currentStation;
    if (!station || !this.intendsPlay) return;
    this.patch({ loading: true });
    this.audio.src = streamUrlFor(station, true);
    this.audio.load();
    void this.audio.play().catch(() => this.patch({ loading: false }));
  }

  private scheduleReconnect(delayMs = 0): void {
    if (!this.intendsPlay || !this.state.currentStation) return;
    this.clearReconnectTimer();
    this.clearStallTimer();

    if (this.reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      this.patch({ loading: false });
      return;
    }

    const backoff =
      delayMs > 0 ? delayMs : Math.min(1000 * 2 ** this.reconnectAttempt, 15_000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.intendsPlay) return;
      this.reconnectAttempt += 1;
      this.reloadStream();
    }, backoff);
  }

  private scheduleStallWatch(): void {
    if (!this.intendsPlay || this.stallTimer) return;
    const timeout = isLiveStreamStation(this.state.currentStation?.id ?? "")
      ? LIVE_STALL_RECONNECT_MS
      : STALL_RECONNECT_MS;

    this.stallTimer = setTimeout(() => {
      this.stallTimer = null;
      if (!this.intendsPlay || this.audio.paused) return;
      if (this.audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return;
      this.scheduleReconnect(500);
    }, timeout);
  }

  private resumeIfIntended(): void {
    if (!this.intendsPlay || !this.audio.paused) return;
    void this.audio.play().catch(() => this.patch({ loading: false }));
  }

  private scheduleBackgroundResume(): void {
    if (!this.intendsPlay) return;
    this.clearBackgroundResumeTimer();
    this.backgroundResumeTimer = setTimeout(() => {
      this.backgroundResumeTimer = null;
      this.resumeIfIntended();
    }, IOS_BACKGROUND_RESUME_MS);
  }

  private applyVolume(): void {
    const gain = this.state.currentStation?.playbackVolume ?? 1;
    this.audio.volume = this.state.muted ? 0 : this.state.volume * gain;
    this.audio.muted = this.state.muted;
  }

  private patch(partial: Partial<EngineState>): void {
    this.state = { ...this.state, ...partial };
    setPlaybackActive(this.state.isPlaying);
    this.listeners.forEach((l) => l(this.state));
  }

  private onPlaying(): void {
    this.clearBackgroundResumeTimer();
    this.reconnectAttempt = 0;
    this.clearStallTimer();
    this.clearReconnectTimer();
    this.patch({ isPlaying: true, loading: false });
    setPlaybackActive(true);

    const station = this.state.currentStation;
    if (station) this.metadata.onPlaybackStarted(station);

    updateMediaSession(
      this.state.nowPlaying,
      station?.name ?? "Bens Music",
      true,
    );
  }

  private onPause(): void {
    this.patch({ isPlaying: false });
    setPlaybackActive(false);
    if (this.intendsPlay) this.scheduleBackgroundResume();
    updateMediaSession(
      this.state.nowPlaying,
      this.state.currentStation?.name ?? "Bens Music",
      false,
    );
  }

  private onWaiting(): void {
    this.patch({ loading: true });
    this.scheduleStallWatch();
  }

  private onCanPlay(): void {
    this.clearStallTimer();
    this.patch({ loading: false });
  }

  private onError(): void {
    if (!this.intendsPlay) return;
    const live = isLiveStreamStation(this.state.currentStation?.id ?? "");
    this.scheduleReconnect(live ? 2000 : 800);
  }

  private onStalled(): void {
    if (this.intendsPlay) this.scheduleStallWatch();
  }

  private onEnded(): void {
    if (!this.intendsPlay) return;
    if (isLiveStreamStation(this.state.currentStation?.id ?? "")) return;
    this.scheduleReconnect(500);
  }

  private onOnline(): void {
    if (!this.intendsPlay || !this.state.currentStation) return;
    if (this.state.isPlaying) return;
    this.scheduleReconnect(300);
  }

  private onVisibilityChange(): void {
    if (document.visibilityState !== "visible" || !this.intendsPlay) return;
    this.resumeIfIntended();
    const station = this.state.currentStation;
    if (!station || !this.audio.paused) return;
    if (isLiveStreamStation(station.id)) return;
    if (this.audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      this.scheduleReconnect(300);
    }
  }

  private clearStallTimer(): void {
    if (this.stallTimer) {
      clearTimeout(this.stallTimer);
      this.stallTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearBackgroundResumeTimer(): void {
    if (this.backgroundResumeTimer) {
      clearTimeout(this.backgroundResumeTimer);
      this.backgroundResumeTimer = null;
    }
  }
}

export function getAudioEngine(): AudioEngine | null {
  if (typeof window === "undefined") return null;
  return AudioEngine.getInstance();
}
