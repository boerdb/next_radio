import { streamSrcWithCacheBust } from "./streamSrc";
import { isLiveStreamStation, resolveLiveStreamUrl } from "./liveStreamUrl";
import type { Station } from "./types";

export function streamUrlFor(station: Station, cacheBust = false): string {
  const url = isLiveStreamStation(station.id)
    ? resolveLiveStreamUrl()
    : station.streamUrl;
  return cacheBust ? streamSrcWithCacheBust(url) : url;
}
