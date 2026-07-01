/**
 * tests/json-loader.test.ts
 *
 * Unit tests for the JSON fallback path in `lib/mantra-loader.ts`
 *
 * Covers:
 *  - `loadMantrasSync` returns mantras for an existing sukta
 *  - Correct filtering by sukta number
 *  - Returned MantraData shape matches interface
 *  - Vedic pitch accent marks preserved in samhitapatha field
 *  - In-process cache: second call does not re-read from disk
 *  - Returns [] for an unknown sukta number
 *  - Returns [] for an unknown veda
 */

import { describe, it, expect, beforeEach } from "vitest";
import path from "path";
import fs from "fs";
import { loadMantrasSync, _clearCache, _getCacheSize } from "@/lib/mantra-loader";

// Accent regex — validates U+0951 (udātta) or U+0952 (anudātta) or Vedic Extensions
const ACCENT_REGEX = /[\u0951\u0952\u1CD0-\u1CFF]/;

// Skip tests if the data file is not present (CI without data assets)
const DATA_PATH = path.join(process.cwd(), "data", "rv_1_1.json");
const DATA_EXISTS = fs.existsSync(DATA_PATH);

describe.skipIf(!DATA_EXISTS)("loadMantrasSync — JSON fallback loader", () => {
  beforeEach(() => {
    // Clear the in-process cache so each test group starts fresh
    _clearCache();
  });

  it("returns a non-empty array for rigveda/sakala/1/1", () => {
    const mantras = loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 1 });
    expect(mantras.length).toBeGreaterThan(0);
  });

  it("returns only mantras belonging to the requested sukta", () => {
    const mantras = loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 1 });
    for (const m of mantras) {
      expect(m.sukta).toBe(1);
      expect(m.mandala).toBe(1);
    }
  });

  it("returns [] for a sukta number that does not exist in the file", () => {
    const mantras = loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 999 });
    expect(mantras).toHaveLength(0);
  });

  it("returns [] for an unknown veda", () => {
    const mantras = loadMantrasSync({ veda: "samaveda", shakha: "kauthuma", mandala: 1, sukta: 1 });
    expect(mantras).toHaveLength(0);
  });

  it("each mantra has required string fields", () => {
    const mantras = loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 1 });
    for (const m of mantras) {
      expect(typeof m.id).toBe("string");
      expect(m.id.length).toBeGreaterThan(0);
      expect(typeof m.samhitapatha).toBe("string");
      expect(m.samhitapatha.length).toBeGreaterThan(0);
      expect(typeof m.meter).toBe("string");
      expect(typeof m.deity).toBe("string");
      expect(typeof m.rishi).toBe("string");
    }
  });

  it("each mantra has correct numeric fields", () => {
    const mantras = loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 1 });
    for (const m of mantras) {
      expect(Number.isInteger(m.mandala)).toBe(true);
      expect(Number.isInteger(m.sukta)).toBe(true);
      expect(Number.isInteger(m.mantra)).toBe(true);
      expect(m.mantra).toBeGreaterThan(0);
    }
  });

  it("mantras are sorted by mantra number ascending", () => {
    const mantras = loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 1 });
    for (let i = 1; i < mantras.length; i++) {
      expect(mantras[i].mantra).toBeGreaterThan(mantras[i - 1].mantra);
    }
  });

  it("CRITICAL: samhitapatha fields retain Vedic pitch accent marks", () => {
    const mantras = loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 1 });
    const longEnough = mantras.filter((m) => m.samhitapatha.length >= 8);
    expect(longEnough.length).toBeGreaterThan(0);

    for (const m of longEnough) {
      const hasAccent = ACCENT_REGEX.test(m.samhitapatha);
      expect(
        hasAccent,
        `Mantra ${m.id} samhitapatha missing pitch accents: "${m.samhitapatha.slice(0, 40)}"`
      ).toBe(true);
    }
  });

  it("each mantra has a padapatha array with at least one word", () => {
    const mantras = loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 1 });
    for (const m of mantras) {
      expect(Array.isArray(m.padapatha)).toBe(true);
      expect(m.padapatha.length).toBeGreaterThan(0);
    }
  });

  it("padapatha word_index values are 1-based sequential integers", () => {
    const mantras = loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 1 });
    for (const m of mantras) {
      const sorted = [...m.padapatha].sort((a, b) => a.word_index - b.word_index);
      for (let i = 0; i < sorted.length; i++) {
        expect(sorted[i].word_index).toBe(i + 1);
      }
    }
  });

  it("each padapatha word has required string fields", () => {
    const mantras = loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 1 });
    for (const m of mantras) {
      for (const word of m.padapatha) {
        expect(typeof word.pada).toBe("string");
        expect(typeof word.lemma).toBe("string");
        expect(typeof word.grammar).toBe("string");
        expect(typeof word.literal_meaning).toBe("string");
      }
    }
  });

  it("translation object has author, license, and fluid_text", () => {
    const mantras = loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 1 });
    for (const m of mantras) {
      expect(typeof m.translation.author).toBe("string");
      expect(typeof m.translation.license).toBe("string");
      expect(typeof m.translation.fluid_text).toBe("string");
      expect(m.translation.fluid_text.length).toBeGreaterThan(0);
    }
  });

  it("in-process cache: second call does not increase cache miss count", () => {
    expect(_getCacheSize()).toBe(0); // cleared in beforeEach

    loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 1 });
    expect(_getCacheSize()).toBe(1); // one file path cached

    // Second call — cache should still be size 1, not re-read the file
    loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 1 });
    expect(_getCacheSize()).toBe(1);
  });

  it("stable ID format matches RV_{mandala}.{sukta}.{mantra}", () => {
    const mantras = loadMantrasSync({ veda: "rigveda", shakha: "sakala", mandala: 1, sukta: 1 });
    for (const m of mantras) {
      const expected = `RV_${m.mandala}.${m.sukta}.${m.mantra}`;
      expect(m.id).toBe(expected);
    }
  });
});
