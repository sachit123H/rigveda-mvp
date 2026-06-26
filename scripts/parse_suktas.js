const fs = require('fs');
const path = require('path');

// Transliteration map for common seers, deities, and meters
const translitMap = {
  'मधुच्छन्दा वैश्वामित्रः': 'Madhuchhandas Vaiśvāmitra',
  'मधुच्छन्दा वैश्वामित्र': 'Madhuchhandas Vaiśvāmitra',
  'जेता माधुच्छन्दसः': 'Jetṛ Mādhuchhandasa',
  'जेता माधुच्छन्दस': 'Jetṛ Mādhuchhandasa',
  'मेधातिथिः काण्वः': 'Medhātithi Kāṇva',
  'मेधातिथि काण्व': 'Medhātithi Kāṇva',
  
  'अग्निः': 'Agni',
  'अग्नि': 'Agni',
  'वायुः': 'Vāyu',
  'वायु': 'Vāyu',
  'इन्द्र-वायु': 'Indra-Vāyu',
  'इन्द्र-वायुः': 'Indra-Vāyu',
  'मित्रा-वरुणौ': 'Mitra-Varuṇa',
  'मित्रावरुणौ': 'Mitra-Varuṇa',
  'अश्विनौ': 'Aśvins',
  'इन्द्रः': 'Indra',
  'इन्द्र': 'Indra',
  'विश्वेदेवाः': 'Viśvedevas',
  'विश्वेदेवा': 'Viśvedevas',
  'सरस्वती': 'Sarasvatī',
  'मरुतः': 'Maruts',
  'मरुत्': 'Maruts',
  'इन्द्र-मरुतः': 'Indra-Maruts',
  'ऋभवः': 'Ṛbhus',
  'ऋभव': 'Ṛbhus',
  'ब्रह्मणस्पतिः': 'Brahmaṇaspati',
  'सोमः': 'Soma',
  'सदसस्पतिः': 'Sadasaspati',
  'सविता': 'Savitṛ',
  'द्यावापृथिव्यौ': 'Dyāvāpṛthivyau',
  
  'गायत्री': 'Gāyatrī'
};

function devanagariToNumber(devaStr) {
  const map = {
    '०': 0, '१': 1, '२': 2, '३': 3, '४': 4,
    '५': 5, '६': 6, '७': 7, '८': 8, '९': 9
  };
  return parseInt(devaStr.split('').map(c => map[c] !== undefined ? map[c] : c).join(''), 10);
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#145;/g, "'")
    .replace(/&#146;/g, "'")
    .replace(/&#147;/g, '"')
    .replace(/&#148;/g, '"');
}

function stripHtmlTags(str) {
  return str.replace(/<[^>]*>/g, '');
}

function phoneticClean(str) {
  if (!str) return "";
  return str
    .replace(/[\u0951\u0952]/g, "") // strip accents
    .replace(/\s*इति\s*$/, "") // strip trailing 'इति'
    .replace(/[।॥\sऽ\-\u200c\u200d]/g, "") // strip punctuation, avagraha, hyphens, zero-width chars
    .replace(/ः$/, "स्") // visarga to s
    .replace(/ं$/, "म्") // anusvara to m
    .replace(/ा/g, "अ") // map vowels
    .replace(/ी/g, "इ")
    .replace(/ू/g, "उ")
    .replace(/े/g, "अइ") // sandhi components
    .replace(/ो/g, "अउ")
    .replace(/ै/g, "अइ")
    .replace(/ौ/g, "अउ")
    .replace(/य/g, "इ")
    .replace(/व/g, "उ");
}

function lcs(a, b) {
  const dp = Array(a.length + 1).fill(0).map(() => Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[a.length][b.length];
}

function alignTokens(samhitaTokens, padapathaWords) {
  const S = samhitaTokens.filter(t => t !== "।" && t !== "॥");
  const P = padapathaWords;
  
  // Clean elements individually
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
    
    let bestScore = -99999;
    let bestChoices = [];
    
    // Option 1: Assign 0 padapatha words to this token
    let res = solve(sIdx + 1, pIdx);
    if (res.score + 0 > bestScore) {
      bestScore = res.score + 0;
      bestChoices = [0, ...res.choices];
    }
    
    // Option 2: Assign k padapatha words (k >= 1)
    let concatP = "";
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
  
  // Reconstruct mapping
  const mapping = {};
  let pIdx = 0;
  
  let cleanSIdx = 0;
  for (let i = 0; i < samhitaTokens.length; i++) {
    const token = samhitaTokens[i];
    if (token === "।" || token === "॥") {
      mapping[i] = [];
      continue;
    }
    
    const k = result.choices[cleanSIdx];
    const wordIndices = [];
    for (let j = 0; j < k; j++) {
      wordIndices.push(pIdx + j + 1); // 1-based indexing for words
    }
    mapping[i] = wordIndices;
    
    pIdx += k;
    cleanSIdx++;
  }
  
  return mapping;
}

function parseTranslationVerses(html) {
  const pRegex = /<p>([\s\S]*?)<\/p>/gi;
  let match;
  let blocks = [];
  while ((match = pRegex.exec(html)) !== null) {
    blocks.push(match[1]);
  }
  
  let translationBlock = "";
  for (const block of blocks) {
    const decoded = decodeHtmlEntities(block).trim();
    if (/^\d+\s+/.test(decoded) || /^[<br\s*\/?>]*\s*\d+\s+/.test(decoded)) {
      translationBlock = decoded;
      break;
    }
  }
  
  if (!translationBlock) {
    translationBlock = decodeHtmlEntities(html);
  }
  
  const cleaned = translationBlock
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const parts = cleaned.split(/\s*(\d+)\s+/);
  
  const verses = {};
  for (let i = 1; i < parts.length; i += 2) {
    const num = parseInt(parts[i], 10);
    const text = stripHtmlTags(parts[i + 1]).trim();
    if (num && text) {
      verses[num] = text;
    }
  }
  
  return verses;
}

function parseMetadata(text) {
  const firstBlock = text.split('\n\n')[0].trim().replace(/\s+/g, ' ');
  const parts = firstBlock.split(/[।|\|]/).map(p => p.trim()).filter(Boolean);
  
  let numMantras = 0;
  let rishi = "Unknown";
  let deity = "Unknown";
  let meter = "Unknown";
  
  if (parts.length >= 3) {
    const part0 = parts[0];
    const match = part0.match(/^([०-९]+)\s*(.*)$/);
    if (match) {
      numMantras = devanagariToNumber(match[1]);
      rishi = match[2].trim();
    } else {
      rishi = part0;
    }
    
    deity = parts[1].trim();
    meter = parts[2].trim();
  } else if (parts.length === 2) {
    const part0 = parts[0];
    const match = part0.match(/^([०-९]+)\s*(.*)$/);
    if (match) {
      numMantras = devanagariToNumber(match[1]);
      rishi = match[2].trim();
    } else {
      rishi = part0;
    }
    deity = parts[1].trim();
  }
  
  return {
    numMantras,
    rishi: translitMap[rishi] || rishi.replace(/ः$/, ''),
    deity,
    meter: translitMap[meter] || meter.replace(/ः$/, '')
  };
}

function getDeityForMantra(deityStr, mantraNum) {
  let clean = deityStr.replace(/[०-९]/g, d => devanagariToNumber(d));
  // Look for ranges like "1-3 Vayu" or "1-3 वायु"
  const rangeRegex = /(\d+)\s*-\s*(\d+)\s*([^,;।\n]+)/g;
  let match;
  let bestDeity = null;
  while ((match = rangeRegex.exec(clean)) !== null) {
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    const name = match[3].trim();
    if (mantraNum >= start && mantraNum <= end) {
      bestDeity = translitMap[name] || name.replace(/ः$/, '');
      break;
    }
  }
  if (bestDeity) return bestDeity;
  
  // Try mapping the whole string
  const strippedDeity = deityStr.trim().replace(/ः$/, '');
  return translitMap[strippedDeity] || strippedDeity;
}

async function run() {
  try {
    console.log("Starting Rigveda suktas parser...");
    
    // 1. Read existing rv_1_1.json to preserve Sukta 1
    const rvJsonPath = path.join(__dirname, '..', 'data', 'rv_1_1.json');
    console.log(`Reading existing dataset from ${rvJsonPath}`);
    const existingDataset = JSON.parse(fs.readFileSync(rvJsonPath, 'utf-8'));
    
    const finalizedMantras = existingDataset.filter(m => m.sukta === 1);
    console.log(`Preserved ${finalizedMantras.length} mantras from Sukta 1.`);
    
    // 2. Read Detlef's database file
    const detlefPath = 'C:\\Users\\sachi\\.gemini\\antigravity-ide\\brain\\18402118-d836-4b37-8cff-5876ad0a2343\\.system_generated\\steps\\249\\content.md';
    console.log(`Reading Detlef's raw text database from ${detlefPath}`);
    const detlefContent = fs.readFileSync(detlefPath, 'utf-8');
    
    // Parse paragraphs from Detlef's database
    const pRegex = /<p>([\s\S]*?)<\/p>/gi;
    let pMatch;
    const paragraphs = [];
    while ((pMatch = pRegex.exec(detlefContent)) !== null) {
      paragraphs.push(pMatch[1].trim());
    }
    console.log(`Parsed ${paragraphs.length} paragraphs from Detlef's database.`);
    
    // 3. Read metadata from DharmicData step 309 content
    const dharmicPath = 'C:/Users/sachi/.gemini/antigravity-ide/brain/18402118-d836-4b37-8cff-5876ad0a2343/.system_generated/steps/309/content.md';
    console.log(`Reading metadata from DharmicData file ${dharmicPath}`);
    const dharmicRaw = fs.readFileSync(dharmicPath, 'utf-8');
    // Strip the "Source: ..." header before parsing JSON
    const jsonStartIndex = dharmicRaw.indexOf('[');
    if (jsonStartIndex === -1) {
      throw new Error("Could not find start of JSON array in step 309 content.");
    }
    const dharmicJson = JSON.parse(dharmicRaw.substring(jsonStartIndex));
    
    // Create a map of sukta -> metadata from DharmicData
    const metadataMap = {};
    for (const item of dharmicJson) {
      if (item.veda === "rigveda" && item.mandala === 1) {
        metadataMap[item.sukta] = parseMetadata(item.text);
      }
    }
    
    // Group Detlef's paragraphs by Mandala, Sukta, Mantra
    const samhitaMap = {};
    const padapathaMap = {};
    
    for (const p of paragraphs) {
      // Samhitapatha detection
      const samhitaMatch = p.match(/([०-९]+)\.([०-९]+)\.([०-९]+)[a-z]/);
      if (samhitaMatch) {
        const mandala = devanagariToNumber(samhitaMatch[1]);
        const sukta = devanagariToNumber(samhitaMatch[2]);
        const mantra = devanagariToNumber(samhitaMatch[3]);
        
        if (mandala === 1 && sukta >= 2 && sukta <= 20) {
          const key = `${sukta}.${mantra}`;
          if (!samhitaMap[key]) {
            samhitaMap[key] = [];
          }
          samhitaMap[key].push(p);
        }
      }
      
      // Padapatha detection
      const padapathaMatch = p.match(/॥\s*([०-९]+)\.([०-९]+)\.([०-९]+)\s*॥/);
      if (padapathaMatch) {
        const mandala = devanagariToNumber(padapathaMatch[1]);
        const sukta = devanagariToNumber(padapathaMatch[2]);
        const mantra = devanagariToNumber(padapathaMatch[3]);
        
        if (mandala === 1 && sukta >= 2 && sukta <= 20) {
          const key = `${sukta}.${mantra}`;
          padapathaMap[key] = p;
        }
      }
    }
    
    // 4. Compile Suktas 2 to 20
    for (let sNum = 2; sNum <= 20; sNum++) {
      console.log(`Processing Mandala 1, Sukta ${sNum}...`);
      
      // Fetch Griffith translations from unpkg for this Sukta
      const padded = sNum.toString().padStart(3, '0');
      const unpkgUrl = `https://unpkg.com/@indra.ai/vedadeva/data/rigveda/hymns/01${padded}.json`;
      console.log(`Fetching translations from ${unpkgUrl}`);
      const translationRes = await fetch(unpkgUrl);
      if (!translationRes.ok) {
        throw new Error(`Failed to fetch translation for Sukta ${sNum} from unpkg.`);
      }
      const translationJson = await translationRes.json();
      const translationVerses = parseTranslationVerses(translationJson.orig);
      
      // Get metadata for this sukta
      const meta = metadataMap[sNum] || { rishi: "Madhuchhandas Vaiśvāmitra", deity: "Unknown", meter: "Gāyatrī" };
      
      // Find how many mantras this sukta has
      let mNum = 1;
      while (true) {
        const key = `${sNum}.${mNum}`;
        if (!samhitaMap[key] || !padapathaMap[key]) {
          break; // end of mantras for this sukta
        }
        
        // Clean Samhitapatha
        const rawSamhitaBlocks = samhitaMap[key];
        // Combine rawSamhitaBlocks text
        let combinedRaw = rawSamhitaBlocks.join(" ");
        let cleanSamhita = combinedRaw
          .replace(/<BR>/g, ' ')
          .replace(/<br\s*\/?>/g, ' ')
          .replace(/[०-९]+\.[०-९]+\.[०-९]+[a-z]/g, '') // remove line markers like १.२.१a
          .replace(/\s+/g, ' ')
          .trim();
        
        // Clean Padapatha
        const rawPadapatha = padapathaMap[key];
        let cleanPada = rawPadapatha
          .replace(/<BR>/g, ' ')
          .replace(/<br\s*\/?>/g, ' ')
          .replace(/॥\s*[०-९]+\.[०-९]+\.[०-९]+\s*॥/g, '') // remove final number
          .trim();
        // Remove trailing danda and spaces
        cleanPada = cleanPada.replace(/[\s।॥]+$/, '');
        
        // Tokenize Padapatha
        const padapathaWords = cleanPada.split(/\s*।\s*/).filter(Boolean);
        
        // Map word tokens to structures
        const wordObjects = padapathaWords.map((word, wIdx) => {
          // Lemma is accent stripped
          let lemma = phoneticClean(word);
          return {
            word_index: wIdx + 1,
            pada: word,
            lemma: lemma,
            grammar: "Vedic term",
            literal_meaning: "Vedic word"
          };
        });
        
        // Clean Samhitapatha tokens
        const samhitaTokens = cleanSamhita.split(/\s+/).filter(Boolean);
        
        // Generate mapping
        const tokenMapping = alignTokens(samhitaTokens, padapathaWords);
        
        // Resolve deity for this mantra
        const deity = getDeityForMantra(meta.deity, mNum);
        
        // Get Griffith translation for this mantra
        const translationText = translationVerses[mNum] || `Translation for Rigveda Mandala 1 Sukta ${sNum} Mantra ${mNum} placeholder.`;
        
        // Construct Mantra Object
        const mantraObj = {
          id: `RV_1.${sNum}.${mNum}`,
          mandala: 1,
          sukta: sNum,
          mantra: mNum,
          meter: meta.meter,
          deity: deity,
          rishi: meta.rishi,
          samhitapatha: cleanSamhita,
          padapatha: wordObjects,
          translation: {
            author: "Ralph T.H. Griffith",
            license: "Public Domain",
            fluid_text: translationText
          },
          commentary: {
            author: "Sāyaṇa",
            language: "sa",
            text: ""
          },
          token_mapping: tokenMapping
        };
        
        finalizedMantras.push(mantraObj);
        mNum++;
      }
      
      console.log(`Added ${mNum - 1} mantras for Sukta ${sNum}.`);
    }
    
    // Sort finalized mantras by mandala, sukta, mantra
    finalizedMantras.sort((a, b) => {
      if (a.sukta !== b.sukta) return a.sukta - b.sukta;
      return a.mantra - b.mantra;
    });
    
    // 5. Overwrite data/rv_1_1.json
    console.log(`Writing complete dataset to ${rvJsonPath}`);
    fs.writeFileSync(rvJsonPath, JSON.stringify(finalizedMantras, null, 2), 'utf-8');
    console.log("Success! Compilation and alignment complete.");
    
  } catch (err) {
    console.error("Error during execution:", err);
    process.exit(1);
  }
}

run();
