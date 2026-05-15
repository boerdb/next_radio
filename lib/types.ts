export interface Station {
  id: string;
  stationApiId: number;
  name: string;
  streamUrl: string;
  defaultArt?: string;
}

export interface NowPlaying {
  artist: string;
  title: string;
  art: string | null;
  elapsed: number;
  duration: number;
  listeners: number;
  isLive: boolean;
}

export interface WeatherData {
  location: string;
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  windSpeed: number;
}
