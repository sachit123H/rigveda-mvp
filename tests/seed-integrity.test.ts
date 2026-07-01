/**
 * tests/seed-integrity.test.ts
 *
 * Data integrity tests for `data/rv_1_1.json`
 *
 * These tests run the same validation logic as `scripts/validate_seed.ts`
 * but are integrated into the Vitest test suite so they run in CI alongside
 * the unit and integration tests.
 *
 * Covers:
 *  - Root is a non-empty array
 *  - All mantras have required typed fields
 *  - Stable ID format: RV_{mandala}.{sukta}.{mantra}
 *  - Mantra numbers are sequential within each sukta (no gaps)
 *  - Samhitapātha strings carry pitch accent marks (U+0951/U+0952)
 *  - Padapātha arrays are non-empty with 1-based sequential word_index values
 *  - Token mapping (if present) maps string keys to number[]
 *  - Translation objects are complete
 *  - No duplicate stable IDs across the dataset
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// ── Setup ─────────────────────────────────────────────────────────────────────

const DATA_PATH = path.join(process.cwd(), "data", "rv_1_1.json");
const DATA_EXISTS = fs.existsSync(DATA_PATH);

const ACCENT_REGEX = /[\u0951\u0952\u1CD0-\u1CFF]/;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let rawData: any[] = [];

if (DATA_EXISTS) {
  try {
    rawData = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    // file parse failure handled by the test below
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe.skipIf(!DATA_EXISTS)("rv_1_1.json — structural integrity", () => {
  it("root element is a non-empty array", () => {
    expect(Array.isArray(rawData)).toBe(true);
    expect(rawData.length).toBeGreaterThan(0);
  });

  it("all entries have a non-empty string id", () => {
    for (const m of rawData) {
      expect(typeof m.id, `id missing on entry with mantra=${m.mantra}`).toBe("string");
      expect(m.id.length).toBeGreaterThan(0);
    }
  });

  it("no duplicate stable IDs", () => {
    const ids = rawData.map((m) => m.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all IDs match RV_{mandala}.{sukta}.{mantra} format", () => {
    for (const m of rawData) {
      const expected = `RV_${m.mandala}.${m.sukta}.${m.mantra}`;
      expect(m.id, `ID mismatch: got "${m.id}", expected "${expected}"`).toBe(expected);
    }
  });

  it("mandala, sukta, mantra are positive integers", () => {
    for (const m of rawData) {
      expect(Number.isInteger(m.mandala) && m.mandala > 0, `${m.id} bad mandala`).toBe(true);
      expect(Number.isInteger(m.sukta) && m.sukta > 0, `${m.id} bad sukta`).toBe(true);
      expect(Number.isInteger(m.mantra) && m.mantra > 0, `${m.id} bad mantra`).toBe(true);
    }
  });

  it("meter, deity, rishi are non-empty strings", () => {
    for (const m of rawData) {
      expect(typeof m.meter === "string" && m.meter.length > 0, `${m.id} bad meter`).toBe(true);
      expect(typeof m.deity === "string" && m.deity.length > 0, `${m.id} bad deity`).toBe(true);
      expect(typeof m.rishi === "string" && m.rishi.length > 0, `${m.id} bad rishi`).toBe(true);
    }
  });
});

describe.skipIf(!DATA_EXISTS)("rv_1_1.json — Vedic accent preservation (CRITICAL)", () => {
  it("every samhitapatha string (>= 8 chars) carries pitch accent marks", () => {
    const longStrings = rawData.filter((m) => typeof m.samhitapatha === "string" && m.samhitapatha.length >= 8);
    expect(longStrings.length).toBeGreaterThan(0);

    const failures: string[] = [];
    for (const m of longStrings) {
      if (!ACCENT_REGEX.test(m.samhitapatha)) {
        failures.push(`${m.id}: "${m.samhitapatha.slice(0, 40)}..."`);
      }
    }

    expect(
      failures,
      `${failures.length} mantra(s) have stripped pitch accents:\n${failures.join("\n")}`
    ).toHaveLength(0);
  });

  it("overall accent coverage is >= 80%", () => {
    const total = rawData.filter((m) => typeof m.samhitapatha === "string" && m.samhitapatha.length >= 8).length;
    const accented = rawData.filter(
      (m) => typeof m.samhitapatha === "string" && m.samhitapatha.length >= 8 && ACCENT_REGEX.test(m.samhitapatha)
    ).length;
    const pct = total > 0 ? (accented / total) * 100 : 0;
    expect(pct, `Accent coverage ${pct.toFixed(1)}% is below 80% threshold`).toBeGreaterThanOrEqual(80);
  });
});

describe.skipIf(!DATA_EXISTS)("rv_1_1.json — padapatha integrity", () => {
  it("every mantra has a non-empty padapatha array", () => {
    for (const m of rawData) {
      expect(Array.isArray(m.padapatha) && m.padapatha.length > 0, `${m.id} has empty/missing padapatha`).toBe(true);
    }
  });

  it("word_index values are 1-based sequential within each mantra", () => {
    const failures: string[] = [];
    for (const m of rawData) {
      if (!Array.isArray(m.padapatha)) continue;
      const sorted = [...m.padapatha].sort((a, b) => a.word_index - b.word_index);
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].word_index !== i + 1) {
          failures.push(`${m.id}: word_index ${sorted[i].word_index} at position ${i + 1}`);
          break;
        }
      }
    }
    expect(failures, `word_index discontinuities:\n${failures.join("\n")}`).toHaveLength(0);
  });

  it("every pada word has non-empty pada, lemma, grammar, literal_meaning", () => {
    const failures: string[] = [];
    for (const m of rawData) {
      if (!Array.isArray(m.padapatha)) continue;
      for (const w of m.padapatha) {
        for (const field of ["pada", "lemma", "grammar", "literal_meaning"] as const) {
          if (typeof w[field] !== "string" || w[field].trim() === "") {
            failures.push(`${m.id} word #${w.word_index}: missing "${field}"`);
          }
        }
      }
    }
    expect(failures, `${failures.length} missing word field(s):\n${failures.slice(0, 10).join("\n")}`).toHaveLength(0);
  });
});

describe.skipIf(!DATA_EXISTS)("rv_1_1.json — translation completeness", () => {
  it("every mantra has a translation object with fluid_text", () => {
    const failures: string[] = [];
    for (const m of rawData) {
      if (
        !m.translation ||
        typeof m.translation.fluid_text !== "string" ||
        m.translation.fluid_text.trim() === ""
      ) {
        failures.push(m.id);
      }
    }
    expect(
      failures,
      `${failures.length} mantra(s) have empty translation:\n${failures.slice(0, 10).join(", ")}`
    ).toHaveLength(0);
  });

  it("translation objects have author and license fields", () => {
    for (const m of rawData) {
      if (!m.translation) continue;
      expect(typeof m.translation.author, `${m.id} missing translation.author`).toBe("string");
      expect(typeof m.translation.license, `${m.id} missing translation.license`).toBe("string");
    }
  });
});

describe.skipIf(!DATA_EXISTS)("rv_1_1.json — token_mapping shape", () => {
  it("token_mapping (when present) is a Record<string, number[]>", () => {
    const failures: string[] = [];
    for (const m of rawData) {
      if (m.token_mapping === undefined || m.token_mapping === null) continue;
      if (typeof m.token_mapping !== "object" || Array.isArray(m.token_mapping)) {
        failures.push(`${m.id}: token_mapping is not an object`);
        continue;
      }
      for (const [key, val] of Object.entries(m.token_mapping)) {
        if (typeof key !== "string") {
          failures.push(`${m.id}: token_mapping key "${key}" is not a string`);
        }
        if (!Array.isArray(val) || !(val as unknown[]).every((n) => typeof n === "number")) {
          failures.push(`${m.id}: token_mapping["${key}"] is not number[]`);
        }
      }
    }
    expect(failures, failures.join("\n")).toHaveLength(0);
  });

  it("mantras with token_mapping have consistent word_index references", () => {
    const failures: string[] = [];
    for (const m of rawData) {
      if (!m.token_mapping || !Array.isArray(m.padapatha)) continue;
      const validIndices = new Set(m.padapatha.map((w: { word_index: number }) => w.word_index));
      for (const [tokenKey, wordIndices] of Object.entries(m.token_mapping)) {
        for (const idx of wordIndices as number[]) {
          if (!validIndices.has(idx)) {
            failures.push(`${m.id}: token_mapping["${tokenKey}"] references non-existent word_index ${idx}`);
          }
        }
      }
    }
    expect(failures, failures.join("\n")).toHaveLength(0);
  });
});

describe.skipIf(!DATA_EXISTS)("rv_1_1.json — mantra sequence per sukta", () => {
  it("mantra numbers start at 1 and are sequential within each sukta", () => {
    // Group by sukta
    const bySukta = new Map<string, number[]>();
    for (const m of rawData) {
      const key = `${m.mandala}.${m.sukta}`;
      const arr = bySukta.get(key) ?? [];
      arr.push(m.mantra);
      bySukta.set(key, arr);
    }

    const failures: string[] = [];
    for (const [suktaKey, mantras] of bySukta) {
      const sorted = [...mantras].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] !== i + 1) {
          failures.push(`RV ${suktaKey}: mantra ${sorted[i]} at position ${i + 1} (expected ${i + 1})`);
          break;
        }
      }
    }
    expect(failures, `Mantra sequence gaps:\n${failures.join("\n")}`).toHaveLength(0);
  });
});
