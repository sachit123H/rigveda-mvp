/**
 * lib/vedic-boundaries.ts
 *
 * Canonical source-of-truth for all Vedic textual boundary definitions used
 * across API route validation, server-component guards, and the texts selector UI.
 *
 * Boundary data is derived from the traditional Anukramaṇī (index) classification
 * of the four-Veda corpus.
 */

// ── Type Definitions ─────────────────────────────────────────────────────────

export interface ShakhaDefinition {
  id: string;
  name: string;
  /** ISO 15919 romanised name */
  iast: string;
}

export interface VedaBoundary {
  id: string;
  name: string;
  sanskritName: string;
  divisionLabel: "Mandala" | "Kāṇḍa" | "Prapāṭhaka";
  subdivisionLabel: string;
  shakhas: ShakhaDefinition[];
  /** Total number of top-level divisions (Mandalas / Kāṇḍas / Prapāṭhakas) */
  maxDivisions: number;
  /**
   * Maps division number → maximum subdivision count (Suktas, Anuvākas, etc.).
   * If all divisions share the same count, a single number may be stored; the
   * `getMaxSubdivisions` helper handles both shapes uniformly.
   */
  maxSubdivisions: Record<number, number> | number;
}

export interface RouteParams {
  veda: string;
  shakha: string;
  mandala: string;
  sukta: string;
}

export interface ValidatedParams {
  veda: string;
  shakha: string;
  mandala: number;
  sukta: number;
}

/** Returned when the requested corpus is not yet in the active dataset. */
export interface RoadmapState {
  type: "roadmap";
  veda: string;
  shakha: string;
  mandala: number;
  sukta: number;
}

/** Returned when params are within the active MVP dataset. */
export interface ActiveState {
  type: "active";
  veda: string;
  shakha: string;
  mandala: number;
  sukta: number;
}

export type BoundaryCheckResult =
  | { valid: false; reason: "invalid_veda" | "invalid_shakha" | "out_of_range" | "non_integer" }
  | { valid: true; state: ActiveState | RoadmapState };

// ── Corpus Boundary Map ───────────────────────────────────────────────────────

export const VEDIC_CORPUS: Record<string, VedaBoundary> = {
  rigveda: {
    id: "rigveda",
    name: "Rigveda",
    sanskritName: "ऋग्वेद",
    divisionLabel: "Mandala",
    subdivisionLabel: "Sūkta",
    shakhas: [
      { id: "sakala", name: "Śākala (शाकल)", iast: "Śākala" },
      { id: "baskala", name: "Bāṣkala (बाष्कल)", iast: "Bāṣkala" },
    ],
    maxDivisions: 10,
    maxSubdivisions: {
      1: 191,
      2: 43,
      3: 62,
      4: 58,
      5: 87,
      6: 75,
      7: 104,
      8: 103,
      9: 114,
      10: 191,
    },
  },
  yajurveda: {
    id: "yajurveda",
    name: "Yajurveda",
    sanskritName: "यजुर्वेद",
    divisionLabel: "Kāṇḍa",
    subdivisionLabel: "Prapāṭhaka / Anuvāka",
    shakhas: [
      { id: "taittiriya", name: "Taittirīya (तैत्तिरीय)", iast: "Taittirīya" },
      { id: "kanva", name: "Kāṇva (काण्व)", iast: "Kāṇva" },
      { id: "madhyandina", name: "Mādhyandina (माध्यन्दिन)", iast: "Mādhyandina" },
    ],
    maxDivisions: 7,
    maxSubdivisions: 8,
  },
  samaveda: {
    id: "samaveda",
    name: "Samaveda",
    sanskritName: "सामवेद",
    divisionLabel: "Prapāṭhaka",
    subdivisionLabel: "Section / Hymn",
    shakhas: [
      { id: "kauthuma", name: "Kauthuma (कौथुम)", iast: "Kauthuma" },
      { id: "jaiminiya", name: "Jaiminīya (जैमिनीय)", iast: "Jaiminīya" },
    ],
    maxDivisions: 6,
    maxSubdivisions: 10,
  },
  atharvaveda: {
    id: "atharvaveda",
    name: "Atharvaveda",
    sanskritName: "अथर्ववेद",
    divisionLabel: "Kāṇḍa",
    subdivisionLabel: "Anuvāka / Sūkta",
    shakhas: [
      { id: "saunaka", name: "Śaunaka (शौनक)", iast: "Śaunaka" },
      { id: "paippalada", name: "Paippalāda (पैप्पलाद)", iast: "Paippalāda" },
    ],
    maxDivisions: 20,
    maxSubdivisions: 10,
  },
};

// ── Active Dataset Window ─────────────────────────────────────────────────────

/**
 * The slice of the corpus that has live data in the current release.
 * As data is added, expand these ranges — the API and UI will update automatically.
 */
export const ACTIVE_DATASET: Record<
  string,
  Record<string, Record<number, { minSukta: number; maxSukta: number }>>
> = {
  rigveda: {
    sakala: {
      1: { minSukta: 1, maxSukta: 191 },
    },
  },
};

// ── Helper Utilities ──────────────────────────────────────────────────────────

/**
 * Returns the maximum number of subdivisions (suktas/anuvākas) for a given
 * veda + division number, handling both flat-number and map schemas.
 */
export function getMaxSubdivisions(vedaId: string, divisionNum: number): number {
  const veda = VEDIC_CORPUS[vedaId];
  if (!veda) return 0;
  if (typeof veda.maxSubdivisions === "number") return veda.maxSubdivisions;
  return veda.maxSubdivisions[divisionNum] ?? 0;
}

/**
 * Validates Next.js route params against Vedic corpus boundaries.
 *
 * Returns:
 *  - `{ valid: false, reason }` if params are structurally invalid or out of
 *    corpus range (triggers `notFound()` at call site)
 *  - `{ valid: true, state: "active" }` if params have live data
 *  - `{ valid: true, state: "roadmap" }` if params are within corpus but not
 *    yet digitised (shows roadmap placeholder)
 */
export function validateVedicParams(params: RouteParams): BoundaryCheckResult {
  const { veda, shakha } = params;

  // Parse integers — reject NaN immediately
  const mandala = parseInt(params.mandala, 10);
  const sukta = parseInt(params.sukta, 10);
  if (isNaN(mandala) || isNaN(sukta) || mandala < 1 || sukta < 1) {
    return { valid: false, reason: "non_integer" };
  }

  // Validate veda exists
  const vedaBoundary = VEDIC_CORPUS[veda];
  if (!vedaBoundary) {
    return { valid: false, reason: "invalid_veda" };
  }

  // Validate shakha belongs to this veda
  const validShakha = vedaBoundary.shakhas.some((s) => s.id === shakha);
  if (!validShakha) {
    return { valid: false, reason: "invalid_shakha" };
  }

  // Validate division range
  if (mandala > vedaBoundary.maxDivisions) {
    return { valid: false, reason: "out_of_range" };
  }

  // Validate subdivision range
  const maxSukta = getMaxSubdivisions(veda, mandala);
  if (sukta > maxSukta) {
    return { valid: false, reason: "out_of_range" };
  }

  // Check active dataset window
  const activeWindow = ACTIVE_DATASET[veda]?.[shakha]?.[mandala];
  if (
    activeWindow &&
    sukta >= activeWindow.minSukta &&
    sukta <= activeWindow.maxSukta
  ) {
    return {
      valid: true,
      state: { type: "active", veda, shakha, mandala, sukta },
    };
  }

  // Within corpus boundaries but not yet in active dataset → roadmap
  return {
    valid: true,
    state: { type: "roadmap", veda, shakha, mandala, sukta },
  };
}
