#!/usr/bin/env tsx
/**
 * scripts/validate_seed.ts
 *
 * DLIIH — Standalone Data Integrity Gate (Phase 1)
 *
 * Cross-checks `data/rv_1_1.json` against the MantraData interface shape
 * and the Vedic accent preservation policy. Produces a structured console
 * report and exits with code 1 if critical issues are found.
 *
 * Usage:
 *   npx tsx scripts/validate_seed.ts [--strict] [--json]
 *
 * Flags:
 *   --strict   Exit 1 on any warning (not just errors). Use in pre-commit hooks.
 *   --json     Emit structured JSON report to stdout instead of human-readable output.
 *
 * Run this BEFORE `npm run prisma:seed` to validate your JSON source data.
 * Also useful in CI to assert data quality has not regressed.
 */

import fs from "fs";
import path from "path";

// ── Accent Regex ──────────────────────────────────────────────────────────────

const ACCENT_REGEX = /[\u0951\u0952\u1CD0-\u1CFF]/;

function hasAccents(text: string): boolean {
  if (text.trim().length < 8) return true;
  return ACCENT_REGEX.test(text);
}

// ── MantraData Shape Validator ────────────────────────────────────────────────

interface ValidationError {
  id: string;
  severity: "error" | "warning";
  field: string;
  message: string;
}

interface PadaWord {
  word_index: number;
  pada: string;
  lemma: string;
  grammar: string;
  literal_meaning: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateMantra(raw: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const id: string = raw.id ?? "UNKNOWN";

  // ── Required string fields ────────────────────────────────────────────────
  for (const field of ["id", "meter", "deity", "rishi", "samhitapatha"] as const) {
    if (typeof raw[field] !== "string" || raw[field].trim() === "") {
      errors.push({
        id,
        severity: "error",
        field,
        message: `Missing or empty required string field: "${field}"`,
      });
    }
  }

  // ── Required number fields ────────────────────────────────────────────────
  for (const field of ["mandala", "sukta", "mantra"] as const) {
    if (typeof raw[field] !== "number" || !Number.isInteger(raw[field]) || raw[field] < 1) {
      errors.push({
        id,
        severity: "error",
        field,
        message: `"${field}" must be a positive integer`,
      });
    }
  }

  // ── Stable ID format check ────────────────────────────────────────────────
  if (typeof raw.id === "string") {
    const expectedId = `RV_${raw.mandala}.${raw.sukta}.${raw.mantra}`;
    if (raw.id !== expectedId) {
      errors.push({
        id,
        severity: "warning",
        field: "id",
        message: `ID "${raw.id}" does not match expected format "${expectedId}"`,
      });
    }
  }

  // ── Samhitapātha accent validation ───────────────────────────────────────
  if (typeof raw.samhitapatha === "string" && raw.samhitapatha.length >= 8) {
    if (!hasAccents(raw.samhitapatha)) {
      errors.push({
        id,
        severity: "error",
        field: "samhitapatha",
        message: `Samhitapātha lacks Vedic pitch accent marks (U+0951/U+0952). Value: "${raw.samhitapatha.slice(0, 50)}..."`,
      });
    }
  }

  // ── Padapātha array validation ────────────────────────────────────────────
  if (!Array.isArray(raw.padapatha) || raw.padapatha.length === 0) {
    errors.push({
      id,
      severity: "error",
      field: "padapatha",
      message: "padapatha must be a non-empty array",
    });
  } else {
    const padaWords: PadaWord[] = raw.padapatha;

    // Check word_index continuity: must be 1-based sequential integers
    const indices = padaWords.map((w) => w.word_index).sort((a, b) => a - b);
    for (let i = 0; i < indices.length; i++) {
      if (indices[i] !== i + 1) {
        errors.push({
          id,
          severity: "error",
          field: "padapatha",
          message: `word_index sequence is discontinuous: expected ${i + 1}, got ${indices[i]}`,
        });
        break;
      }
    }

    // Check per-word required fields
    for (const word of padaWords) {
      for (const wf of ["pada", "lemma", "grammar", "literal_meaning"] as const) {
        if (typeof word[wf] !== "string" || word[wf].trim() === "") {
          errors.push({
            id,
            severity: "error",
            field: `padapatha[${word.word_index}].${wf}`,
            message: `Missing or empty required field: "${wf}"`,
          });
        }
      }
    }

    // Accent coverage warning: fewer than 50% of words accented
    const accentedCount = padaWords.filter((w) =>
      typeof w.pada === "string" && hasAccents(w.pada)
    ).length;
    const ratio = accentedCount / padaWords.length;
    if (ratio < 0.5) {
      errors.push({
        id,
        severity: "warning",
        field: "padapatha",
        message: `Low accent coverage: ${accentedCount}/${padaWords.length} words (${Math.round(ratio * 100)}%) carry pitch marks`,
      });
    }
  }

  // ── Translation ───────────────────────────────────────────────────────────
  if (!raw.translation || typeof raw.translation !== "object") {
    errors.push({ id, severity: "error", field: "translation", message: "Missing translation object" });
  } else {
    for (const tf of ["author", "license", "fluid_text"] as const) {
      if (typeof raw.translation[tf] !== "string") {
        errors.push({ id, severity: "error", field: `translation.${tf}`, message: `Missing translation.${tf}` });
      }
    }
    if (typeof raw.translation.fluid_text === "string" && raw.translation.fluid_text.trim() === "") {
      errors.push({ id, severity: "warning", field: "translation.fluid_text", message: "Translation text is empty" });
    }
  }

  // ── token_mapping (optional but checked if present) ───────────────────────
  if (raw.token_mapping !== undefined) {
    if (typeof raw.token_mapping !== "object" || Array.isArray(raw.token_mapping)) {
      errors.push({ id, severity: "error", field: "token_mapping", message: "token_mapping must be a plain object" });
    } else {
      for (const [k, v] of Object.entries(raw.token_mapping)) {
        if (!Array.isArray(v) || !v.every((n) => typeof n === "number")) {
          errors.push({ id, severity: "error", field: `token_mapping[${k}]`, message: "All values must be number[]" });
        }
      }
    }
  }

  return errors;
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Report {
  sourceFile: string;
  totalMantras: number;
  totalSuktas: number;
  accentCleanPct: number;
  tokenMappingCoverage: number;
  errors: number;
  warnings: number;
  issues: ValidationError[];
}

function main() {
  const STRICT = process.argv.includes("--strict");
  const JSON_MODE = process.argv.includes("--json");

  const jsonPath = path.join(process.cwd(), "data", "rv_1_1.json");

  if (!fs.existsSync(jsonPath)) {
    console.error(`✗ Source file not found: ${jsonPath}`);
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawMantras: any[];
  try {
    rawMantras = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch (err) {
    console.error(`✗ Failed to parse JSON: ${err}`);
    process.exit(1);
  }

  if (!Array.isArray(rawMantras)) {
    console.error("✗ Root element must be an array of mantra objects");
    process.exit(1);
  }

  const allIssues: ValidationError[] = [];

  for (const raw of rawMantras) {
    allIssues.push(...validateMantra(raw));
  }

  // Compute stats
  const suktaIds = new Set(rawMantras.map((m) => `${m.mandala}.${m.sukta}`));
  const accentClean = rawMantras.filter(
    (m) => typeof m.samhitapatha === "string" && hasAccents(m.samhitapatha)
  ).length;
  const withMapping = rawMantras.filter((m) => m.token_mapping && Object.keys(m.token_mapping).length > 0).length;

  const report: Report = {
    sourceFile: jsonPath,
    totalMantras: rawMantras.length,
    totalSuktas: suktaIds.size,
    accentCleanPct: Math.round((accentClean / rawMantras.length) * 100),
    tokenMappingCoverage: Math.round((withMapping / rawMantras.length) * 100),
    errors: allIssues.filter((i) => i.severity === "error").length,
    warnings: allIssues.filter((i) => i.severity === "warning").length,
    issues: allIssues,
  };

  if (JSON_MODE) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    process.exit(report.errors > 0 || (STRICT && report.warnings > 0) ? 1 : 0);
  }

  // ── Human-readable output ──────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════════════");
  console.log(" DLIIH — Data Integrity Validation Report");
  console.log(`═══════════════════════════════════════════════════════`);
  console.log(` Source:             ${path.basename(jsonPath)}`);
  console.log(` Total mantras:      ${report.totalMantras}`);
  console.log(` Total suktas:       ${report.totalSuktas}`);
  console.log(` Accent-clean:       ${accentClean}/${report.totalMantras} (${report.accentCleanPct}%)`);
  console.log(` token_mapping set:  ${withMapping}/${report.totalMantras} (${report.tokenMappingCoverage}%)`);
  console.log(`───────────────────────────────────────────────────────`);

  if (allIssues.length === 0) {
    console.log(" ✓ All validation checks passed. Data is ready to seed.\n");
  } else {
    const errors = allIssues.filter((i) => i.severity === "error");
    const warnings = allIssues.filter((i) => i.severity === "warning");

    if (errors.length > 0) {
      console.log(`\n ✗ ${errors.length} ERROR(S):`);
      for (const e of errors.slice(0, 20)) {
        console.error(`   [${e.id}] ${e.field}: ${e.message}`);
      }
      if (errors.length > 20) console.error(`   ... and ${errors.length - 20} more`);
    }

    if (warnings.length > 0) {
      console.log(`\n ⚠ ${warnings.length} WARNING(S):`);
      for (const w of warnings.slice(0, 20)) {
        console.warn(`   [${w.id}] ${w.field}: ${w.message}`);
      }
      if (warnings.length > 20) console.warn(`   ... and ${warnings.length - 20} more`);
    }

    console.log("");
  }

  const shouldFail = report.errors > 0 || (STRICT && report.warnings > 0);
  if (shouldFail) {
    console.error(
      STRICT
        ? "✗ Validation failed (--strict mode). Fix all issues before seeding."
        : "✗ Validation failed. Fix errors before seeding."
    );
    process.exit(1);
  }

  console.log("✓ Validation passed. Safe to run: npm run prisma:seed\n");
}

main();
