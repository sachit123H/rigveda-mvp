/**
 * lib/mantra-loader.ts
 *
 * Unified data-access abstraction for mantra records.
 *
 * Strategy (in order):
 *  1. If DATABASE_URL is set and Prisma client is initialised, query the DB.
 *  2. Otherwise fall back to reading the flat JSON file from `data/`.
 *
 * This allows the frontend and API route to work identically in both
 * environments (DB-backed prod and JSON-backed local dev) with zero changes
 * to call sites.
 */

import fs from "fs";
import path from "path";

// ── Shared Type Definitions ──────────────────────────────────────────────────
// These mirror the shape of both the JSON payload and the DB query result.

export interface PadaWord {
  word_index: number;
  pada: string;
  lemma: string;
  grammar: string;
  literal_meaning: string;
}

export interface MantraData {
  id: string;
  mandala: number;
  sukta: number;
  mantra: number;
  meter: string;
  deity: string;
  rishi: string;
  /** Full Samhitapātha string — pitch accent Unicode codepoints preserved */
  samhitapatha: string;
  /** Padapātha word array */
  padapatha: PadaWord[];
  /** Padapātha string layer (may differ from token array join) */
  padapathaText?: string;
  /** IAST transliteration (may be null until pipeline generates it) */
  iast?: string;
  translation: {
    author: string;
    license: string;
    fluid_text: string;
  };
  commentary: {
    author: string;
    language: string;
    text: string;
  };
  /** token_mapping: maps samhita token indices (string keys, 0-based) → word_index[] */
  token_mapping?: Record<string, number[]>;
}

export interface SuktaQueryKey {
  veda: string;
  shakha: string;
  mandala: number;
  sukta: number;
}

// ── JSON Flat-File Loader ────────────────────────────────────────────────────

/**
 * Determines the correct flat JSON file path for a given query key.
 * Currently only Rigveda Mandala 1 exists as rv_1_1.json.
 * Extend this map as more data files are added.
 */
function getJsonFilePath(key: SuktaQueryKey): string | null {
  const { veda, mandala } = key;
  if (veda === "rigveda" && mandala === 1) {
    return path.join(process.cwd(), "data", "rv_1_1.json");
  }
  return null;
}

function loadFromJson(key: SuktaQueryKey): MantraData[] {
  const filePath = getJsonFilePath(key);
  if (!filePath) return [];

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const all = JSON.parse(raw) as MantraData[];
    return all.filter(
      (m) => m.mandala === key.mandala && m.sukta === key.sukta
    );
  } catch {
    console.error(`[mantra-loader] Failed to read JSON at ${filePath}`);
    return [];
  }
}

// ── Database Loader ──────────────────────────────────────────────────────────

/**
 * Dynamically imports the Prisma client to avoid breaking builds
 * when DATABASE_URL is not set or the schema has not been migrated.
 */
async function loadFromDatabase(key: SuktaQueryKey): Promise<MantraData[]> {
  try {
    // Dynamic import prevents build-time errors in environments without a DB
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const mantras = await prisma.mantra.findMany({
      where: {
        sukta: {
          suktaNum: key.sukta,
          text: {
            veda: key.veda,
            shakha: key.shakha.toUpperCase() as never,
            division: key.mandala,
          },
        },
      },
      include: {
        layers: true,
        padaTokens: {
          orderBy: { wordIndex: "asc" },
        },
        sukta: {
          select: {
            text: {
              select: { veda: true, division: true },
            },
          },
        },
      },
      orderBy: { mantraNum: "asc" },
    });

    await prisma.$disconnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (mantras as any[]).map((m: Record<string, any>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layers: Array<Record<string, any>> = m.layers ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const padaTokens: Array<Record<string, any>> = m.padaTokens ?? [];

      const samhitaLayer = layers.find((l) => l.layerType === "SAMHITAPATHA");
      const padaLayer = layers.find((l) => l.layerType === "PADAPATHA");
      const iastLayer = layers.find((l) => l.layerType === "IAST");
      const transLayer = layers.find(
        (l) => l.layerType === "TRANSLATION" && l.language === "en"
      );
      const commentLayer = layers.find(
        (l) => l.layerType === "COMMENTARY" && l.language === "sa"
      );

      return {
        id: m.stableId as string,
        mandala: (m.sukta?.text?.division ?? key.mandala) as number,
        sukta: key.sukta,
        mantra: m.mantraNum as number,
        meter: m.meter as string,
        deity: m.deity as string,
        rishi: m.rishi as string,
        samhitapatha: (samhitaLayer?.content as string) ?? "",
        padapathaText: padaLayer?.content as string | undefined,
        iast: iastLayer?.content as string | undefined,
        padapatha: padaTokens.map((t) => ({
          word_index: t.wordIndex as number,
          pada: t.pada as string,
          lemma: t.lemma as string,
          grammar: t.grammar as string,
          literal_meaning: t.literalMeaning as string,
        })),
        translation: {
          author: (transLayer?.author as string) ?? "Unknown",
          license: (transLayer?.license as string) ?? "",
          fluid_text: (transLayer?.content as string) ?? "",
        },
        commentary: {
          author: (commentLayer?.author as string) ?? "Sāyaṇa",
          language: (commentLayer?.language as string) ?? "sa",
          text: (commentLayer?.content as string) ?? "",
        },
        token_mapping: padaTokens.reduce(
          (acc: Record<string, number[]>, t) => {
            if (t.tokenMapping) {
              const tm = t.tokenMapping as Record<string, number[]>;
              Object.assign(acc, tm);
            }
            return acc;
          },
          {} as Record<string, number[]>
        ),
      };
    });
  } catch (err) {
    // DB unavailable — log and return empty so JSON fallback takes over
    console.warn("[mantra-loader] Database query failed, falling back to JSON:", err);
    return [];
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Load mantras for a given sukta. Tries the DB first; falls back to JSON.
 *
 * @returns Array of MantraData sorted by mantra number ascending.
 *          Returns [] for an out-of-range or undigitised sukta.
 */
export async function loadMantras(key: SuktaQueryKey): Promise<MantraData[]> {
  const hasDatabase = !!process.env.DATABASE_URL;

  if (hasDatabase) {
    const dbResult = await loadFromDatabase(key);
    if (dbResult.length > 0) return dbResult;
    // DB returned nothing — fall through to JSON (DB not seeded yet)
    console.warn(
      `[mantra-loader] DB returned 0 mantras for ${key.veda}/${key.shakha}/${key.mandala}/${key.sukta}, falling back to JSON`
    );
  }

  return loadFromJson(key);
}

/**
 * Synchronous JSON-only loader.
 * Use this only in server components where top-level await is not available
 * and you are certain DATABASE_URL is not set (e.g. during static generation
 * of non-DB routes).
 */
export function loadMantrasSync(key: SuktaQueryKey): MantraData[] {
  return loadFromJson(key);
}
