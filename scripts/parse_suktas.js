'use strict';
/**
 * scripts/parse_suktas.js
 *
 * DLIIH — Vedic Samhitas Data Ingestion Pipeline (Phase 1)
 *
 * Transforms raw textual sources into structured JSON / SQL INSERT payloads
 * adhering to the Phase 1 mantra schema.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *
 *   node scripts/parse_suktas.js [options]
 *
 *   --input-samhita   <path>    Path to raw Samhitapātha text file (plain text or HTML)
 *   --input-metadata  <path>    Path to JSON metadata file (DharmicData / Anukramaṇī format)
 *   --input-translations <path> Path to translation JSON (vedadeva / Griffith format)
 *   --input-existing  <path>    Path to existing rv_1_1.json to preserve (default: data/rv_1_1.json)
 *   --output-json     <path>    Output JSON file path (default: data/rv_1_1.json)
 *   --output-sql      <path>    Output SQL INSERT file path (optional)
 *   --mandala         <num>     Mandala number to process (default: 1)
 *   --sukta-start     <num>     First sukta to process (default: 2)
 *   --sukta-end       <num>     Last sukta to process inclusive (default: 20)
 *   --dry-run                   Parse and validate without writing output
 *   --help                      Print this help text
 *
 * ── Accent Preservation Policy ───────────────────────────────────────────────
 *
 *   Vedic pitch accent marks are canonically encoded as:
 *     U+0951  ॑   DEVANAGARI STRESS SIGN UDATTA    (udātta, raised tone)
 *     U+0952  ॒   DEVANAGARI STRESS SIGN ANUDATTA  (anudātta, lowered tone)
 *     U+1CD0–U+1CFF              Vedic Extension block (svarita variants)
 *
 *   The pipeline MUST NOT strip these codepoints at any processing stage.
 *   `validateAccents()` is called on every Samhitapātha and Padapātha string
 *   before they are written to any output format.
 *
 * ── Extension Points ─────────────────────────────────────────────────────────
 *
 *   splitSandhi(token)    → plug in UoH Sanskrit Tools / SandhiSplitter API
 *   generateIAST(deva)    → plug in a full Devanāgarī → ISO 15919 transliterator
 *   morphTag(pada)        → plug in Paninian Morphological Analyser (Ashtadhyayi.com API)
 *
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// 1. CLI Argument Parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    inputSamhita: null,
    inputMetadata: null,
    inputTranslations: null,
    inputExisting: path.join(__dirname, '..', 'data', 'rv_1_1.json'),
    outputJson: path.join(__dirname, '..', 'data', 'rv_1_1.json'),
    outputSql: null,
    mandala: 1,
    suktaStart: 2,
    suktaEnd: 20,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input-samhita':        opts.inputSamhita = args[++i];       break;
      case '--input-metadata':       opts.inputMetadata = args[++i];      break;
      case '--input-translations':   opts.inputTranslations = args[++i];  break;
      case '--input-existing':       opts.inputExisting = args[++i];      break;
      case '--output-json':          opts.outputJson = args[++i];         break;
      case '--output-sql':           opts.outputSql = args[++i];          break;
      case '--mandala':              opts.mandala = parseInt(args[++i], 10); break;
      case '--sukta-start':          opts.suktaStart = parseInt(args[++i], 10); break;
      case '--sukta-end':            opts.suktaEnd = parseInt(args[++i], 10);   break;
      case '--dry-run':              opts.dryRun = true;                   break;
      case '--help': case '-h':      opts.help = true;                     break;
      default:
        console.warn(`Unknown flag: ${args[i]}`);
    }
  }
  return opts;
}

function printHelp() {
  console.log(`
DLIIH — parse_suktas.js  (Phase 1 Ingestion Pipeline)

Usage:
  node scripts/parse_suktas.js [options]

Options:
  --input-samhita   <path>   Raw Samhitapātha source (HTML or plain text)
  --input-metadata  <path>   JSON metadata file (DharmicData Anukramaṇī format)
  --input-translations <path> Translation JSON (vedadeva format)
  --input-existing  <path>   Existing JSON to preserve sukta 1 from
                             (default: data/rv_1_1.json)
  --output-json     <path>   Destination JSON file
                             (default: data/rv_1_1.json)
  --output-sql      <path>   Optional SQL INSERT output file
  --mandala         <num>    Mandala to process (default: 1)
  --sukta-start     <num>    First sukta number (default: 2)
  --sukta-end       <num>    Last sukta number inclusive (default: 20)
  --dry-run                  Parse and validate without writing files
  --help                     Print this help

Accent Preservation:
  U+0951 (udātta ॑) and U+0952 (anudātta ॒) are validated on every string.
  The pipeline will emit a WARNING for any string that appears to have lost
  pitch accent marks.

Extension Stubs:
  splitSandhi(token)   → returns the raw token unchanged; hook in UoH tools here
  generateIAST(deva)   → returns empty string; hook in ISO 15919 transliterator
  morphTag(pada)       → returns "Vedic term"; hook in morphological analyser
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Accent Preservation Validator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vedic pitch accent Unicode ranges:
 *   U+0951  ॑   DEVANAGARI STRESS SIGN UDATTA
 *   U+0952  ॒   DEVANAGARI STRESS SIGN ANUDATTA
 *   U+1CD0–U+1CFF   Vedic Extensions block
 */
const ACCENT_REGEX = /[\u0951\u0952\u1CD0-\u1CFF]/;

/**
 * Validates that a Devanāgarī Samhitapātha or Padapātha string retains
 * its Vedic pitch accent marks. Returns true if accents are found or if
 * the string is too short to reliably require them.
 *
 * @param {string} text
 * @param {string} label  - Human-readable identifier for warning messages
 * @returns {boolean}
 */
function validateAccents(text, label) {
  if (!text || text.length < 8) return true; // short strings may lack accents
  if (!ACCENT_REGEX.test(text)) {
    console.warn(`  ⚠ ACCENT WARNING [${label}]: String appears to lack pitch accent marks.`);
    console.warn(`    Preview: "${text.slice(0, 60)}"`);
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Sandhi-Splitting Stub
// ─────────────────────────────────────────────────────────────────────────────

/**
 * EXTENSION POINT — Sandhi Splitter
 *
 * Signature:
 *   splitSandhi(token: string): string[]
 *
 * Returns an array of component morphemes after Sandhi resolution.
 * Currently returns [token] unchanged (identity transform).
 *
 * To activate:
 *   Replace the body with a call to:
 *     - University of Hyderabad Sanskrit Tools API
 *     - Sanskrit Heritage Site Sandhi Splitter
 *     - Ashtadhyayi.com morphological API
 *
 * The returned array should contain DEVANAGARI strings WITH accent marks
 * preserved, since splitting must not strip U+0951/U+0952.
 *
 * @param {string} token - A single Samhitapātha token (with accents)
 * @returns {string[]}   - Array of split morphemes (with accents)
 */
function splitSandhi(token) {
  // TODO: Integrate external Sandhi splitter
  // Example integration:
  //   const result = await fetch('https://sanskrit.uoh.ac.in/api/split?word=' + encodeURIComponent(token));
  //   return result.json();
  return [token];
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. IAST Transliteration Stub
// ─────────────────────────────────────────────────────────────────────────────

/**
 * EXTENSION POINT — Devanāgarī → IAST Transliterator
 *
 * Signature:
 *   generateIAST(devanagari: string): string
 *
 * Converts a Devanāgarī string to ISO 15919 IAST romanisation.
 * Accent diacritics should be preserved as combining characters:
 *   U+0951 → combining acute accent (or appropriate IAST diacritic)
 *
 * Currently returns an empty string (stub).
 *
 * To activate, plug in one of:
 *   - Vidyut transliterator (https://github.com/ambuda-org/vidyut)
 *   - Aksharamukha API
 *   - Sanskrit Library Phonetic Basic (SLP1) intermediate + IAST mapper
 *
 * @param {string} devanagari
 * @returns {string} IAST romanised string
 */
function generateIAST(devanagari) {
  // TODO: Integrate transliteration engine
  void devanagari;
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Morphological Tagging Stub
// ─────────────────────────────────────────────────────────────────────────────

/**
 * EXTENSION POINT — Morphological Analyser
 *
 * Signature:
 *   morphTag(pada: string, lemma: string): string
 *
 * Returns a comma-separated grammatical tag string for a Padapātha word.
 * Format matches the existing schema: "noun, masc, acc, sg"
 *
 * Currently returns the placeholder "Vedic term".
 *
 * To activate, integrate:
 *   - Ashtadhyayi.com API (https://ashtadhyayi.com/api)
 *   - Sanskrit Heritage Site parser
 *   - SanskritKosha morphological endpoint
 *
 * @param {string} pada   - Padapātha form (with accents)
 * @param {string} lemma  - Accent-stripped lemma
 * @returns {string}      - Grammatical tag string
 */
function morphTag(pada, lemma) {
  // TODO: Integrate morphological analyser
  void pada; void lemma;
  return 'Vedic term';
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Existing Utility Functions (unchanged — phonologically sound)
// ─────────────────────────────────────────────────────────────────────────────

const translitMap = {
  'मधुच्छन्दा वैश्वामित्रः': 'Madhuchhandas Vaiśvāmitra',
  'मधुच्छन्दा वैश्वामित्र': 'Madhuchhandas Vaiśvāmitra',
  'जेता माधुच्छन्दसः': 'Jetṛ Mādhuchhandasa',
  'जेता माधुच्छन्दस': 'Jetṛ Mādhuchhandasa',
  'मेधातिथिः काण्वः': 'Medhātithi Kāṇva',
  'मेधातिथि काण्व': 'Medhātithi Kāṇva',
  'अग्निः': 'Agni', 'अग्नि': 'Agni',
  'वायुः': 'Vāyu',  'वायु': 'Vāyu',
  'इन्द्र-वायु': 'Indra-Vāyu', 'इन्द्र-वायुः': 'Indra-Vāyu',
  'मित्रा-वरुणौ': 'Mitra-Varuṇa', 'मित्रावरुणौ': 'Mitra-Varuṇa',
  'अश्विनौ': 'Aśvins',
  'इन्द्रः': 'Indra', 'इन्द्र': 'Indra',
  'विश्वेदेवाः': 'Viśvedevas', 'विश्वेदेवा': 'Viśvedevas',
  'सरस्वती': 'Sarasvatī',
  'मरुतः': 'Maruts', 'मरुत्': 'Maruts',
  'इन्द्र-मरुतः': 'Indra-Maruts',
  'ऋभवः': 'Ṛbhus',  'ऋभव': 'Ṛbhus',
  'ब्रह्मणस्पतिः': 'Brahmaṇaspati',
  'सोमः': 'Soma',
  'सदसस्पतिः': 'Sadasaspati',
  'सविता': 'Savitṛ',
  'द्यावापृथिव्यौ': 'Dyāvāpṛthivyau',
  'गायत्री': 'Gāyatrī',
};

function devanagariToNumber(devaStr) {
  const map = { '०':0,'१':1,'२':2,'३':3,'४':4,'५':5,'६':6,'७':7,'८':8,'९':9 };
  return parseInt(
    devaStr.split('').map(c => map[c] !== undefined ? map[c] : c).join(''),
    10
  );
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#145;/g, "'").replace(/&#146;/g, "'")
    .replace(/&#147;/g, '"').replace(/&#148;/g, '"');
}

function stripHtmlTags(str) { return str.replace(/<[^>]*>/g, ''); }

/**
 * Phonetic normalisation for LCS alignment.
 * NOTE: This intentionally strips accents for the *alignment algorithm only*.
 * The original accent-bearing strings are always preserved in the output.
 */
function phoneticClean(str) {
  if (!str) return '';
  return str
    .replace(/[\u0951\u0952]/g, '')  // strip accents for comparison only
    .replace(/\s*इति\s*$/, '')
    .replace(/[।॥\sऽ\-\u200c\u200d]/g, '')
    .replace(/ः$/, 'स्').replace(/ं$/, 'म्')
    .replace(/ा/g, 'अ').replace(/ी/g, 'इ').replace(/ू/g, 'उ')
    .replace(/े/g, 'अइ').replace(/ो/g, 'अउ')
    .replace(/ै/g, 'अइ').replace(/ौ/g, 'अउ')
    .replace(/य/g, 'इ').replace(/व/g, 'उ');
}

function lcs(a, b) {
  const dp = Array(a.length + 1).fill(0).map(() => Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  return dp[a.length][b.length];
}

function alignTokens(samhitaTokens, padapathaWords) {
  const S = samhitaTokens.filter(t => t !== '।' && t !== '॥');
  const P = padapathaWords;
  const cleanS = S.map(t => phoneticClean(t));
  const cleanP = P.map(w => phoneticClean(w));
  const memo = {};
  function solve(sIdx, pIdx) {
    const key = `${sIdx},${pIdx}`;
    if (key in memo) return memo[key];
    if (sIdx === S.length) {
      if (pIdx === P.length) return { score: 0, choices: [] };
      return { score: -99999, choices: [] };
    }
    let bestScore = -99999, bestChoices = [];
    let res = solve(sIdx + 1, pIdx);
    if (res.score > bestScore) { bestScore = res.score; bestChoices = [0, ...res.choices]; }
    let concatP = '';
    for (let k = 1; pIdx + k <= P.length; k++) {
      if (k > 3) break;
      concatP += cleanP[pIdx + k - 1];
      const maxLen = Math.max(cleanS[sIdx].length, concatP.length);
      const sim = maxLen === 0 ? 1.0 : lcs(cleanS[sIdx], concatP) / maxLen;
      res = solve(sIdx + 1, pIdx + k);
      if (res.score + sim > bestScore) {
        bestScore = res.score + sim;
        bestChoices = [k, ...res.choices];
      }
    }
    memo[key] = { score: bestScore, choices: bestChoices };
    return memo[key];
  }
  const result = solve(0, 0);
  const mapping = {};
  let pIdx = 0, cleanSIdx = 0;
  for (let i = 0; i < samhitaTokens.length; i++) {
    const token = samhitaTokens[i];
    if (token === '।' || token === '॥') { mapping[i] = []; continue; }
    const k = result.choices[cleanSIdx];
    const wordIndices = [];
    for (let j = 0; j < k; j++) wordIndices.push(pIdx + j + 1);
    mapping[i] = wordIndices;
    pIdx += k; cleanSIdx++;
  }
  return mapping;
}

function parseTranslationVerses(html) {
  const pRegex = /<p>([\s\S]*?)<\/p>/gi;
  let match, blocks = [];
  while ((match = pRegex.exec(html)) !== null) blocks.push(match[1]);
  let translationBlock = '';
  for (const block of blocks) {
    const decoded = decodeHtmlEntities(block).trim();
    if (/^\d+\s+/.test(decoded)) { translationBlock = decoded; break; }
  }
  if (!translationBlock) translationBlock = decodeHtmlEntities(html);
  const cleaned = translationBlock.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(/\s*(\d+)\s+/);
  const verses = {};
  for (let i = 1; i < parts.length; i += 2) {
    const num = parseInt(parts[i], 10);
    const text = stripHtmlTags(parts[i + 1]).trim();
    if (num && text) verses[num] = text;
  }
  return verses;
}

function parseMetadata(text) {
  const firstBlock = text.split('\n\n')[0].trim().replace(/\s+/g, ' ');
  const parts = firstBlock.split(/[।|\|]/).map(p => p.trim()).filter(Boolean);
  let numMantras = 0, rishi = 'Unknown', deity = 'Unknown', meter = 'Unknown';
  if (parts.length >= 3) {
    const match = parts[0].match(/^([०-९]+)\s*(.*)$/);
    if (match) { numMantras = devanagariToNumber(match[1]); rishi = match[2].trim(); }
    else { rishi = parts[0]; }
    deity = parts[1].trim(); meter = parts[2].trim();
  } else if (parts.length === 2) {
    const match = parts[0].match(/^([०-९]+)\s*(.*)$/);
    if (match) { numMantras = devanagariToNumber(match[1]); rishi = match[2].trim(); }
    else { rishi = parts[0]; }
    deity = parts[1].trim();
  }
  return {
    numMantras,
    rishi: translitMap[rishi] || rishi.replace(/ः$/, ''),
    deity,
    meter: translitMap[meter] || meter.replace(/ः$/, ''),
  };
}

function getDeityForMantra(deityStr, mantraNum) {
  let clean = deityStr.replace(/[०-९]/g, d => devanagariToNumber(d));
  const rangeRegex = /(\d+)\s*-\s*(\d+)\s*([^,;।\n]+)/g;
  let match, bestDeity = null;
  while ((match = rangeRegex.exec(clean)) !== null) {
    const start = parseInt(match[1], 10), end = parseInt(match[2], 10);
    const name = match[3].trim();
    if (mantraNum >= start && mantraNum <= end) {
      bestDeity = translitMap[name] || name.replace(/ः$/, '');
      break;
    }
  }
  if (bestDeity) return bestDeity;
  const stripped = deityStr.trim().replace(/ः$/, '');
  return translitMap[stripped] || stripped;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SQL Output Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates PostgreSQL-compatible INSERT statements for a mantra object.
 * This is Phase 1 stub output — real schema population goes through the
 * Prisma seed.ts. This SQL output is useful for direct DB introspection.
 */
function generateSqlInserts(mantra) {
  const esc = s => (s || '').replace(/'/g, "''");
  const lines = [];
  lines.push(
    `INSERT INTO mantra_layers (mantra_id, layer_type, language, script, content, author, license)` +
    ` VALUES ('${esc(mantra.id)}', 'SAMHITAPATHA', 'sa', 'DEVANAGARI', '${esc(mantra.samhitapatha)}', 'Traditional', 'Public Domain');`
  );
  if (mantra.translation?.fluid_text) {
    lines.push(
      `INSERT INTO mantra_layers (mantra_id, layer_type, language, script, content, author, license)` +
      ` VALUES ('${esc(mantra.id)}', 'TRANSLATION', 'en', 'LATIN', '${esc(mantra.translation.fluid_text)}', '${esc(mantra.translation.author)}', '${esc(mantra.translation.license)}');`
    );
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Main Orchestration
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  const opts = parseArgs(process.argv);

  if (opts.help) { printHelp(); process.exit(0); }

  console.log('═══════════════════════════════════════════════════');
  console.log(' DLIIH — Vedic Samhitas Ingestion Pipeline (Phase 1)');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('Options:', JSON.stringify(opts, null, 2), '\n');

  try {
    // 1. Load existing data (preserves Sukta 1 which is hand-curated)
    console.log(`Reading existing dataset from ${opts.inputExisting}`);
    if (!fs.existsSync(opts.inputExisting)) {
      throw new Error(`--input-existing file not found: ${opts.inputExisting}`);
    }
    const existingDataset = JSON.parse(fs.readFileSync(opts.inputExisting, 'utf-8'));
    const finalizedMantras = existingDataset.filter(m => m.sukta === 1);
    console.log(`✓ Preserved ${finalizedMantras.length} mantras from Sukta 1 (hand-curated)\n`);

    // 2. Load and parse source files (if provided)
    let samhitaMap = {}, padapathaMap = {}, metadataMap = {};

    if (opts.inputSamhita && fs.existsSync(opts.inputSamhita)) {
      console.log(`Reading Samhitapātha source: ${opts.inputSamhita}`);
      const samhitaContent = fs.readFileSync(opts.inputSamhita, 'utf-8');
      const pRegex = /<p>([\s\S]*?)<\/p>/gi;
      let pMatch;
      while ((pMatch = pRegex.exec(samhitaContent)) !== null) {
        const p = pMatch[1].trim();
        const samhitaMatch = p.match(/([०-९]+)\.([०-९]+)\.([०-९]+)[a-z]/);
        if (samhitaMatch) {
          const mandala = devanagariToNumber(samhitaMatch[1]);
          const sukta = devanagariToNumber(samhitaMatch[2]);
          const mantra = devanagariToNumber(samhitaMatch[3]);
          if (mandala === opts.mandala && sukta >= opts.suktaStart && sukta <= opts.suktaEnd) {
            const key = `${sukta}.${mantra}`;
            if (!samhitaMap[key]) samhitaMap[key] = [];
            samhitaMap[key].push(p);
          }
        }
        const padapathaMatch = p.match(/॥\s*([०-९]+)\.([०-९]+)\.([०-९]+)\s*॥/);
        if (padapathaMatch) {
          const mandala = devanagariToNumber(padapathaMatch[1]);
          const sukta = devanagariToNumber(padapathaMatch[2]);
          const mantra = devanagariToNumber(padapathaMatch[3]);
          if (mandala === opts.mandala && sukta >= opts.suktaStart && sukta <= opts.suktaEnd) {
            padapathaMap[`${sukta}.${mantra}`] = p;
          }
        }
      }
      console.log(`✓ Parsed ${Object.keys(samhitaMap).length} samhita blocks, ${Object.keys(padapathaMap).length} padapatha blocks`);
    }

    if (opts.inputMetadata && fs.existsSync(opts.inputMetadata)) {
      console.log(`Reading metadata from ${opts.inputMetadata}`);
      const metaRaw = fs.readFileSync(opts.inputMetadata, 'utf-8');
      const jsonStart = metaRaw.indexOf('[');
      if (jsonStart !== -1) {
        const metaJson = JSON.parse(metaRaw.substring(jsonStart));
        for (const item of metaJson) {
          if (item.veda === 'rigveda' && item.mandala === opts.mandala) {
            metadataMap[item.sukta] = parseMetadata(item.text);
          }
        }
        console.log(`✓ Parsed metadata for ${Object.keys(metadataMap).length} suktas`);
      }
    }

    // 3. Process suktas
    const sqlLines = [];
    let processedCount = 0;

    for (let sNum = opts.suktaStart; sNum <= opts.suktaEnd; sNum++) {
      process.stdout.write(`Processing Mandala ${opts.mandala}, Sukta ${sNum}... `);

      // Fetch Griffith translations
      let translationVerses = {};
      if (opts.inputTranslations && fs.existsSync(opts.inputTranslations)) {
        const transRaw = JSON.parse(fs.readFileSync(opts.inputTranslations, 'utf-8'));
        translationVerses = parseTranslationVerses(transRaw.orig || '');
      } else {
        // Fetch from vedadeva unpkg CDN
        const padded = sNum.toString().padStart(3, '0');
        const unpkgUrl = `https://unpkg.com/@indra.ai/vedadeva/data/rigveda/hymns/01${padded}.json`;
        try {
          const translationRes = await fetch(unpkgUrl);
          if (translationRes.ok) {
            const translationJson = await translationRes.json();
            translationVerses = parseTranslationVerses(translationJson.orig || '');
          }
        } catch (fetchErr) {
          console.warn(`\n  ⚠ Could not fetch translations for Sukta ${sNum}: ${fetchErr.message}`);
        }
      }

      const meta = metadataMap[sNum] || { rishi: 'Madhuchhandas Vaiśvāmitra', deity: 'Unknown', meter: 'Gāyatrī' };
      let mNum = 1, addedCount = 0;

      while (true) {
        const key = `${sNum}.${mNum}`;
        if (!samhitaMap[key] || !padapathaMap[key]) break;

        // ── Samhitapātha Layer ───────────────────────────────────────────────
        const rawSamhitaBlocks = samhitaMap[key];
        let cleanSamhita = rawSamhitaBlocks.join(' ')
          .replace(/<BR>/g, ' ').replace(/<br\s*\/?>/g, ' ')
          .replace(/[०-९]+\.[०-९]+\.[०-९]+[a-z]/g, '')
          .replace(/\s+/g, ' ').trim();

        // ACCENT VALIDATION — Samhitapātha
        validateAccents(cleanSamhita, `RV_${opts.mandala}.${sNum}.${mNum} samhitapatha`);

        // Run Sandhi splitting stub on each token (no-op for now, ready for extension)
        const samhitaTokens = cleanSamhita.split(/\s+/).filter(Boolean);
        const splitTokens = samhitaTokens.flatMap(t => splitSandhi(t));
        void splitTokens; // available for downstream morphological tagging

        // ── Padapātha Layer ──────────────────────────────────────────────────
        let cleanPada = padapathaMap[key]
          .replace(/<BR>/g, ' ').replace(/<br\s*\/?>/g, ' ')
          .replace(/॥\s*[०-९]+\.[०-९]+\.[०-९]+\s*॥/g, '')
          .replace(/[\s।॥]+$/, '').trim();

        // ACCENT VALIDATION — Padapātha
        validateAccents(cleanPada, `RV_${opts.mandala}.${sNum}.${mNum} padapatha`);

        const padapathaWords = cleanPada.split(/\s*।\s*/).filter(Boolean);

        // Build word objects — lemma is accent-stripped form of pada
        const wordObjects = padapathaWords.map((word, wIdx) => {
          const lemma = phoneticClean(word);
          const grammar = morphTag(word, lemma);
          return {
            word_index: wIdx + 1,
            pada: word,            // accent-bearing padapatha form — preserved
            lemma,
            grammar,
            literal_meaning: 'Vedic word',
          };
        });

        // Token→pada alignment
        const tokenMapping = alignTokens(samhitaTokens, padapathaWords);

        // IAST layer (stub — empty until transliterator is plugged in)
        const iastText = generateIAST(cleanSamhita);

        const mantraObj = {
          id: `RV_${opts.mandala}.${sNum}.${mNum}`,
          mandala: opts.mandala,
          sukta: sNum,
          mantra: mNum,
          meter: meta.meter,
          deity: getDeityForMantra(meta.deity, mNum),
          rishi: meta.rishi,
          /** Samhitapātha — canonical continuous text, pitch accents PRESERVED */
          samhitapatha: cleanSamhita,
          /** Padapātha — split word analysis, pitch accents PRESERVED */
          padapatha: wordObjects,
          /** IAST transliteration layer (stub, empty until pipeline extension) */
          ...(iastText ? { iast: iastText } : {}),
          translation: {
            author: 'Ralph T.H. Griffith',
            license: 'Public Domain',
            fluid_text: translationVerses[mNum] || `Translation for Rigveda ${opts.mandala}.${sNum}.${mNum} (pending).`,
          },
          commentary: {
            author: 'Sāyaṇa',
            language: 'sa',
            text: '',
          },
          token_mapping: tokenMapping,
        };

        finalizedMantras.push(mantraObj);
        if (opts.outputSql) sqlLines.push(generateSqlInserts(mantraObj));
        addedCount++;
        mNum++;
      }

      process.stdout.write(`${addedCount} mantras\n`);
      processedCount += addedCount;
    }

    // 4. Sort by sukta, then mantra
    finalizedMantras.sort((a, b) =>
      a.sukta !== b.sukta ? a.sukta - b.sukta : a.mantra - b.mantra
    );

    console.log(`\n✓ Pipeline complete. Total mantras: ${finalizedMantras.length} (processed: ${processedCount})`);

    if (opts.dryRun) {
      console.log('\n[DRY RUN] — No files written. Remove --dry-run to write output.');
      return;
    }

    // 5. Write JSON output
    fs.mkdirSync(path.dirname(opts.outputJson), { recursive: true });
    fs.writeFileSync(opts.outputJson, JSON.stringify(finalizedMantras, null, 2), 'utf-8');
    console.log(`✓ JSON written to ${opts.outputJson}`);

    // 6. Write SQL output (optional)
    if (opts.outputSql && sqlLines.length > 0) {
      fs.mkdirSync(path.dirname(opts.outputSql), { recursive: true });
      fs.writeFileSync(opts.outputSql, sqlLines.join('\n\n') + '\n', 'utf-8');
      console.log(`✓ SQL INSERT file written to ${opts.outputSql}`);
    }

    console.log('\n✓ Done.\n');

  } catch (err) {
    console.error('\n✗ Pipeline error:', err);
    process.exit(1);
  }
}

run();
