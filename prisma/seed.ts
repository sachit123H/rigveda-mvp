/**
 * prisma/seed.ts
 *
 * DLIIH Database Seeder — Phase 1
 *
 * Reads `data/rv_1_1.json` and populates the relational schema:
 *   texts → suktas → mantras → mantra_layers + pada_tokens
 *
 * Run via:  npm run prisma:seed
 * Or:       npx tsx prisma/seed.ts [--strict]
 *
 * Flags:
 *   --strict   Abort with exit code 1 if ANY samhitapātha or padapātha string
 *              fails the Vedic accent validation check. Use in CI to enforce the
 *              "no accent stripping" data-integrity policy before every push.
 *              Without this flag, warnings are emitted but the seed continues.
 *
 * Safe to run repeatedly — uses upsert on all stable identifiers.
 *
 * ── token_mapping storage convention ────────────────────────────────────────
 *   The full mantra-level token→word-index mapping (a JSONB object) is stored
 *   exclusively on the PadaToken row where wordIndex === 1 to avoid redundant
 *   storage across every word row. The `mantra-loader` loader reconstructs it
 *   by reading the first token's `tokenMapping` field. All other rows store null.
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// ── String constants mirroring Prisma enum values ────────────────────────────
// (Imported as string literals because prisma generate hasn't run yet in CI)

const LayerType = {
  SAMHITAPATHA: "SAMHITAPATHA",
  PADAPATHA:    "PADAPATHA",
  IAST:         "IAST",
  TRANSLATION:  "TRANSLATION",
  COMMENTARY:   "COMMENTARY",
} as const;

const ScriptType = {
  DEVANAGARI: "DEVANAGARI",
  IAST:       "IAST",
  LATIN:      "LATIN",
} as const;

const ShakhaId = {
  SAKALA: "SAKALA",
} as const;

const prisma = new PrismaClient({ log: ["warn", "error"] });

// ── Types ────────────────────────────────────────────────────────────────────

interface PadaWord {
  word_index: number;
  pada: string;
  lemma: string;
  grammar: string;
  literal_meaning: string;
}

interface RawMantra {
  id: string;
  mandala: number;
  sukta: number;
  mantra: number;
  meter: string;
  deity: string;
  rishi: string;
  samhitapatha: string;
  padapatha: PadaWord[];
  translation: { author: string; license: string; fluid_text: string };
  commentary: { author: string; language: string; text: string };
  token_mapping?: Record<string, number[]>;
}

// ── Accent Validation ─────────────────────────────────────────────────────────

/**
 * Vedic pitch accent codepoints:
 *   U+0951  ॑  DEVANAGARI STRESS SIGN UDATTA   (udātta, raised tone)
 *   U+0952  ॒  DEVANAGARI STRESS SIGN ANUDATTA  (anudātta, lowered tone)
 *   U+1CD0–U+1CFF  Vedic Extensions block (svarita and other variants)
 */
const ACCENT_REGEX = /[\u0951\u0952\u1CD0-\u1CFF]/;

interface AccentReport {
  /** Total strings checked */
  total: number;
  /** Strings that passed (accents present OR string too short to need them) */
  passed: number;
  /** IDs of mantras that triggered a warning */
  warnings: Array<{ id: string; field: "samhitapatha" | "pada"; value: string }>;
}

/**
 * Validates accent coverage for a single string.
 * Short strings (< 8 chars) are exempt — single-word lemmas and metadata
 * fields may legitimately contain no accent marks.
 */
function hasAccents(text: string): boolean {
  if (text.trim().length < 8) return true;
  return ACCENT_REGEX.test(text);
}

/**
 * Validates accent retention across all mantras in the dataset.
 *
 * Checks:
 *  1. samhitapatha — must carry pitch accent marks (udātta/anudātta)
 *  2. Each pada entry — each Padapātha word should ideally carry its accent;
 *     a warning is emitted if fewer than 50% of words in a mantra are accented
 *     (threshold chosen to tolerate common verb forms that lack marks in prakrit).
 */
function validateAllAccents(mantras: RawMantra[]): AccentReport {
  const report: AccentReport = { total: 0, passed: 0, warnings: [] };

  for (const m of mantras) {
    // Check samhitapatha
    report.total++;
    if (hasAccents(m.samhitapatha)) {
      report.passed++;
    } else {
      report.warnings.push({
        id: m.id,
        field: "samhitapatha",
        value: m.samhitapatha.slice(0, 60),
      });
    }

    // Check padapatha words (warn if < 50% carry accent marks)
    const padaWords = m.padapatha;
    if (padaWords.length > 0) {
      const accentedCount = padaWords.filter((w) => hasAccents(w.pada)).length;
      const ratio = accentedCount / padaWords.length;
      if (ratio < 0.5) {
        report.warnings.push({
          id: m.id,
          field: "pada",
          value: `${accentedCount}/${padaWords.length} words accented (${Math.round(ratio * 100)}%)`,
        });
      }
    }
  }

  // passed = total - warnings-count (approximate; pada warnings don't add to total)
  report.passed = report.total - report.warnings.filter(w => w.field === "samhitapatha").length;

  return report;
}

// ── Group mantras by sukta ────────────────────────────────────────────────────

function groupBySukta(mantras: RawMantra[]): Map<number, RawMantra[]> {
  const map = new Map<number, RawMantra[]>();
  for (const m of mantras) {
    const arr = map.get(m.sukta) ?? [];
    arr.push(m);
    map.set(m.sukta, arr);
  }
  return map;
}

// ── CLI Flags ─────────────────────────────────────────────────────────────────

const STRICT = process.argv.includes("--strict");

// ── Main Seed Logic ───────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════");
  console.log(" DLIIH Prisma Seed — Phase 1");
  if (STRICT) console.log(" Mode: --strict (accent failures abort seed)");
  console.log("═══════════════════════════════════════\n");

  // 1. Load source JSON
  const jsonPath = path.join(process.cwd(), "data", "rv_1_1.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Source JSON not found: ${jsonPath}`);
  }
  const rawMantras: RawMantra[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`✓ Loaded ${rawMantras.length} mantras from rv_1_1.json`);

  // 2. Accent validation — comprehensive report across samhitapatha + padapatha
  console.log("\n── Accent Validation Report ──────────────────────────────────");
  const accentReport = validateAllAccents(rawMantras);

  if (accentReport.warnings.length === 0) {
    console.log(`✓ All ${accentReport.total} samhitapātha strings carry pitch accent marks`);
    console.log("✓ All padapātha sets meet the 50% accent coverage threshold");
  } else {
    for (const w of accentReport.warnings) {
      if (w.field === "samhitapatha") {
        console.warn(`  ⚠ SAMHITA ACCENT [${w.id}]: "${w.value}..."`);
      } else {
        console.warn(`  ⚠ PADA ACCENT    [${w.id}]: ${w.value}`);
      }
    }
    console.warn(`\n  Summary: ${accentReport.warnings.length} accent warning(s) across ${rawMantras.length} mantras`);
    console.warn(`  Samhita strings clean: ${accentReport.passed}/${accentReport.total}`);

    if (STRICT) {
      console.error("\n✗ --strict mode: accent validation failures found. Aborting seed.");
      console.error("  Fix the source JSON (rv_1_1.json) before seeding the database.");
      process.exit(1);
    } else {
      console.warn("  ⚠ Continuing in non-strict mode. Run with --strict to enforce policy.\n");
    }
  }

  // 3. Group by sukta
  const bySukta = groupBySukta(rawMantras);
  const suktaNums = [...bySukta.keys()].sort((a, b) => a - b);
  console.log(`\n✓ Found ${suktaNums.length} suktas (Mandala 1, Suktas ${suktaNums[0]}–${suktaNums[suktaNums.length - 1]})\n`);

  // 4. Upsert Text record (Rigveda · Śākala · Mandala 1)
  const text = await prisma.text.upsert({
    where: { veda_shakha_division: { veda: "rigveda", shakha: ShakhaId.SAKALA, division: 1 } },
    create: { veda: "rigveda", shakha: ShakhaId.SAKALA, division: 1, numSuktas: suktaNums.length },
    update: { numSuktas: suktaNums.length },
  });
  console.log(`✓ Upserted Text record: id=${text.id} (rigveda · SAKALA · Mandala 1)`);

  // 5. Seed each sukta
  let totalMantras = 0;
  let totalLayers = 0;
  let totalTokens = 0;

  for (const suktaNum of suktaNums) {
    const suktaMantras = bySukta.get(suktaNum)!;
    const firstMantra = suktaMantras[0];

    // Per-sukta accent summary
    const suktaAccentedCount = suktaMantras.filter((m) => hasAccents(m.samhitapatha)).length;
    const suktaAccentPct = Math.round((suktaAccentedCount / suktaMantras.length) * 100);

    const sukta = await prisma.sukta.upsert({
      where: { textId_suktaNum: { textId: text.id, suktaNum } },
      create: {
        textId: text.id,
        suktaNum,
        rishi: firstMantra.rishi,
        deityPrimary: firstMantra.deity,
        meterPrimary: firstMantra.meter,
        numMantras: suktaMantras.length,
      },
      update: {
        rishi: firstMantra.rishi,
        deityPrimary: firstMantra.deity,
        meterPrimary: firstMantra.meter,
        numMantras: suktaMantras.length,
      },
    });

    for (const m of suktaMantras) {
      const mantra = await prisma.mantra.upsert({
        where: { stableId: m.id },
        create: { suktaId: sukta.id, stableId: m.id, mantraNum: m.mantra, deity: m.deity, rishi: m.rishi, meter: m.meter },
        update: { deity: m.deity, rishi: m.rishi, meter: m.meter },
      });
      totalMantras++;

      // Delete existing layers + tokens before re-creating (idempotent)
      await prisma.mantraLayer.deleteMany({ where: { mantraId: mantra.id } });
      await prisma.padaToken.deleteMany({ where: { mantraId: mantra.id } });

      // ── SAMHITAPATHA layer ────────────────────────────────────────────────
      await prisma.mantraLayer.create({
        data: {
          mantraId: mantra.id,
          layerType: LayerType.SAMHITAPATHA,
          language: "sa",
          script: ScriptType.DEVANAGARI,
          content: m.samhitapatha,          // pitch accents preserved verbatim
          author: "Traditional (Śākala Recension)",
          license: "Public Domain",
          sourceRef: "GRETIL Digital Rigveda",
        },
      });
      totalLayers++;

      // ── TRANSLATION layer (English) ───────────────────────────────────────
      if (m.translation.fluid_text) {
        await prisma.mantraLayer.create({
          data: {
            mantraId: mantra.id,
            layerType: LayerType.TRANSLATION,
            language: "en",
            script: ScriptType.LATIN,
            content: m.translation.fluid_text,
            author: m.translation.author,
            license: m.translation.license,
          },
        });
        totalLayers++;
      }

      // ── COMMENTARY layer (Sāyaṇa Sanskrit) ───────────────────────────────
      if (m.commentary.text) {
        await prisma.mantraLayer.create({
          data: {
            mantraId: mantra.id,
            layerType: LayerType.COMMENTARY,
            language: m.commentary.language ?? "sa",
            script: ScriptType.DEVANAGARI,
            content: m.commentary.text,
            author: m.commentary.author,
            sourceRef: "Sāyaṇabhāṣya — Traditional Sanskrit commentary, 14th c.",
          },
        });
        totalLayers++;
      }

      // ── Pada Tokens ───────────────────────────────────────────────────────
      // token_mapping convention: the full mantra-level JSON blob is stored ONLY
      // on the row with wordIndex === 1. All other rows store null/undefined.
      // The loader reads it back via the first token row.
      for (const pada of m.padapatha) {
        const isFirstWord = pada.word_index === 1;
        await prisma.padaToken.create({
          data: {
            mantraId: mantra.id,
            wordIndex: pada.word_index,
            pada: pada.pada,             // accent-bearing padapatha form
            lemma: pada.lemma,
            grammar: pada.grammar,
            literalMeaning: pada.literal_meaning,
            // Store token_mapping only on word_index === 1 (see convention above)
            tokenMapping: isFirstWord && m.token_mapping ? m.token_mapping : undefined,
          },
        });
        totalTokens++;
      }
    }

    process.stdout.write(
      `  ✓ Sukta ${String(suktaNum).padEnd(3)} : ${suktaMantras.length} mantras — accent: ${suktaAccentedCount}/${suktaMantras.length} (${suktaAccentPct}%)\n`
    );
  }

  console.log(`\n${"═".repeat(48)}`);
  console.log(` Seed Complete`);
  console.log(`${"═".repeat(48)}`);
  console.log(` Texts:       1`);
  console.log(` Suktas:      ${suktaNums.length}`);
  console.log(` Mantras:     ${totalMantras}`);
  console.log(` Layers:      ${totalLayers}`);
  console.log(` Pada Tokens: ${totalTokens}`);
  console.log(`${"═".repeat(48)}\n`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
