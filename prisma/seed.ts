/**
 * prisma/seed.ts
 *
 * DLIIH Database Seeder — Phase 1
 *
 * Reads `data/rv_1_1.json` (the validated flat-file payload) and populates
 * the relational schema:  texts → suktas → mantras → mantra_layers + pada_tokens
 *
 * Run via:  npx tsx prisma/seed.ts
 * Or:       npm run prisma:seed
 *
 * Safe to run repeatedly — uses upsert on all stable identifiers.
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// String constants matching Prisma enum values
// These match schema.prisma exactly; update if enums are renamed
const LayerType = {
  SAMHITAPATHA: "SAMHITAPATHA",
  PADAPATHA: "PADAPATHA",
  IAST: "IAST",
  TRANSLATION: "TRANSLATION",
  COMMENTARY: "COMMENTARY",
} as const;

const ScriptType = {
  DEVANAGARI: "DEVANAGARI",
  IAST: "IAST",
  LATIN: "LATIN",
} as const;

const ShakhaId = {
  SAKALA: "SAKALA",
} as const;


const prisma = new PrismaClient({ log: ["warn", "error"] });

// ── Types (mirror of MantraData from lib/mantra-loader.ts) ──────────────────

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

// ── Accent Validator ─────────────────────────────────────────────────────────

/**
 * Validates that a Devanāgarī string retains its Vedic pitch accent marks.
 * U+0951 = udātta ॑ | U+0952 = anudātta ॒ | U+1CD0–U+1CFF = Vedic Extensions
 *
 * Returns true if accents are present OR if the string is very short (< 5 chars)
 * which may legitimately lack accents (e.g. single-word lemmas).
 */
function hasVedicAccents(text: string): boolean {
  if (text.length < 5) return true; // short strings may legitimately lack accents
  // Check for udātta, anudātta, or any Vedic Extension codepoint
  return /[\u0951\u0952\u1CD0-\u1CFF]/.test(text);
}

// ── Group mantras by sukta ───────────────────────────────────────────────────

function groupBySukta(mantras: RawMantra[]): Map<number, RawMantra[]> {
  const map = new Map<number, RawMantra[]>();
  for (const m of mantras) {
    const arr = map.get(m.sukta) ?? [];
    arr.push(m);
    map.set(m.sukta, arr);
  }
  return map;
}

// ── Main Seed Logic ──────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════");
  console.log(" DLIIH Prisma Seed — Phase 1");
  console.log("═══════════════════════════════════════\n");

  // 1. Load source JSON
  const jsonPath = path.join(process.cwd(), "data", "rv_1_1.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Source JSON not found: ${jsonPath}`);
  }
  const rawMantras: RawMantra[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`✓ Loaded ${rawMantras.length} mantras from rv_1_1.json`);

  // 2. Validate accent retention across all samhitapatha strings
  let accentWarnings = 0;
  for (const m of rawMantras) {
    if (!hasVedicAccents(m.samhitapatha)) {
      console.warn(`  ⚠ ACCENT WARNING: ${m.id} samhitapatha appears to lack pitch accents`);
      accentWarnings++;
    }
  }
  if (accentWarnings === 0) {
    console.log("✓ Accent validation passed — all samhitapatha strings retain pitch marks");
  } else {
    console.warn(`  ${accentWarnings} mantra(s) may have stripped accent marks`);
  }

  // 3. Group by sukta
  const bySukta = groupBySukta(rawMantras);
  const suktaNums = [...bySukta.keys()].sort((a, b) => a - b);
  console.log(`\n✓ Found ${suktaNums.length} suktas to seed (Mandala 1, Suktas ${suktaNums[0]}–${suktaNums[suktaNums.length - 1]})\n`);

  // 4. Upsert Text record (Rigveda · Śākala · Mandala 1)
  const text = await prisma.text.upsert({
    where: { veda_shakha_division: { veda: "rigveda", shakha: ShakhaId.SAKALA, division: 1 } },
    create: {
      veda: "rigveda",
      shakha: ShakhaId.SAKALA,
      division: 1,
      numSuktas: suktaNums.length,
    },
    update: { numSuktas: suktaNums.length },
  });
  console.log(`✓ Upserted Text record: id=${text.id} (rigveda · SAKALA · Mandala 1)`);

  // 5. Seed each Sukta
  let totalMantras = 0;
  let totalLayers = 0;
  let totalTokens = 0;

  for (const suktaNum of suktaNums) {
    const suktaMantras = bySukta.get(suktaNum)!;

    // Derive sukta-level metadata from first mantra (primary values)
    const firstMantra = suktaMantras[0];

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

    // Seed mantras within this sukta
    for (const m of suktaMantras) {
      const mantra = await prisma.mantra.upsert({
        where: { stableId: m.id },
        create: {
          suktaId: sukta.id,
          stableId: m.id,
          mantraNum: m.mantra,
          deity: m.deity,
          rishi: m.rishi,
          meter: m.meter,
        },
        update: {
          deity: m.deity,
          rishi: m.rishi,
          meter: m.meter,
        },
      });
      totalMantras++;

      // Delete existing layers + tokens before re-creating (idempotent upsert for arrays)
      await prisma.mantraLayer.deleteMany({ where: { mantraId: mantra.id } });
      await prisma.padaToken.deleteMany({ where: { mantraId: mantra.id } });

      // ── Layer: SAMHITAPATHA ────────────────────────────────────────────────
      await prisma.mantraLayer.create({
        data: {
          mantraId: mantra.id,
          layerType: LayerType.SAMHITAPATHA,
          language: "sa",
          script: ScriptType.DEVANAGARI,
          content: m.samhitapatha,
          author: "Traditional (Śākala Recension)",
          license: "Public Domain",
          sourceRef: "GRETIL Digital Rigveda",
        },
      });
      totalLayers++;

      // ── Layer: TRANSLATION (English) ──────────────────────────────────────
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

      // ── Layer: COMMENTARY (Sāyaṇa Sanskrit) ───────────────────────────────
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
      for (const pada of m.padapatha) {
        // Build token_mapping for this individual word from the parent's token_mapping
        // (The parent token_mapping maps tokenIdx → [word_index, ...])
        // For storage we store the full map on the first token only to avoid repetition,
        // as it is mantra-level metadata. Alternatively, store null for non-primary tokens.
        const tokenMapping =
          pada.word_index === 1 && m.token_mapping ? m.token_mapping : undefined;

        await prisma.padaToken.create({
          data: {
            mantraId: mantra.id,
            wordIndex: pada.word_index,
            pada: pada.pada,
            lemma: pada.lemma,
            grammar: pada.grammar,
            literalMeaning: pada.literal_meaning,
            tokenMapping: tokenMapping ?? undefined,
          },
        });
        totalTokens++;
      }
    }

    process.stdout.write(`  ✓ Sukta ${suktaNum}: ${suktaMantras.length} mantras seeded\n`);
  }

  console.log(`\n${"═".repeat(45)}`);
  console.log(` Seed Complete`);
  console.log(`${"═".repeat(45)}`);
  console.log(` Texts:       1`);
  console.log(` Suktas:      ${suktaNums.length}`);
  console.log(` Mantras:     ${totalMantras}`);
  console.log(` Layers:      ${totalLayers}`);
  console.log(` Pada Tokens: ${totalTokens}`);
  console.log(`${"═".repeat(45)}\n`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
