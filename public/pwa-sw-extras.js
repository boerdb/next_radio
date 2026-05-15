/** Handles skip-waiting from the update banner (Workbox + plain postMessage). */
self.addEventListener("message", (event) => {
  const data = event.data;
  const type =
    typeof data === "string"
      ? data
      : data && typeof data === "object"
        ? data.type
        : undefined;

  if (type === "SKIP_WAITING" || type === "skipWaiting") {
    self.skipWaiting();
  }
});
