/**
 * Monitors Bens Web Radio Live playback for gaps/reconnects.
 * Usage: node scripts/live-soak-test.mjs [minutes] [url]
 */
import { chromium } from "playwright";

const MINUTES = Number(process.argv[2] ?? 20);
const BASE_URL = process.argv[3] ?? "http://localhost:3000";
const POLL_MS = 15_000;

const monitorScript = `
(() => {
  if (window.__liveSoak) return window.__liveSoak.stats();
  const audio = document.querySelector("audio");
  const stats = {
    startedAt: Date.now(),
    waiting: 0,
    stalled: 0,
    error: 0,
    playing: 0,
    srcChanges: 0,
    loadingFlips: 0,
    gapMs: 0,
    titles: [],
    lastTitle: "",
    lastSrc: audio?.src ?? "",
    lastPlayingAt: Date.now(),
    reconnects: 0,
  };
  let lastLoading = false;
  let gapStart = null;

  const noteTitle = () => {
    const title = document.querySelector("section h2")?.textContent?.trim() ?? "";
    if (title && title !== stats.lastTitle) {
      stats.lastTitle = title;
      stats.titles.push({ at: Date.now(), title });
    }
  };

  if (audio) {
    audio.addEventListener("waiting", () => { stats.waiting += 1; });
    audio.addEventListener("stalled", () => { stats.stalled += 1; });
    audio.addEventListener("error", () => { stats.error += 1; });
    audio.addEventListener("playing", () => {
      stats.playing += 1;
      stats.lastPlayingAt = Date.now();
      if (gapStart) {
        stats.gapMs += Date.now() - gapStart;
        gapStart = null;
      }
    });
    const srcDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "src");
    if (srcDesc?.set) {
      Object.defineProperty(audio, "src", {
        ...srcDesc,
        set(value) {
          stats.srcChanges += 1;
          stats.reconnects += 1;
          stats.lastSrc = String(value);
          return srcDesc.set.call(this, value);
        },
      });
    }
  }

  setInterval(() => {
    noteTitle();
    const loading = !!document.querySelector(".animate-spin");
    if (loading !== lastLoading) {
      stats.loadingFlips += 1;
      lastLoading = loading;
    }
    if (audio && audio.paused && Date.now() - stats.lastPlayingAt > 400) {
      if (!gapStart) gapStart = Date.now();
    }
  }, 250);

  window.__liveSoak = {
    stats: () => ({ ...stats, now: Date.now(), paused: audio?.paused ?? true, readyState: audio?.readyState ?? 0 }),
  };
  return window.__liveSoak.stats();
})();
`;

async function main() {
  console.log(`Live soak test: ${MINUTES} min on ${BASE_URL}`);
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 60_000 });

  const liveButton = page.getByRole("button", { name: /Bens Web Radio Live/i });
  await liveButton.click();
  await page.waitForTimeout(1000);
  await liveButton.click();
  await page.waitForTimeout(4000);

  const audioReady = await page.evaluate(() => {
    const audio = document.querySelector("audio");
    return {
      hasAudio: !!audio,
      src: audio?.src ?? "",
      paused: audio?.paused ?? true,
      readyState: audio?.readyState ?? 0,
    };
  });
  console.log("Audio after start:", audioReady);
  if (!audioReady.src || audioReady.paused) {
    throw new Error("Live stream did not start — cannot run soak test");
  }

  await page.evaluate(monitorScript);
  const start = Date.now();
  const end = start + MINUTES * 60_000;
  let lastLog = start;

  while (Date.now() < end) {
    await page.waitForTimeout(POLL_MS);
    const stats = await page.evaluate(() => window.__liveSoak?.stats());
    const elapsed = Math.round((Date.now() - start) / 1000);
    if (Date.now() - lastLog >= 60_000) {
      console.log(
        `[${elapsed}s] waiting=${stats.waiting} error=${stats.error} reconnects=${stats.reconnects} gapMs=${stats.gapMs} loadingFlips=${stats.loadingFlips} titles=${stats.titles.length}`,
      );
      lastLog = Date.now();
    }
  }

  const final = await page.evaluate(() => window.__liveSoak?.stats());
  await browser.close();

  const passed =
    final.reconnects === 0 &&
    final.gapMs < 5000 &&
    final.loadingFlips <= 2 &&
    !final.paused &&
    final.readyState >= 3;

  console.log("\n=== SOAK RESULT ===");
  console.log(JSON.stringify(final, null, 2));
  console.log(`PASS: ${passed}`);
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
