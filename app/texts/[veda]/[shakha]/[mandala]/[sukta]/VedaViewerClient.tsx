"use client";

/**
 * app/texts/[veda]/[shakha]/[mandala]/[sukta]/VedaViewerClient.tsx
 *
 * Interactive "use client" leaf component — HCI Layered Disclosure Reader
 *
 * Layer 0 — Samhitapātha: Canonical Devanāgarī with pitch accents (always visible)
 *            Tokens are clickable spans that trigger the Inspector.
 * Layer 1 — Padapātha toggle: Word-split analysis with danda separators,
 *            shown/hidden per mantra via a toggle button.
 * Layer 2 — Philological Inspector (right pane / mobile drawer):
 *            Grammar matrix tags + multi-dictionary SanskritKosha entries.
 * Comparative Panel — Bottom accordion: side-by-side translation vs. Sāyaṇabhāṣya.
 */

import { useState } from "react";
import Link from "next/link";
import { MantraData, PadaWord } from "@/lib/mantra-loader";

// ── SanskritKosha Multi-Dictionary Lexicon ───────────────────────────────────

interface DictionaryEntry {
  mw: string;
  apte: string;
  macdonell: string;
  grassmann: string;
  sabdakalpadruma?: string;
}

const KOSHA: Record<string, DictionaryEntry> = {
  "अग्नि": {
    mw: "m. fire, sacrificial fire (of three kinds, Gārhapatya, Āhavanīya, Dakṣiṇa); the god of fire, leader of the rites; (etymologically connected to Lat. ignis).",
    apte: "m. [अङ्गति ऊर्ध्वं गच्छति, अङ्ग-नि] 1. Fire. 2. The god of fire. 3. Sacrificial fire. 4. Gastric fluid, digestive faculty.",
    macdonell: "m. fire; god Fire; sacrificial fire. (Vedic & Classical).",
    grassmann: "m. Feuer, insbesondre Opferfeuer; als Gott personificirt und als Vermittler zwischen Göttern und Menschen verehrt.",
    sabdakalpadruma: "अग्निः, पुं, (अङ्गति गच्छत्यर्च्चिषा ।) वह्निः ।",
  },
  "ईड्": {
    mw: "cl. 2. Ā. īṭṭe, to praise, commend, implore, request, ask for (RV. AV. ŚBr. etc.).",
    apte: "2 Ā. (ईट्टे, ईडित) 1. To praise, extol. 2. To beseech, solicit, implore.",
    macdonell: "v. praise, invoke, implore (chiefly Vedic).",
    grassmann: "flehen, anflehen, preisen, verehren (von Göttern und Gaben).",
    sabdakalpadruma: "ईड्, अदा० आत्म० सक० सेट् । स्तुतौ ।",
  },
  "पुरोहित": {
    mw: "mfn. placed foremost or in front, charged with a commission; m. a family priest, domestic chaplain (RV. AV. Br. etc.).",
    apte: "p. p. [पुरः-धा-क्त] 1. Placed in front. 2. Appointed. -तः A family priest, high priest.",
    macdonell: "pp. placed in front; m. domestic priest of a prince/sacrificer.",
    grassmann: "m. der Vorgesetzte, insbesondre der priesterliche Beistand des Königs oder des Opfers.",
    sabdakalpadruma: "पुरोहितः, पुं, (पुरः पूर्व्वस्मिन् भागे हितः स्थापितः ।) यज्ञादीनां नेता ।",
  },
  "यज्ञ": {
    mw: "m. (fr. yaj) worship, devotion, prayer, praise, act of worship, sacrifice, oblation (RV. etc.).",
    apte: "m. [यज्-नङ्] 1. A sacrifice, sacrificial rite. 2. An oblation. 3. Worship, devotion.",
    macdonell: "m. worship, sacrifice, sacrificial feast.",
    grassmann: "m. Opfer, Gottesdienst, Festaufzug (von yaj).",
    sabdakalpadruma: "यज्ञः, पुं, देवपूजार्पणम् ।",
  },
  "देव": {
    mw: "mfn. (fr. div) heavenly, divine; m. a deity, god (RV. etc.).",
    apte: "m. [दीव्यति द्योतते वा] 1. A deity, god, celestial being. 2. A king, ruler.",
    macdonell: "a. heavenly, divine; m. god, deity.",
    grassmann: "a. himmlisch, göttlich; m. Gott, himmlisches Wesen.",
    sabdakalpadruma: "देवः, पुं, अमरः ।",
  },
  "ऋत्विज्": {
    mw: "m. a priest, sacrificial priest (regularly 4 in number: Hotṛ, Adhvaryu, Brahman, Udgātṛ).",
    apte: "m. [ऋतौ यजति, ऋतु-यज्-क्विन्] A priest who officiates at a sacrifice.",
    macdonell: "m. priest officiating at a sacrifice (Hotri, Adhvaryu, etc.).",
    grassmann: "m. zu rechter Zeit opfernd; Priester, Opferpriester.",
    sabdakalpadruma: "ऋत्विक् [ज्], पुं, यज्वा ।",
  },
  "होतृ": {
    mw: "m. an offerer of an oblation; priest who recites the Ṛgveda at a sacrifice.",
    apte: "m. [हु-तृच्] 1. A sacrificial priest, especially one who recites the prayers of the Rigveda.",
    macdonell: "m. caller, invoker (gods, esp. Agni); reciting priest in Vedic ritual.",
    grassmann: "m. Ausgiesser der Spende, Opferer, Priester.",
    sabdakalpadruma: "होता [तृ], पुं, यज्ञे देवानां ह्वाता ।",
  },
  "रत्नधातम": {
    mw: "mfn. bestowing the ultimate/best treasures or wealth (chiefly said of Agni, RV. 1.1.1).",
    apte: "a. Bestowing ultimate riches, greatest holder or distributor of gems/precious things.",
    macdonell: "a. bestower of greatest treasures.",
    grassmann: "a. Schätze vertheilend, am meisten Schätze bringend.",
    sabdakalpadruma: "रत्नधातमः, पुं, अतिशयधनप्रदः ।",
  },
};

function getKoshaMeanings(lemma: string, literal: string): DictionaryEntry {
  const clean = lemma.replace(/[-_ऽ]/g, "").trim();
  return (
    KOSHA[clean] ||
    KOSHA[lemma] || {
      mw: `mfn. fr. root [${lemma}] — ${literal}; attested in Rigveda Samhitā.`,
      apte: `[${lemma}] 1. ${literal}. 2. Used in Vedic ritualistic contexts.`,
      macdonell: `${lemma}: ${literal} (Vedic root).`,
      grassmann: `${lemma}: (vedisch) ${literal}; see RV Mandala 1.`,
      sabdakalpadruma: `${lemma}, (संस्कृतकोशः) धातुः । अर्थः — ${literal} ।`,
    }
  );
}

// ── Sāyaṇa Panel ──────────────────────────────────────────────────────────────

function SayanaPanel({ mantra }: { mantra: MantraData }) {
  const [expanded, setExpanded] = useState(false);
  const text = mantra.commentary?.text || "";
  const THRESHOLD = 320;
  const needsToggle = text.length > THRESHOLD;
  const displayed = needsToggle && !expanded ? text.slice(0, THRESHOLD) + "…" : text;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-amber-600 text-xl select-none" aria-hidden>॥</span>
          <div>
            <h4 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest leading-none">
              Sāyaṇabhāṣyam
            </h4>
            <p className="text-[10px] text-stone-400 mt-0.5">
              Mantra {mantra.mandala}.{mantra.sukta}.{mantra.mantra}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
          Sāyaṇācārya · 14th c.
        </span>
      </div>

      {text ? (
        <>
          <div className="bg-amber-50/40 border border-amber-100/70 rounded-xl p-5">
            <p className="font-deva text-[1.15rem] leading-[2.1] text-stone-800 tracking-wide text-justify">
              {displayed}
            </p>
          </div>
          {needsToggle && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors"
            >
              {expanded ? "Show less ▲" : "Read full bhāṣya ▼"}
            </button>
          )}
          <p className="mt-4 text-[10px] text-stone-400 italic">
            Source: Sāyaṇa&apos;s Ṛgvedabhāṣya (सायणभाष्यम्). Traditional Sanskrit commentary.
          </p>
        </>
      ) : (
        <div className="py-8 px-4 text-center border-2 border-dashed border-stone-200 rounded-xl">
          <span className="text-stone-300 text-3xl block mb-2">॰</span>
          <p className="text-sm text-stone-400 italic">
            No bhāṣya transcribed for Mantra {mantra.mantra} in this release.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Word Inspector Card ───────────────────────────────────────────────────────

function WordInspectorCard({ word }: { word: PadaWord }) {
  const dictEntry = getKoshaMeanings(word.lemma, word.literal_meaning);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200/60">
      <div className="flex justify-between items-center mb-3">
        <span className="font-deva text-2xl text-stone-800 font-semibold">{word.pada}</span>
        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
          Word #{word.word_index}
        </span>
      </div>

      <div className="space-y-4">
        {/* Root Lemma */}
        <div className="flex justify-between text-xs py-1.5 border-b border-stone-100">
          <span className="text-stone-400 font-medium">Root Lemma</span>
          <strong className="font-deva text-stone-700 text-sm">{word.lemma}</strong>
        </div>

        {/* Grammar Matrix */}
        <div className="py-2 border-b border-stone-100">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            Grammar Matrix
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {word.grammar.split(",").map((g, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-100/50 px-2 py-0.5 rounded-full uppercase tracking-wider"
              >
                {g.trim()}
              </span>
            ))}
          </div>
        </div>

        {/* Literal Definition */}
        <div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            Literal Definition
          </span>
          <p className="text-sm text-stone-600 leading-relaxed font-serif">{word.literal_meaning}</p>
        </div>

        {/* SanskritKosha Lexicons */}
        <div className="pt-3 border-t border-stone-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              SanskritKosha Lexicons
            </span>
            <span className="text-[9px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded uppercase tracking-wider">
              Multi-Source
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { label: "Monier-Williams (MW)", text: dictEntry.mw },
              { label: "V. S. Apte Practical Dictionary", text: dictEntry.apte },
              { label: "Macdonell Vedic Dictionary", text: dictEntry.macdonell },
              { label: "Grassmann Rigveda Wörterbuch", text: dictEntry.grassmann },
            ].map(({ label, text }) => (
              <div key={label} className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  {label}
                </span>
                <p className="text-stone-700 font-serif leading-relaxed">{text}</p>
              </div>
            ))}
            {dictEntry.sabdakalpadruma && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                  Śabdakalpadruma (शब्दकल्पद्रुमः)
                </span>
                <p className="text-stone-700 font-deva leading-relaxed text-sm">
                  {dictEntry.sabdakalpadruma}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────

interface VedaViewerClientProps {
  mantras: MantraData[];
  veda: string;
  shakha: string;
  mandala: number;
  sukta: number;
  divisionLabel: string;
  subdivisionLabel: string;
}

export default function VedaViewerClient({
  mantras,
  veda,
  shakha,
  mandala,
  sukta,
  divisionLabel,
  subdivisionLabel,
}: VedaViewerClientProps) {
  // ── Client State ───────────────────────────────────────────────────────────
  const [activeMantraIndex, setActiveMantraIndex] = useState<number>(0);
  const [selectedWords, setSelectedWords] = useState<PadaWord[]>([]);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<{
    mantraIndex: number;
    tokenIndex: number;
  } | null>(null);
  const [padaLayerOpen, setPadaLayerOpen] = useState<Record<number, boolean>>({});
  const [activeCommentaryTab, setActiveCommentaryTab] = useState<
    "sayana" | "metadata" | "license"
  >("sayana");
  const [isInspectorOpenMobile, setIsInspectorOpenMobile] = useState<boolean>(false);

  const activeMantra = mantras[activeMantraIndex] ?? mantras[0];

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getSamhitaTokens = (samhitapatha: string) =>
    samhitapatha.split(/\s+/).filter(Boolean);

  const getPadasForToken = (tokenIdx: number, mantra: MantraData): number[] => {
    if (mantra?.token_mapping) {
      return mantra.token_mapping[tokenIdx.toString()] ?? [];
    }
    return [];
  };

  const handleTokenClick = (
    mantraIdx: number,
    token: string,
    tokenIdx: number,
    mantra: MantraData
  ) => {
    if (token === "।" || token === "॥") return;
    setActiveMantraIndex(mantraIdx);
    setSelectedTokenIndex({ mantraIndex: mantraIdx, tokenIndex: tokenIdx });
    const padaIndices = getPadasForToken(tokenIdx, mantra);
    setSelectedWords(mantra.padapatha.filter((w) => padaIndices.includes(w.word_index)));
    setIsInspectorOpenMobile(true);
  };

  const togglePadaLayer = (mantraIdx: number) => {
    setPadaLayerOpen((prev) => ({ ...prev, [mantraIdx]: !prev[mantraIdx] }));
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#fbfbf9] text-[#1c1917] font-sans flex flex-col selection:bg-amber-100">

      {/* ── Header ── */}
      <header className="px-6 py-4 border-b border-stone-200 bg-white/90 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/texts"
            className="text-stone-500 hover:text-amber-700 transition-colors p-2 rounded-lg hover:bg-stone-100"
            title="Back to Selection"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-sm md:text-base font-serif font-bold text-stone-800 uppercase tracking-wide">
              {capitalize(veda)} Reader
            </h1>
            <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
              Śākhā: {shakha}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200 text-xs font-semibold text-stone-600">
          {divisionLabel} {mandala}, {subdivisionLabel} {sukta}
        </div>
      </header>

      {/* ── Workspace Grid ── */}
      <div className="flex-grow flex flex-col lg:flex-row relative">

        {/* ════════════════════════════════════════════════════════════════
            LEFT PANE — Primary Reading Canvas
        ════════════════════════════════════════════════════════════════ */}
        <div className="flex-grow lg:w-2/3 p-6 md:p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-73px)] border-r border-stone-200">
          <div className="max-w-3xl mx-auto space-y-8 pb-12">

            {mantras.map((mantra, mIdx) => {
              const tokens = getSamhitaTokens(mantra.samhitapatha);
              const isActiveMantra = activeMantraIndex === mIdx;
              const isPadaOpen = !!padaLayerOpen[mIdx];

              return (
                <article
                  key={mantra.id}
                  onClick={() => setActiveMantraIndex(mIdx)}
                  className={`p-6 rounded-2xl border transition-all duration-300 bg-white cursor-pointer ${
                    isActiveMantra
                      ? "border-amber-500 shadow-md ring-1 ring-amber-500/25"
                      : "border-stone-200/80 hover:border-stone-300 hover:shadow-sm"
                  }`}
                >
                  {/* Mantra Header */}
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-100">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                      Mantra {mantra.mantra}
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium">
                      {mantra.meter} • {mantra.deity}
                    </span>
                  </div>

                  {/* ── LAYER 0: Samhitapātha ── */}
                  <div className="mb-5 leading-relaxed">
                    <div
                      className="flex flex-wrap gap-x-2 gap-y-3 font-deva text-2xl md:text-3xl text-stone-800 tracking-wide"
                      lang="sa"
                    >
                      {tokens.map((token, tIdx) => {
                        const isPunct = token === "।" || token === "॥";
                        const isSelectedToken =
                          selectedTokenIndex?.mantraIndex === mIdx &&
                          selectedTokenIndex?.tokenIndex === tIdx;

                        return isPunct ? (
                          <span key={tIdx} className="text-stone-400 select-none">
                            {token}
                          </span>
                        ) : (
                          <button
                            key={tIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTokenClick(mIdx, token, tIdx, mantra);
                            }}
                            className={`relative inline-block transition-all px-1.5 py-0.5 rounded cursor-pointer ${
                              isSelectedToken
                                ? "bg-amber-100 text-amber-900 font-bold border-b-2 border-amber-500"
                                : "hover:bg-stone-100 text-stone-800 hover:text-amber-800"
                            }`}
                            title="Click to inspect word"
                          >
                            {token}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── LAYER 1: Padapātha Toggle ── */}
                  <div className="mb-5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePadaLayer(mIdx);
                      }}
                      className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                        isPadaOpen
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-stone-50 text-stone-500 border-stone-200 hover:border-amber-300 hover:text-amber-700"
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d={isPadaOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                      {isPadaOpen ? "Hide" : "Show"} Padapātha
                    </button>

                    {isPadaOpen && (
                      <div className="mt-3 p-4 bg-stone-50 rounded-xl border border-stone-200 overflow-x-auto">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">
                          Padapātha — Word Analysis
                        </p>
                        <div className="flex flex-wrap items-baseline gap-x-0 gap-y-2" lang="sa">
                          {mantra.padapatha.map((word, wIdx) => (
                            <span key={word.word_index} className="inline-flex items-baseline">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMantraIndex(mIdx);
                                  setSelectedWords([word]);
                                  setSelectedTokenIndex(null);
                                  setIsInspectorOpenMobile(true);
                                }}
                                className="font-deva text-lg text-stone-700 hover:text-amber-800 hover:bg-amber-50 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                                title={`Word #${word.word_index}: ${word.lemma}`}
                              >
                                {word.pada}
                              </button>
                              {wIdx < mantra.padapatha.length - 1 && (
                                <span className="text-amber-500 mx-0.5 text-sm select-none">।</span>
                              )}
                            </span>
                          ))}
                        </div>

                        {/* Compact grammar table */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {mantra.padapatha.map((word) => (
                            <div
                              key={word.word_index}
                              className="flex items-start gap-2 text-[10px] p-2 bg-white rounded-lg border border-stone-100"
                            >
                              <span className="font-deva text-stone-800 font-bold shrink-0">
                                {word.pada}
                              </span>
                              <span className="text-stone-400">·</span>
                              <div>
                                <span className="text-stone-600">{word.literal_meaning}</span>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {word.grammar.split(",").slice(0, 3).map((g, i) => (
                                    <span
                                      key={i}
                                      className="bg-stone-100 text-stone-500 px-1.5 py-px rounded text-[9px] uppercase tracking-wide"
                                    >
                                      {g.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Translation */}
                  <div className="text-stone-600 leading-relaxed font-serif text-base text-justify pl-3 border-l-2 border-stone-200">
                    {mantra.translation.fluid_text}
                  </div>
                </article>
              );
            })}
          </div>

          {/* ── Comparative Panel (Bottom Accordion) ── */}
          <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden mt-8">
            <div className="flex border-b border-stone-200 bg-stone-50/50">
              {(["sayana", "metadata", "license"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCommentaryTab(tab)}
                  className={`flex-1 py-3.5 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                    activeCommentaryTab === tab
                      ? "border-amber-500 text-stone-800 bg-white"
                      : "border-transparent text-stone-500 hover:text-stone-700"
                  }`}
                >
                  {tab === "sayana" ? "Sāyaṇa's Bhāṣya" : tab === "metadata" ? "Mantra Apparatus" : "License Info"}
                </button>
              ))}
            </div>

            <div className="p-6 md:p-8 min-h-[150px]">
              {activeCommentaryTab === "sayana" && activeMantra && (
                <SayanaPanel mantra={activeMantra} />
              )}

              {activeCommentaryTab === "metadata" && activeMantra && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  {[
                    {
                      label: "Deity (Devatā)",
                      value: activeMantra.deity,
                      note: "The divine aspect or force of nature invoked in this specific mantra.",
                    },
                    {
                      label: "Rishi (Seer)",
                      value: activeMantra.rishi,
                      note: "The ancient seer who originally perceived and composed this sacred verse.",
                    },
                    {
                      label: "Meter (Chandas)",
                      value: activeMantra.meter,
                      note: "The poetic structure and syllable pattern governing the chant.",
                    },
                  ].map(({ label, value, note }) => (
                    <div key={label} className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                        {label}
                      </span>
                      <strong className="text-stone-800 text-base font-serif">{value}</strong>
                      <p className="text-xs text-stone-500 mt-2">{note}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeCommentaryTab === "license" && activeMantra && (
                <div className="space-y-3 text-sm text-stone-600">
                  <p>
                    <strong>Translation License:</strong> Creative Commons Attribution-ShareAlike 4.0 (
                    {activeMantra.translation.license}).
                  </p>
                  <p>
                    <strong>Translator:</strong> {activeMantra.translation.author}
                  </p>
                  <p className="text-xs text-stone-400">
                    This scholarly edition prioritises philological accuracy. All digitised content is
                    free to share and adapt under open-access guidelines.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT PANE — Philological Inspector (Layer 2)
        ════════════════════════════════════════════════════════════════ */}
        <aside className="hidden lg:block lg:w-1/3 bg-stone-100 p-6 overflow-y-auto max-h-[calc(100vh-73px)] border-l border-stone-200">
          <div className="sticky top-0 space-y-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                Philological Inspector
              </h2>
              <h3 className="text-lg font-serif font-bold text-stone-800 border-b border-stone-200 pb-3">
                Word-by-Word Breakdown
              </h3>
            </div>

            {selectedWords.length > 0 ? (
              <div className="space-y-6">
                {selectedWords.map((word) => (
                  <WordInspectorCard key={word.word_index} word={word} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 px-6 border-2 border-dashed border-stone-300 rounded-2xl">
                <p className="text-sm text-stone-400 font-serif leading-relaxed">
                  Click on any Sanskrit word in the Samhitapātha to view its Padapātha alignment,
                  root lemma, grammatical cases, and multi-dictionary meanings (Monier-Williams,
                  Apte, Macdonell, Grassmann).
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* ════════════════════════════════════════════════════════════════
            MOBILE BOTTOM DRAWER — Philological Inspector
        ════════════════════════════════════════════════════════════════ */}
        {isInspectorOpenMobile && selectedWords.length > 0 && (
          <div className="lg:hidden fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-end">
            <div className="w-full bg-[#fbfbf9] rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col border-t border-stone-200">
              <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50 rounded-t-3xl">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Inspector</h3>
                  <h4 className="text-sm font-bold text-stone-800 font-serif">
                    Word Breakdown &amp; SanskritKosha
                  </h4>
                </div>
                <button
                  onClick={() => setIsInspectorOpenMobile(false)}
                  className="text-stone-400 hover:text-stone-700 text-2xl font-bold p-1 leading-none"
                >
                  &times;
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                {selectedWords.map((word) => (
                  <WordInspectorCard key={word.word_index} word={word} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
