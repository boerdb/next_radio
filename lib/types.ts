export interface Station {
  id: string;
  name: string;
  streamUrl: string;
  defaultArt?: string;
  /** Vierkant stationslogo voor de stationlijst (valt terug op defaultArt). */
  logo?: string;
  /** Multiplier on slider volume (e.g. 0.75 if stream is louder than others). */
  playbackVolume?: number;
}

export interface NowPlaying {
  artist: string;
  title: string;
  art: string | null;
  isLive: boolean;
}
