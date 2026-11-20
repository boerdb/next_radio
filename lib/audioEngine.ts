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
const LIVE_STALL_RECONNECT_MS = 90_000;
const LIVE_STALL_GRACE_MS = 45_000;
const LIVE_ERROR_GRACE_MS = 8_000;
const MAX_RECONNECT_ATTEMPTS = 8;
const IOS_BACKGROUND_RESUME_MS = 500;
/** Na langer pauzeren loopt de buffer achter op de uitzending: stream opnieuw openen. */
const STALE_RESUME_MS = 10_000;
/**
 * Een live MP3-stream speelt na een hapering verder waar hij was: de achterstand
 * blijft en telt op. Loopt de live-zender meer dan dit achter, dan opnieuw
 * verbinden zodat hij weer gelijk loopt met de uitzending.
 */
const LIVE_MAX_LAG_S = 10;
/** Niet vaker dan dit terugspringen, anders blijft een slechte verbinding herladen. */
const LIVE_CATCH_UP_MIN_INTERVAL_MS = 60_000;

export interface EngineState {
  currentStation: Station | null;
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  loading: boolean;
  volume: number;
  muted: boolean;
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
  private pausedAt: number | null = null;
  private liveErrorGraceTimer: ReturnType<typeof setTimeout> | null = null;
  private liveStallGraceTimer: ReturnType<typeof setTimeout> | null = null;
  /** Klok en afspeelpositie bij de eerste "playing" na het openen van de stream. */
  private lagBase: { wallMs: number; mediaS: number } | null = null;
  private lastCatchUpAt = 0;

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
    this.audio.addEventListener("timeupdate", () => {
      this.metadata.pollIfDue();
      this.catchUpIfBehind();
    });

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

  playStation(station: Station): void {
    if (this.state.currentStation?.id === station.id && this.state.isPlaying) {
      this.userPause();
      return;
    }

    this.clearStallTimer();
    this.clearReconnectTimer();
    this.clearBackgroundResumeTimer();
    this.clearLiveGraceTimers();
    this.reconnectAttempt = 0;
    this.pausedAt = null;
    this.intendsPlay = true;

    const nowPlaying = this.metadata.initialNowPlaying(station);
    this.patch({
      currentStation: station,
      nowPlaying,
      loading: true,
    });

    this.metadata.start(station);
    this.audio.preload = isLiveStreamStation(station.id) ? "auto" : "none";
    this.lagBase = null;
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
    if (!this.state.currentStation) return;
    this.intendsPlay = true;
    this.clearBackgroundResumeTimer();
    this.reconnectAttempt = 0;
    const pausedFor = this.pausedAt ? Date.now() - this.pausedAt : 0;
    this.pausedAt = null;
    // Live na pauze altijd opnieuw verbinden: verder spelen uit de buffer
    // betekent achterlopen op de uitzending.
    if (this.isLivePlayback() || pausedFor > STALE_RESUME_MS || this.audio.error) {
      this.reloadStream(true);
      return;
    }
    this.patch({ loading: true });
    void this.audio.play().catch(() => this.patch({ loading: false }));
  }

  private userPause(): void {
    this.intendsPlay = false;
    this.pausedAt = Date.now();
    this.clearBackgroundResumeTimer();
    this.clearStallTimer();
    this.clearReconnectTimer();
    this.clearLiveGraceTimers();
    this.audio.pause();
  }

  private isLivePlayback(): boolean {
    return isLiveStreamStation(this.state.currentStation?.id ?? "");
  }

  private reloadStream(cacheBust = true): void {
    const station = this.state.currentStation;
    if (!station || !this.intendsPlay) return;
    this.patch({ loading: true });
    this.lagBase = null;
    this.audio.src = streamUrlFor(station, cacheBust);
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
      const cacheBust = this.isLivePlayback() ? this.reconnectAttempt >= 3 : true;
      this.reloadStream(cacheBust);
    }, backoff);
  }

  private scheduleStallWatch(): void {
    if (!this.intendsPlay || this.stallTimer) return;
    const timeout = isLiveStreamStation(this.state.currentStation?.id ?? "")
      ? LIVE_STALL_RECONNECT_MS
      : STALL_RECONNECT_MS;

    this.stallTimer = setTimeout(() => {
      this.stallTimer = null;
      if (!this.intendsPlay) return;
      if (this.audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return;

      if (this.isLivePlayback()) {
        void this.audio.play().catch(() => {});
        this.clearLiveStallGraceTimer();
        this.liveStallGraceTimer = setTimeout(() => {
          this.liveStallGraceTimer = null;
          if (!this.intendsPlay) return;
          if (
            !this.audio.paused &&
            this.audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA
          ) {
            return;
          }
          this.scheduleReconnect(0);
        }, LIVE_STALL_GRACE_MS);
        return;
      }

      if (this.audio.paused) return;
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

  /** Hoeveel seconden de live-zender achterloopt sinds het openen van de stream. */
  liveLagSeconds(): number | null {
    if (!this.lagBase || !this.isLivePlayback()) return null;
    const wallS = (Date.now() - this.lagBase.wallMs) / 1000;
    const mediaS = this.audio.currentTime - this.lagBase.mediaS;
    return Math.max(0, wallS - mediaS);
  }

  private catchUpIfBehind(): void {
    if (!this.intendsPlay || this.audio.paused) return;
    const lag = this.liveLagSeconds();
    if (lag === null || lag <= LIVE_MAX_LAG_S) return;
    if (Date.now() - this.lastCatchUpAt < LIVE_CATCH_UP_MIN_INTERVAL_MS) return;
    this.lastCatchUpAt = Date.now();
    this.reloadStream(true);
  }

  private onPlaying(): void {
    // Alleen de eerste "playing" na het openen telt; na een hapering volgt er
    // nog een, en dan moet de opgelopen achterstand juist zichtbaar blijven.
    if (!this.lagBase && this.isLivePlayback()) {
      this.lagBase = { wallMs: Date.now(), mediaS: this.audio.currentTime };
    }
    this.clearBackgroundResumeTimer();
    this.clearLiveGraceTimers();
    this.reconnectAttempt = 0;
    this.clearStallTimer();
    this.clearReconnectTimer();
    this.patch({ isPlaying: true, loading: false });

    const station = this.state.currentStation;
    if (station) this.metadata.onPlaybackStarted(station);

    updateMediaSession(
      this.state.nowPlaying,
      station?.name ?? "Bens Music",
      true,
      true,
    );
  }

  private onPause(): void {
    // Bij een stationswissel of iOS-onderbreking blijft "laden" staan.
    this.patch(this.intendsPlay ? { isPlaying: false } : { isPlaying: false, loading: false });
    if (this.intendsPlay) this.scheduleBackgroundResume();
    updateMediaSession(
      this.state.nowPlaying,
      this.state.currentStation?.name ?? "Bens Music",
      false,
    );
  }

  private onWaiting(): void {
    if (!this.isLivePlayback()) {
      this.patch({ loading: true });
    }
    this.scheduleStallWatch();
  }

  private onCanPlay(): void {
    this.clearStallTimer();
    this.clearLiveStallGraceTimer();
    this.patch({ loading: false });
  }

  private onError(): void {
    if (!this.intendsPlay) return;

    if (this.isLivePlayback()) {
      if (!this.liveErrorGraceTimer) {
        void this.audio.play().catch(() => {});
        this.clearReconnectTimer();
        this.liveErrorGraceTimer = setTimeout(() => {
          this.liveErrorGraceTimer = null;
          if (!this.intendsPlay) return;
          if (
            !this.audio.error &&
            !this.audio.paused &&
            this.audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA
          ) {
            return;
          }
          this.scheduleReconnect(0);
        }, LIVE_ERROR_GRACE_MS);
      }
      return;
    }

    this.scheduleReconnect(800);
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

  private clearLiveStallGraceTimer(): void {
    if (this.liveStallGraceTimer) {
      clearTimeout(this.liveStallGraceTimer);
      this.liveStallGraceTimer = null;
    }
  }

  private clearLiveErrorGraceTimer(): void {
    if (this.liveErrorGraceTimer) {
      clearTimeout(this.liveErrorGraceTimer);
      this.liveErrorGraceTimer = null;
    }
  }

  private clearLiveGraceTimers(): void {
    this.clearLiveStallGraceTimer();
    this.clearLiveErrorGraceTimer();
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
