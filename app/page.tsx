"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

// Mock data for the homepage interactive sandbox
interface SandboxWord {
  pada: string;
  lemma: string;
  grammar: string;
  literal_meaning: string;
  sayana_gloss?: string;
}

const sandboxMantra = {
  id: "RV_1.1.1",
  tokens: ["अ॒ग्निमी॑ळे", "पु॒रोहि॑तं", "य॒ज्ञस्य॑", "दे॒वमृत्विज॑म्", "।", "होता॑रं", "रत्न॒धात॑मम्", "॥"],
  tokenPadas: {
    0: [
      { pada: "अ॒ग्निम्", lemma: "अग्नि", grammar: "noun, masc, acc, sg", literal_meaning: "to Fire / the Divine Light", sayana_gloss: "अग्निमग्रणीं यज्ञस्य प्रणेतारं यद्वा अङ्गति गच्छत्यन्तरिक्षमिति" },
      { pada: "ई॒ळे॒", lemma: "ईड्", grammar: "verb, present, middle, 1st pers, sg", literal_meaning: "I praise / I invoke", sayana_gloss: "स्तौमि । ईडि स्तुतिचोदनयाच्ञासु ।" }
    ],
    1: [
      { pada: "पु॒रः्ऽहि॑तम्", lemma: "पुरोहित", grammar: "noun, masc, acc, sg (compound)", literal_meaning: "placed foremost / the high priest", sayana_gloss: "यज्ञस्य पूर्वभाग एवेष्टाहवनीयरूपेण स्थितम् ।" }
    ],
    2: [
      { pada: "य॒ज्ञस्य॑", lemma: "यज्ञ", grammar: "noun, masc, gen, sg", literal_meaning: "of the sacrifice", sayana_gloss: "यजनीयस्य यज्ञादीनां कर्मणाम् ।" }
    ],
    3: [
      { pada: "दे॒वम्", lemma: "देव", grammar: "noun, masc, acc, sg", literal_meaning: "the divine / the shining one", sayana_gloss: "दानादिगुणयुक्तं द्योतमानं वा ।" },
      { pada: "ऋ॒त्विज॑म्", lemma: "ऋत्विज्", grammar: "noun, masc, acc, sg", literal_meaning: "the seasonal priest / minister", sayana_gloss: "ऋतुषु यजमानम् ।" }
    ],
    5: [
      { pada: "होता॑रम्", lemma: "होतृ", grammar: "noun, masc, acc, sg", literal_meaning: "the invoker / summoner", sayana_gloss: "देवानां ह्वातारं यद्वा होमनिष्पादकम् ।" }
    ],
    6: [
      { pada: "रत्न्ऽधा॑तमम्", lemma: "रत्नधातम", grammar: "adj, masc, acc, sg (superlative)", literal_meaning: "bestower of ultimate treasures", sayana_gloss: "यागफलरूपाणां रत्नानामतीव धारयितारम् ।" }
    ]
  } as Record<number, SandboxWord[]>
};

// ── SanskritKosha Multi-Dictionary Lexicon Data ─────────────────────────────
interface DictionaryEntry {
  mw: string;
  apte: string;
  macdonell: string;
  grassmann: string;
  sabdakalpadruma?: string;
}

const sanskritKoshaDict: Record<string, DictionaryEntry> = {
  "अग्नि": {
    mw: "m. fire, sacrificial fire (of three kinds, Gārhapatya, Āhavanīya, Dakṣiṇa); the god of fire, leader of the rites; (etymologically connected to Lat. ignis).",
    apte: "m. [अङ्गति ऊर्ध्वं गच्छति, अङ्ग-नि नस्य नेतम् ; अक्-नि वा Un.4.5] 1. Fire. 2. The god of fire. 3. Sacrificial fire. 4. Gastric fluid, digestive faculty.",
    macdonell: "m. fire; god Fire; sacrificial fire. (Vedic & Classical).",
    grassmann: "m. Feuer, insbesondre Opferfeuer; als Gott personificirt und als Vermittler zwischen Göttern und Menschen verehrt.",
    sabdakalpadruma: "अग्निः, पुं, (अङ्गति गच्छत्यर्च्चिषा । अङ्गि गत्यर्थे ‘अङ्गेर्नलोपश्च ।’ उणादि ४ । ५० । इति निप्रत्ययो नलोपश्च । यद्वा अगि गतौ इत्यस्मात् निप्रत्ययः ।) वह्निः ।"
  },
  "ईड्": {
    mw: "cl. 2. Ā. īṭṭe, to praise, commend, implore, request, ask for (RV. AV. ŚBr. etc.).",
    apte: "2 Ā. (ईट्टे, ईडित) 1. To praise, extol. 2. To beseech, solicit, implore.",
    macdonell: "v. praise, invoke, implore (chiefly Vedic).",
    grassmann: "flehen, anflehen, preisen, verehren (von Göttern und Gaben).",
    sabdakalpadruma: "ईड्, अदा० आत्म० सक० सेट् । स्तुतौ । इति कविकल्पद्रुमः ॥"
  },
  "पुरोहित": {
    mw: "mfn. placed foremost or in front, charged with a commission; m. a family priest, domestic chaplain (RV. AV. Br. etc.).",
    apte: "p. p. [पुरः-धा-क्त] 1. Placed in front. 2. Appointed. -तः A family priest, high priest (who conducts all rituals).",
    macdonell: "pp. placed in front; m. domestic priest of a prince/sacrificer.",
    grassmann: "m. der Vorgesetzte, insbesondre der priesterliche Beistand des Königs oder des Opfers.",
    sabdakalpadruma: "पुरोहितः, पुं, (पुरः पूर्व्वस्मिन् भागे इष्टाहवनीयरूपेण हितः स्थापितः ।) यज्ञादीनां नेता ।"
  },
  "यज्ञ": {
    mw: "m. (fr. yaj) worship, devotion, prayer, praise, act of worship, sacrifice, oblation (RV. etc.).",
    apte: "m. [यज्-नङ् 3.3.90] 1. A sacrifice, sacrificial rite. 2. An oblation. 3. Worship, devotion.",
    macdonell: "m. worship, sacrifice, sacrificial feast.",
    grassmann: "m. Opfer, Gottesdienst, Festaufzug (von yaj).",
    sabdakalpadruma: "यज्ञः, पुं, (यज्यते देवपूज्यादिकं क्रियतेऽनेन । यज् + ‘यजयाचयतविच्छप्रच्छरक्षो नङ् ।’ ३ । ३ । ९० । इति नङ् ।) देवपूजार्पणम् ।"
  },
  "देव": {
    mw: "mfn. (fr. div) heavenly, divine, terrestrial things of high excellence; m. a deity, god (RV. etc.).",
    apte: "m. [दीव्यति द्योतते वा, दिव्-अच्] 1. A deity, god, celestial being. 2. A king, ruler. 3. A cloud.",
    macdonell: "a. heavenly, divine; m. god, deity.",
    grassmann: "a. himmlisch, göttlich; m. Gott, himmlisches Wesen.",
    sabdakalpadruma: "देवः, पुं, (दीव्यतीति । दिव् क्रीडादिषु + ‘पचाद्यच् ।’ ३ । १ । १३४ । इति अच् ।) अमरः ।"
  },
  "ऋत्विज्": {
    mw: "m. (fr. ṛtu-ij, 'sacrificing at the proper season'), a priest, sacrificial priest (regularly 4 in number: Hotṛ, Adhvaryu, Brahman, Udgātṛ).",
    apte: "m. [ऋतौ यजति, ऋतु-यज्-क्विन्] A priest who officiates at a sacrifice.",
    macdonell: "m. priest officiating at a sacrifice (Hotri, Adhvaryu, etc.).",
    grassmann: "m. zu rechter Zeit opfernd; Priester, Opferpriester.",
    sabdakalpadruma: "ऋत्विक् [ज्], पुं, (ऋतौ यजतीति । ऋतु + यज् + ‘ऋत्विग्दधृगिति ।’ ३ । २ । ५९ । क्विन् ।) यज्वा ।"
  },
  "होतृ": {
    mw: "m. (fr. 1. hu or fr. hve) an offerer of an oblation, a sacrificer, priest who recites the Ṛgveda at a sacrifice.",
    apte: "m. [हु-तृच्] 1. A sacrificial priest, especially one who recites the prayers of the Rigveda. 2. An offerer.",
    macdonell: "m. caller, invoker (gods, esp. Agni); reciting priest in Vedic ritual.",
    grassmann: "m. Ausgiesser der Spende, Opferer, Priester.",
    sabdakalpadruma: "होता [तृ], पुं, (जुहोतीति । हु + तृच् । यद्वा ह्वयतीति । ह्वे + तृच् ।) यज्ञे देवानां ह्वाता ।"
  },
  "रत्नधातम": {
    mw: "mfn. (superlative of ratna-dhā) bestowing the ultimate/best treasures or wealth (chiefly said of Agni, RV. 1.1.1).",
    apte: "a. Bestowing ultimate riches, greatest holder or distributor of gems/precious things.",
    macdonell: "a. bestower of greatest treasures.",
    grassmann: "a. Schätze vertheilend, am meisten Schätze bringend.",
    sabdakalpadruma: "रत्नधातमः, पुं, (रत्नानां यागफलानामतीव धारयिता ।) अतिशयधनप्रदः ।"
  }
};

function getKoshaMeanings(lemma: string, literal: string): DictionaryEntry {
  const cleanedLemma = lemma.replace(/[-_ऽ]/g, "").trim();
  if (sanskritKoshaDict[cleanedLemma]) {
    return sanskritKoshaDict[cleanedLemma];
  }
  if (sanskritKoshaDict[lemma]) {
    return sanskritKoshaDict[lemma];
  }
  return {
    mw: `mfn. fr. root lemma [${lemma}] - ${literal}; attested in Rigveda Samhitā and ancient Brāhmaṇa literature.`,
    apte: `[${lemma}] 1. ${literal}. 2. Frequently used in Vedic ritualistic contexts and classical composition.`,
    macdonell: `${lemma} : ${literal} (Vedic root).`,
    grassmann: `${lemma} : (vedisch) ${literal}; see occurrences in RV Mandala 1.`,
    sabdakalpadruma: `${lemma}, (संस्कृतकोशः) धातुः । अर्थः — ${literal} ।`
  };
}

const xmlSnippet = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>Rigveda Samhitā - Mandala 1, Sukta 1</title>
      </titleStmt>
    </fileDesc>
  </teiHeader>
  <text>
    <body>
      <div type="sukta" n="1">
        <entry xml:id="RV_1.1.1">
          <usg type="meter">Gāyatrī</usg>
          <usg type="deity">Agni</usg>
          <form type="samhitapatha">अ॒ग्निमी॑ळे पु॒रोहि॑तं य॒ज्ञस्य॑ दे॒वमृत्विज॑म् ।</form>
          <gramGrp>
            <w lemma="agni" ana="noun, masc, acc, sg">अ॒ग्निम्</w>
            <w lemma="īḍ" ana="verb, present, middle, 1st pers, sg">ई॒ळे॒</w>
            <w lemma="purohita" ana="noun, masc, acc, sg">पु॒रः्ऽहि॑तम्</w>
          </gramGrp>
        </entry>
      </div>
    </body>
  </text>
</TEI>`;

const jsonSnippet = `{
  "id": "RV_1.1.1",
  "mandala": 1,
  "sukta": 1,
  "mantra": 1,
  "meter": "Gāyatrī",
  "deity": "Agni",
  "samhitapatha": "अ॒ग्निमी॑ळे पु॒रोहि॑तं य॒ज्ञस्य॑ दे॒वमृत्विज॑म् ।",
  "padapatha": [
    { "word_index": 1, "pada": "अ॒ग्निम्", "lemma": "अग्नि", "grammar": "noun, masc, acc, sg", "literal_meaning": "to Fire" },
    { "word_index": 2, "pada": "ई॒ळे॒", "lemma": "ईड्", "grammar": "verb, present, middle, 1st pers, sg", "literal_meaning": "I praise" }
  ]
}`;

export default function Home() {
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [selectedWords, setSelectedWords] = useState<SandboxWord[]>([]);
  const [codeTab, setCodeTab] = useState<"tei" | "json">("tei");
  const [copied, setCopied] = useState(false);

  const handleTokenClick = (idx: number, token: string) => {
    if (token === "।" || token === "॥") return;
    setSelectedToken(idx);
    setSelectedWords(sandboxMantra.tokenPadas[idx] || []);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeTab === "tei" ? xmlSnippet : jsonSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timelinePhases = [
    {
      phase: "Phase 1: Vedic Samhitas",
      timeline: "Q3 2026 – Q2 2027",
      status: "Active MVP",
      desc: "Complete encoding of Rigveda, Yajurveda, Samaveda, and Atharvaveda. Focuses on sandhi splitting, padapatha alignment, and morphological indexing.",
    },
    {
      phase: "Phase 2: Brāhmaṇas & Āraṇyakas",
      timeline: "Q3 2027 – Q4 2027",
      status: "Upcoming",
      desc: "Encoding of Śatapatha, Aitareya, and Taittirīya works. Establishing cross-references back to their corresponding Samhitās.",
    },
    {
      phase: "Phase 3: Principal Upaniṣads",
      timeline: "Q1 – Q4 2028",
      status: "Planned",
      desc: "Integration of early Upanishadic texts (Bṛhadāraṇyaka, Chāndogya, Īśā, Kaṭha, Kena) to trace the transition to Jñāna-kāṇḍa philosophy.",
    },
    {
      phase: "Phase 4: Śramaṇa Texts",
      timeline: "Q1 – Q4 2029",
      status: "Planned",
      desc: "Selected Buddhist Suttas (Dhammapada) and Jain Āgamas (Ācārāṅga) to map parallel metaphysics and ethical concepts like anātman and karma.",
    },
    {
      phase: "Phase 5: Classical Darśanas",
      timeline: "Q1 2030 – Q2 2031",
      status: "Planned",
      desc: "Expansion to Classical Sanskrit philosophical systems (Nyāya, Vaiśeṣika, Sāṃkhya-Yoga, Mīmāṃsā, Vedānta) and multi-lingual UI support.",
    },
  ];

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-amber-100 flex flex-col">
      {/* Sticky Top Navigation Bar */}
      <header className="px-6 md:px-12 py-4 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-md sticky top-0 z-50 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 transition-all">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-700">DLIIH</span>
          <h1 className="text-base md:text-lg font-serif tracking-wide font-bold text-stone-800">
            Digital Library of Indic Intellectual History
          </h1>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 items-center text-xs font-semibold uppercase tracking-wider">
          <Link href="/" className="text-stone-600 hover:text-amber-700 transition-colors">
            Home
          </Link>
          <Link href="/texts" className="text-amber-700 hover:text-amber-800 transition-colors font-bold">
            Corpus Viewer
          </Link>
          <a href="#sandbox" className="text-stone-600 hover:text-amber-700 transition-colors">
            Interactive Sandbox
          </a>
          <a href="#methodology" className="text-stone-600 hover:text-amber-700 transition-colors">
            Methodology
          </a>
          <a href="#xml-schema" className="text-stone-600 hover:text-amber-700 transition-colors">
            TEI/XML Schema
          </a>
          <a href="#roadmap" className="text-stone-600 hover:text-amber-700 transition-colors">
            Roadmap
          </a>
          <a
            href="https://github.com/sachit123H/rigveda-mvp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-600 hover:text-amber-700 transition-colors"
          >
            GitHub
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-grow">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-6 pt-12 pb-20 text-center max-w-5xl mx-auto">
          {/* Main Hero Artwork */}
          <div className="w-full max-w-4xl mb-12 relative group">
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-stone-200/80 bg-white p-3 transition-transform duration-500 hover:scale-[1.005]">
              <div className="relative h-[280px] md:h-[420px] w-full rounded-2xl overflow-hidden">
                <Image
                  src="/vedic_yajna_hero.png"
                  alt="Vedic Yajna Hero Illustration"
                  fill
                  style={{ objectFit: "cover" }}
                  className="opacity-95 group-hover:opacity-100 transition-opacity duration-500 scale-105 group-hover:scale-100"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/40 to-transparent"></div>
                <div className="absolute bottom-8 left-8 text-left text-white max-w-2xl pr-6">
                  <span className="bg-amber-500 text-stone-900 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-md mb-3 inline-block shadow-sm">
                    Phase 1 MVP Release
                  </span>
                  <h3 className="font-serif text-3xl md:text-4xl font-bold leading-tight text-white drop-shadow-md">
                    Vedic Agnihotra & The Sacred Fire
                  </h3>
                  <p className="text-stone-200 text-sm md:text-base mt-2 font-light drop-shadow">
                    A rigorous, open-source digital corpus mapping the evolution of ancient Indic philosophy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-serif mb-4 text-stone-850 leading-tight font-bold">
            The Earliest Layers of Indian Thought
          </h2>

          <div className="w-24 h-1.5 bg-amber-500 mb-12 rounded-full shadow-sm"></div>

          {/* Sanskrit Shloka: Elevated Premium Treatment */}
          <div className="w-full max-w-3xl mx-auto bg-gradient-to-r from-amber-50/90 via-amber-100/50 to-amber-50/90 border-l-4 border-r-4 border-amber-500 rounded-2xl px-8 py-10 shadow-lg mb-16 relative overflow-hidden">
            <div className="absolute top-2 left-4 text-6xl text-amber-300/40 font-serif select-none pointer-events-none">“</div>
            <div className="absolute bottom-2 right-4 text-6xl text-amber-300/40 font-serif select-none pointer-events-none">”</div>
            <p className="text-2xl md:text-3xl text-amber-950 font-deva leading-relaxed tracking-wide text-center select-none font-bold drop-shadow-sm">
              अ॒ग्निमी॑ळे पु॒रोहि॑तं य॒ज्ञस्य॑ दे॒वमृत्विज॑म् ।<br className="hidden sm:inline" />
              होता॑रं रत्न॒धात॑मम् ॥
            </p>
            <div className="mt-6 pt-4 border-t border-amber-200/80 flex flex-col items-center justify-center">
              <span className="text-sm font-serif text-amber-900 font-bold uppercase tracking-widest">
                Rigveda Saṃhitā 1.1.1
              </span>
              <span className="text-xs text-amber-700 italic mt-1">
                &ldquo;I invoke Agni, placed foremost as the divine minister of the sacrifice, the summoner, bestower of ultimate treasures.&rdquo;
              </span>
            </div>
          </div>

          <p className="text-base md:text-lg text-stone-600 mb-16 leading-relaxed max-w-3xl font-normal">
            DLIIH represents a pioneering effort in digital humanities to create a standardized, TEI/XML encoded corpus of ancient Indic philosophy, utilizing a strict top-down chronological approach.
          </p>

          {/* Call to Action Card: Refined & Cohesive Container */}
          <div className="w-full max-w-4xl bg-stone-900 text-stone-100 border border-stone-800 rounded-3xl p-10 shadow-2xl text-left flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex-grow z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Explore Primary Source Code</span>
              </div>
              <h3 className="text-3xl font-serif text-white font-bold tracking-wide">Rigveda Saṃhitā Viewer</h3>
              <p className="text-stone-300 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
                Interrogate metrical analysis, word-by-word padapatha grammar tags, and Sāyaṇa&apos;s classical commentaries side-by-side in our tactile digital portal.
              </p>
            </div>
            <div className="z-10 w-full md:w-auto flex-shrink-0">
              <Link
                href="/texts"
                className="block w-full md:w-auto px-9 py-5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 text-center tracking-wider text-sm uppercase"
              >
                Open Rigveda 1.1
              </Link>
            </div>
          </div>
        </section>

        {/* Sandbox Section (HCI "Show, Don't Tell" Sandbox) */}
        <section id="sandbox" className="py-24 px-6 bg-stone-100 border-t border-stone-200 shadow-inner">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 block mb-2">Live Interactive Sandbox</span>
              <h2 className="text-3xl md:text-4xl font-serif text-stone-900 font-bold">
                Experience Layered Disclosure in Real-Time
              </h2>
              <p className="text-stone-600 text-sm md:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
                Click any Sanskrit word in the verse below to instantly un-sandhi the Padapatha, inspect morphological tags, reveal Sāyaṇa&apos;s commentary, and cross-reference multi-dictionary SanskritKosha lexicons.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Sandbox Verse Reader */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-8 md:p-10 border border-stone-200 shadow-lg flex flex-col justify-center min-h-[220px]">
                <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
                  <span className="text-xs text-stone-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    Interactive Samhitapatha
                  </span>
                  <span className="text-[11px] font-mono bg-stone-100 text-stone-600 px-3 py-1 rounded-full font-semibold">RV 1.1.1</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-4 font-deva text-2xl md:text-4xl text-stone-850 tracking-wide leading-relaxed">
                  {sandboxMantra.tokens.map((token, idx) => {
                    const isSelected = selectedToken === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleTokenClick(idx, token)}
                        className={`px-2.5 py-1 rounded-xl transition-all duration-200 cursor-pointer ${
                          token === "।" || token === "॥"
                            ? "text-stone-400 cursor-default px-1"
                            : isSelected
                            ? "bg-amber-100 text-amber-950 font-bold border-b-4 border-amber-600 shadow-sm scale-105"
                            : "hover:bg-stone-100 text-stone-800 hover:text-amber-800 hover:scale-102"
                        }`}
                      >
                        {token}
                      </button>
                    );
                  })}
                </div>
                <span className="mt-8 text-xs text-stone-400 italic text-center block bg-stone-50 py-2 rounded-xl border border-stone-100">
                  💡 Tip: Try clicking on &ldquo;अ॒ग्निमी॑ळे&rdquo; or &ldquo;पु॒रोहि॑तं&rdquo; to observe real-time dynamic token splitting and dictionary aggregation.
                </span>
              </div>

              {/* Sandbox Inspector Result Panel */}
              <div className="lg:col-span-5 bg-stone-900 text-stone-100 rounded-3xl p-8 border border-stone-800 shadow-2xl flex flex-col min-h-[400px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>
                <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4">
                  <span className="text-xs text-stone-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                    Philological Inspector
                  </span>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded font-bold">REAL-TIME</span>
                </div>
                
                {selectedWords.length > 0 ? (
                  <div className="space-y-8 flex-grow overflow-y-auto max-h-[480px] pr-2 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
                    {selectedWords.map((word, wIdx) => {
                      const dictEntry = getKoshaMeanings(word.lemma, word.literal_meaning);
                      return (
                        <div key={wIdx} className="border-b border-stone-800 pb-8 last:border-0 last:pb-0 animate-fadeIn">
                          <div className="flex justify-between items-baseline mb-2">
                            <span className="font-deva text-2xl text-amber-300 font-semibold">{word.pada}</span>
                            <span className="text-[10px] bg-stone-800 text-stone-300 font-mono tracking-widest px-2 py-1 rounded border border-stone-700 font-bold">PADAPATHA</span>
                          </div>
                          <div className="text-xs text-stone-300 font-medium py-1 flex items-center gap-2">
                            <span className="text-stone-500 uppercase tracking-wider text-[10px]">Lemma Root:</span> 
                            <span className="font-deva text-white font-semibold bg-stone-800 px-2 py-0.5 rounded border border-stone-750">{word.lemma}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {word.grammar.split(",").map((g, gIdx) => (
                              <span key={gIdx} className="text-[10px] bg-amber-500/10 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/20 font-mono font-semibold">
                                {g.trim()}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3 bg-stone-950 p-3 rounded-xl border border-stone-850">
                            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Literal Translation</span>
                            <p className="text-sm text-stone-200 font-serif italic">
                              &ldquo;{word.literal_meaning}&rdquo;
                            </p>
                          </div>
                          {word.sayana_gloss && (
                            <div className="mt-3 bg-stone-950/60 p-3 rounded-xl border border-stone-850">
                              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block mb-1">Sāyaṇa Bhaṣya (Commentary)</span>
                              <p className="text-xs text-stone-300 font-deva leading-relaxed">
                                {word.sayana_gloss}
                              </p>
                            </div>
                          )}

                          {/* Multi-Dictionary SanskritKosha meanings */}
                          <div className="mt-4 pt-4 border-t border-stone-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                SanskritKosha Lexicons
                              </span>
                              <span className="text-[9px] font-bold text-stone-400 bg-stone-800 px-2 py-0.5 rounded border border-stone-750 uppercase tracking-wider">Multi-Source</span>
                            </div>

                            <div className="space-y-2.5 text-xs">
                              <div className="p-3 bg-stone-950 rounded-xl border border-stone-850 shadow-inner">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Monier-Williams (MW)</span>
                                <p className="text-stone-300 font-serif leading-relaxed">{dictEntry.mw}</p>
                              </div>
                              <div className="p-3 bg-stone-950 rounded-xl border border-stone-850 shadow-inner">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">V. S. Apte Practical Dictionary</span>
                                <p className="text-stone-300 font-serif leading-relaxed">{dictEntry.apte}</p>
                              </div>
                              <div className="p-3 bg-stone-950 rounded-xl border border-stone-850 shadow-inner">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Macdonell Vedic Dictionary</span>
                                <p className="text-stone-300 font-serif leading-relaxed">{dictEntry.macdonell}</p>
                              </div>
                              <div className="p-3 bg-stone-950 rounded-xl border border-stone-850 shadow-inner">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Grassmann Rigveda Wörterbuch</span>
                                <p className="text-stone-300 font-serif leading-relaxed">{dictEntry.grassmann}</p>
                              </div>
                              {dictEntry.sabdakalpadruma && (
                                <div className="p-3 bg-stone-950 rounded-xl border border-stone-850 shadow-inner">
                                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block mb-1">Śabdakalpadruma (शब्दकल्पद्रुमः)</span>
                                  <p className="text-stone-300 font-deva leading-relaxed text-sm">{dictEntry.sabdakalpadruma}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-stone-950/40 rounded-2xl border border-stone-850/60">
                    <svg className="w-12 h-12 text-stone-600 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                    <p className="text-sm text-stone-400 font-serif leading-relaxed">
                      Click any active Sanskrit word in the verse on the left to un-sandhi the Padapatha, reveal morphological tags, and look up multi-dictionary definitions in real-time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Methodology / Philosophy Section */}
        <section id="methodology" className="bg-stone-900 text-stone-50 py-24 px-8 md:px-16 border-t border-stone-800 relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-500 block mb-2">HCI Philosophy</span>
              <h2 className="text-3xl md:text-5xl font-serif mb-4 text-stone-100 font-bold">
                The Layered Disclosure Paradigm
              </h2>
              <p className="text-stone-400 text-center max-w-2xl mx-auto text-base leading-relaxed">
                Navigating ancient texts requires balancing academic rigor with an intuitive user experience. We employ an advanced Human-Computer Interaction (HCI) model to manage dense philological data without cognitive overload.
              </p>
            </div>

            {/* Scannable Side-by-Side Grid Comparisons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 text-sm md:text-base">
              {/* The Problem */}
              <div className="bg-stone-950/60 p-8 rounded-3xl border border-red-500/20 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-red-500/40 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-6 border-b border-stone-800 pb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-400 font-bold text-lg border border-red-500/20">✕</span>
                    <h4 className="font-serif text-xl font-bold text-stone-100 tracking-wide">The Problem: Cluttered Traditional Texts</h4>
                  </div>
                  <ul className="space-y-4 text-stone-400 text-sm md:text-base">
                    <li className="flex gap-3 items-start">
                      <span className="text-red-400 text-base mt-0.5">•</span>
                      <span><strong>Visual Overload:</strong> Printed editions and legacy websites clutter the visual field with massive, unformatted columns of commentary.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-red-400 text-base mt-0.5">•</span>
                      <span><strong>Fragmented Navigation:</strong> Footnotes and lexical registers are scattered across separate pages, appendices, or unlinked endnotes.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-red-400 text-base mt-0.5">•</span>
                      <span><strong>Opaque Phonetics:</strong> Continuous Sandhi-joined text (Samhitapatha) completely obscures individual word boundaries from students.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-red-400 text-base mt-0.5">•</span>
                      <span><strong>Disconnected Syntax:</strong> Lack of immediate morphological mapping makes analyzing archaic Vedic noun and verb inflections tedious.</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8 pt-4 border-t border-stone-800/80 text-xs text-stone-500 italic">
                  Results in high barrier-to-entry and fragmented research workflows.
                </div>
              </div>

              {/* The DLIIH Solution */}
              <div className="bg-gradient-to-b from-stone-950/80 to-stone-900/90 p-8 rounded-3xl border border-amber-500/30 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none"></div>
                <div>
                  <div className="flex items-center gap-3 mb-6 border-b border-stone-800 pb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-400 font-bold text-lg border border-green-500/20">✓</span>
                    <h4 className="font-serif text-xl font-bold text-stone-100 tracking-wide">The DLIIH Solution: Distraction-Free, Tactile Exploration</h4>
                  </div>
                  <ul className="space-y-4 text-stone-300 text-sm md:text-base">
                    <li className="flex gap-3 items-start">
                      <span className="text-green-400 text-base mt-0.5">•</span>
                      <span><strong>Pristine Reading Canvas:</strong> A distraction-free, beautifully typeset reading canvas by default, prioritizing the sacred verses.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-green-400 text-base mt-0.5">•</span>
                      <span><strong>Tactile Inspection:</strong> Interactive one-click exploration instantly resolves Sandhi splits and un-sandhied Padapatha tokens.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-green-400 text-base mt-0.5">•</span>
                      <span><strong>On-Demand Morphosyntax:</strong> Granular morphological matrices and grammatical tagging surface instantly in a dedicated micro-panel.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-green-400 text-base mt-0.5">•</span>
                      <span><strong>Synchronized Bhaṣya &amp; Kosha:</strong> Synchronized Sāyaṇa commentary and multi-dictionary lexicons dynamically update to reflect only the active selection.</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8 pt-4 border-t border-stone-800/80 text-xs text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Empowers absolute academic rigor with elegant UX.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* XML Schema Section */}
        <section id="xml-schema" className="py-24 px-6 bg-white border-t border-stone-200">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 block mb-2">Technical Foundations</span>
              <h2 className="text-3xl md:text-4xl font-serif text-stone-900 font-bold">
                TEI/XML Encoded Corpus
              </h2>
              <p className="text-stone-600 text-sm md:text-base mt-3 max-w-xl mx-auto leading-relaxed">
                Every verse and morphosyntactic token complies with Text Encoding Initiative (TEI) standards, establishing immediate credibility with comparative philologists and open-source contributors.
              </p>
            </div>

            {/* XML Snippet Showcase */}
            <div className="bg-stone-900 text-stone-200 rounded-3xl overflow-hidden border border-stone-850 shadow-2xl">
              {/* Terminal / Code Editor Header */}
              <div className="flex border-b border-stone-800 bg-stone-950 px-6 py-4 justify-between items-center">
                <div className="flex items-center gap-6">
                  {/* macOS window control buttons */}
                  <div className="flex gap-2 items-center">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
                  </div>
                  {/* Tab switchers */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCodeTab("tei")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                        codeTab === "tei" ? "bg-stone-800 text-amber-400 shadow-sm" : "text-stone-500 hover:text-stone-300"
                      }`}
                    >
                      TEI/XML Source
                    </button>
                    <button
                      onClick={() => setCodeTab("json")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                        codeTab === "json" ? "bg-stone-800 text-amber-400 shadow-sm" : "text-stone-500 hover:text-stone-300"
                      }`}
                    >
                      JSON Payload
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-mono text-stone-400 hidden sm:inline-block bg-stone-900 px-3 py-1 rounded-lg border border-stone-800">RV_1.1.1.{codeTab === "tei" ? "xml" : "json"}</span>
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white rounded-xl transition-colors border border-stone-700 flex items-center justify-center gap-1.5 text-xs font-medium"
                    title="Copy snippet"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="p-6 md:p-8 font-mono text-xs md:text-sm overflow-x-auto leading-relaxed text-stone-300 bg-stone-950/90 max-h-[400px]">
                <pre className="text-amber-100/90">{codeTab === "tei" ? xmlSnippet : jsonSnippet}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap / Timeline Section */}
        <section id="roadmap" className="py-24 px-8 md:px-16 bg-stone-100 border-t border-stone-200">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif mb-4 text-center text-stone-900 font-bold">
              5-Year Digital Humanities Roadmap
            </h2>
            <p className="text-stone-600 text-center mb-16 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              DLIIH is structured in progressive chronological layers, establishing rigorous standards and workflows before expanding.
            </p>

            <div className="relative border-l-2 border-stone-300 ml-4 md:ml-8 space-y-12">
              {timelinePhases.map((t, idx) => (
                <div key={idx} className="relative pl-8 md:pl-10 group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-stone-300 border-4 border-stone-100 group-hover:bg-amber-500 group-hover:border-amber-100 transition-colors duration-300"></div>

                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-200/80 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <h4 className="font-serif text-xl font-bold text-stone-900">{t.phase}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t.timeline}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm ${
                          t.status === "Active MVP" ? "bg-amber-100 text-amber-900 border border-amber-300/60" :
                          t.status === "Upcoming" ? "bg-stone-100 text-stone-700 border border-stone-200" : "bg-stone-50 text-stone-400 border border-stone-200/60"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-stone-600 text-base leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Premium Footer */}
      <footer className="py-16 border-t border-stone-200 bg-white px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col text-center md:text-left">
            <h4 className="font-serif font-bold text-stone-900 text-base uppercase tracking-widest">DLIIH</h4>
            <p className="text-stone-500 text-xs mt-1 font-medium">Digital Library of Indic Intellectual History</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-stone-500 font-semibold tracking-wider uppercase">
            <Link href="/texts" className="hover:text-amber-700 transition-colors">Corpus Viewer</Link>
            <span>•</span>
            <a href="#sandbox" className="hover:text-amber-700 transition-colors">Interactive Sandbox</a>
            <span>•</span>
            <a href="#methodology" className="hover:text-amber-700 transition-colors">Methodology</a>
            <span>•</span>
            <a href="https://github.com/sachit123H/rigveda-mvp" target="_blank" rel="noopener noreferrer" className="hover:text-amber-700 transition-colors">GitHub Repository</a>
          </div>
          <p className="text-stone-500 text-xs font-medium tracking-wide">
            © {new Date().getFullYear()} DLIIH. Creative Commons CC-BY-SA-4.0.
          </p>
        </div>
      </footer>
    </main>
  );
}
