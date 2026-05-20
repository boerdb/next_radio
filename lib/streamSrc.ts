/** Cache-bust query so the browser opens a fresh stream connection. */
export function streamSrcWithCacheBust(streamUrl: string): string {
  const separator = streamUrl.includes("?") ? "&" : "?";
  return `${streamUrl}${separator}nocache=${Date.now()}`;
}
