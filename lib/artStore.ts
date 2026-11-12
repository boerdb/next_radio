import { promises as fs } from "node:fs";
import path from "node:path";
import { trackArtKey } from "./trackKey";

/**
 * Vaste lijst van hoezen in een bestand op de server.
 *
 * Een nummer dat al eens is opgezocht kost daarna geen zoekvraag meer bij
 * Apple of MusicBrainz, ook niet na een herstart of deploy. Het bestand staat
 * buiten git (`data/`), zodat `git pull` en `npm run build` het met rust laten.
 *
 * Met de hand verbeteren mag: pas de "url" van een regel aan en sla op; de app
 * leest het bestand opnieuw in zodra het gewijzigd is. Een regel weghalen
 * betekent: de volgende keer opnieuw zoeken.
 */
const STORE_FILE =
  process.env.ART_STORE_FILE ?? path.join(process.cwd(), "data", "hoezen.json");

/** "Niet gevonden" geldt een week; daarna mag er opnieuw gezocht worden. */
const NOT_FOUND_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Even wachten met schrijven, zodat een paar vondsten kort na elkaar één keer schrijven is. */
const SAVE_DELAY_MS = 2000;

type Entry = {
  artist: string;
  title: string;
  /** null = gezocht en niet gevonden. */
  url: string | null;
  /** Datum en tijd van opzoeken (ISO). */
  op: string;
};

let entries = new Map<string, Entry>();
/** Wijzigingstijd van het bestand zoals wij het kennen; -1 = nog niet gelezen. */
let knownMtimeMs = -1;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function isEntry(value: unknown): value is Entry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    (typeof v.url === "string" || v.url === null) && typeof v.op === "string"
  );
}

async function fileMtimeMs(): Promise<number> {
  try {
    return (await fs.stat(STORE_FILE)).mtimeMs;
  } catch {
    return 0; // bestaat (nog) niet
  }
}

/** Leest het bestand in als het nieuw is of buiten de app om is aangepast. */
async function refresh(): Promise<void> {
  const mtimeMs = await fileMtimeMs();
  if (mtimeMs === knownMtimeMs) return;
  knownMtimeMs = mtimeMs;
  if (mtimeMs === 0) return;

  try {
    const parsed: unknown = JSON.parse(await fs.readFile(STORE_FILE, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("geen lijst");
    }
    const next = new Map<string, Entry>();
    for (const [key, value] of Object.entries(parsed)) {
      if (!isEntry(value)) continue;
      next.set(key, {
        artist: typeof value.artist === "string" ? value.artist : "",
        title: typeof value.title === "string" ? value.title : "",
        url: value.url,
        op: value.op,
      });
    }
    entries = next;
  } catch (err) {
    // Onleesbaar (bv. een tikfout na bewerken met de hand): bewaar een kopie,
    // want de volgende vondst schrijft het bestand opnieuw.
    console.error(`[hoezen] ${STORE_FILE} is onleesbaar:`, err);
    await fs
      .copyFile(STORE_FILE, `${STORE_FILE}.onleesbaar`)
      .catch(() => undefined);
  }
}

async function save(): Promise<void> {
  const lines = [...entries].map(
    ([key, entry]) => `  ${JSON.stringify(key)}: ${JSON.stringify(entry)}`,
  );
  const body = `{\n${lines.join(",\n")}\n}\n`;
  const tmp = `${STORE_FILE}.tmp`;
  try {
    await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
    // Eerst naar een tijdelijk bestand: zo staat er nooit een half bestand.
    await fs.writeFile(tmp, body, "utf8");
    await fs.rename(tmp, STORE_FILE);
    knownMtimeMs = await fileMtimeMs();
  } catch (err) {
    // Lukt schrijven niet, dan werkt de lijst nog wel tot de volgende herstart.
    console.error(`[hoezen] kan ${STORE_FILE} niet schrijven:`, err);
  }
}

function scheduleSave(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void save();
  }, SAVE_DELAY_MS);
}

/**
 * Wat we al weten over de hoes van dit nummer:
 * - `undefined`: onbekend, er moet gezocht worden;
 * - `null`: kort geleden gezocht en niet gevonden;
 * - tekst: het adres van de hoes.
 */
export async function getStoredArtwork(
  artist: string,
  title: string,
): Promise<string | null | undefined> {
  await refresh();
  const entry = entries.get(trackArtKey(artist, title));
  if (!entry) return undefined;
  if (entry.url) return entry.url;
  const age = Date.now() - Date.parse(entry.op);
  return age < NOT_FOUND_TTL_MS ? null : undefined;
}

export function storeArtwork(
  artist: string,
  title: string,
  url: string | null,
): void {
  entries.set(trackArtKey(artist, title), {
    artist: artist.trim(),
    title: title.trim(),
    url,
    op: new Date().toISOString(),
  });
  scheduleSave();
}
