/** Normalized key for caching artwork / metadata per track. */
export function trackArtKey(artist: string, title: string): string {
  return `${artist.trim().toLowerCase()}|${title.trim().toLowerCase()}`;
}
