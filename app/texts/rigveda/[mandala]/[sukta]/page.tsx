"use client";

import Link from "next/link";
import { useState, use } from "react";
import rvData from "@/data/rv_1_1.json";

// Type definitions based on our JSON structure
interface PadaWord {
  word_index: number;
  pada: string;
  lemma: string;
  grammar: string;
  literal_meaning: string;
}

interface MantraData {
  id: string;
  mandala: number;
  sukta: number;
  mantra: number;
  meter: string;
  deity: string;
  rishi: string;
  samhitapatha: string;
  padapatha: PadaWord[];
  translation: {
    author: string;
    license: string;
    fluid_text: string;
  };
  commentary: {
    author: string;
    language: string;
    text: string;
  };
}

export default function RigvedaViewer({
  params,
}: {
  params: Promise<{ mandala: string; sukta: string }>;
}) {
  const resolvedParams = use(params);
  const mandala = parseInt(resolvedParams.mandala);
  const sukta = parseInt(resolvedParams.sukta);

  // Filter the data for the current mandala and sukta
  const mantras = (rvData as MantraData[]).filter(
    (m) => m.mandala === mandala && m.sukta === sukta
  );

  // Client States
  const [activeMantraIndex, setActiveMantraIndex] = useState<number>(0);
  const [selectedWords, setSelectedWords] = useState<PadaWord[]>([]);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<{
    mantraIndex: number;
    tokenIndex: number;
  } | null>(null);
  const [activeCommentaryTab, setActiveCommentaryTab] = useState<"sayana" | "metadata" | "license">("sayana");
  const [isInspectorOpenMobile, setIsInspectorOpenMobile] = useState<boolean>(false);

  // Get active mantra data
  const activeMantra = mantras[activeMantraIndex] || mantras[0];

  // Helper to split Samhitapatha into tokens
  const getSamhitaTokens = (samhitapatha: string) => {
    return samhitapatha.split(/\s+/).filter(Boolean);
  };

  // Helper to get Padapatha elements for a clicked Samhitapatha token
  // Returns list of 1-indexed word indices based on our manual mapping
  const getPadasForToken = (mantraIdx: number, tokenIdx: number): number[] => {
    const mapping: Record<number, Record<number, number[]>> = {
      0: { 0: [1, 2], 1: [3], 2: [4], 3: [5, 6], 5: [7], 6: [8] }, // Mantra 1
      1: { 0: [1], 1: [2, 3, 4], 2: [5, 6], 4: [7], 5: [8], 6: [9, 10], 7: [11] }, // Mantra 2
      2: { 0: [1], 1: [2, 3, 4, 5], 2: [6], 4: [7], 5: [8] }, // Mantra 3
      3: { 0: [1], 1: [2], 2: [3, 4], 3: [5], 4: [6, 7], 6: [8], 7: [9, 10], 8: [11] }, // Mantra 4
      4: { 0: [1, 2], 1: [3], 2: [4, 5], 4: [6], 5: [7, 8], 6: [9] }, // Mantra 5
      5: { 0: [1, 2], 1: [3], 2: [4, 5], 4: [6], 5: [7], 7: [8, 9, 10, 11, 12] }, // Mantra 6
      6: { 0: [1], 1: [2, 3], 2: [4], 3: [5, 6], 4: [7], 6: [8], 7: [9], 8: [10, 11] }, // Mantra 7
      7: { 0: [1, 2], 1: [3, 4], 2: [5], 4: [6], 5: [7], 6: [8] }, // Mantra 8
      8: { 0: [1], 1: [2], 2: [3], 3: [4, 5], 4: [6], 5: [7], 7: [8], 8: [9], 9: [10] }, // Mantra 9
    };
    return mapping[mantraIdx]?.[tokenIdx] || [];
  };

  // Handle Token Click
  const handleTokenClick = (
    mantraIdx: number,
    token: string,
    tokenIdx: number,
    mantra: MantraData
  ) => {
    // If it's punctuation, do nothing
    if (token === "।" || token === "॥") return;

    setActiveMantraIndex(mantraIdx);
    setSelectedTokenIndex({ mantraIndex: mantraIdx, tokenIndex: tokenIdx });

    const padaIndices = getPadasForToken(mantraIdx, tokenIdx);
    const words = mantra.padapatha.filter((w) =>
      padaIndices.includes(w.word_index)
    );

    setSelectedWords(words);
    setIsInspectorOpenMobile(true); // Open drawer on mobile
  };

  return (
    <main className="min-h-screen bg-[#fbfbf9] text-[#1c1917] font-sans flex flex-col selection:bg-amber-100">
      
      {/* Header */}
      <header className="px-6 py-4 border-b border-stone-200 bg-white/90 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-stone-500 hover:text-amber-700 transition-colors p-2 rounded-lg hover:bg-stone-100"
            title="Back to Home"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-base md:text-lg font-serif font-bold text-stone-800 uppercase tracking-wide">
              Rigveda Saṃhitā
            </h1>
            <p className="text-[10px] md:text-xs text-stone-400 font-medium">
              Digital Library of Indic Intellectual History
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200">
          <span className="text-xs font-semibold text-stone-600">
            Mandala {mandala}, Sukta {sukta}
          </span>
        </div>
      </header>

      {/* Workspace Grid */}
      <div className="flex-grow flex flex-col lg:flex-row relative">
        
        {/* Left Pane - Primary Reading Canvas */}
        <div className="flex-grow lg:w-2/3 p-6 md:p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-73px)] lg:max-h-[calc(100vh-73px)] border-r border-stone-200">
          
          <div className="max-w-3xl mx-auto space-y-8 pb-12">
            {mantras.map((mantra, mIdx) => {
              const tokens = getSamhitaTokens(mantra.samhitapatha);
              const isActiveMantra = activeMantraIndex === mIdx;

              return (
                <div
                  key={mantra.id}
                  onClick={() => setActiveMantraIndex(mIdx)}
                  className={`p-6 rounded-2xl border transition-all duration-300 bg-white cursor-pointer ${
                    isActiveMantra
                      ? "border-amber-500 shadow-md ring-1 ring-amber-500/25"
                      : "border-stone-200/80 hover:border-stone-300 hover:shadow-sm"
                  }`}
                >
                  {/* Mantra Info Header */}
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-100">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                      Mantra {mantra.mantra}
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium">
                      {mantra.meter} • {mantra.deity}
                    </span>
                  </div>

                  {/* Accented Samhitapatha rendering */}
                  <div className="mb-6 leading-relaxed">
                    <div className="flex flex-wrap gap-x-2 gap-y-3 font-deva text-2xl md:text-3xl text-stone-800 tracking-wide">
                      {tokens.map((token, tIdx) => {
                        const isSelectedToken =
                          selectedTokenIndex?.mantraIndex === mIdx &&
                          selectedTokenIndex?.tokenIndex === tIdx;

                        return (
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
                          >
                            {token}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fluid English Translation */}
                  <div className="text-stone-600 leading-relaxed font-serif text-base text-justify pl-3 border-l-2 border-stone-200">
                    {mantra.translation.fluid_text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Accordion - Traditional Apparatus */}
          <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden mt-8">
            <div className="flex border-b border-stone-200 bg-stone-50/50">
              <button
                onClick={() => setActiveCommentaryTab("sayana")}
                className={`flex-1 py-3.5 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                  activeCommentaryTab === "sayana"
                    ? "border-amber-500 text-stone-800 bg-white"
                    : "border-transparent text-stone-500 hover:text-stone-700"
                }`}
              >
                Sāyaṇa&apos;s Bhāṣya
              </button>
              <button
                onClick={() => setActiveCommentaryTab("metadata")}
                className={`flex-1 py-3.5 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                  activeCommentaryTab === "metadata"
                    ? "border-amber-500 text-stone-800 bg-white"
                    : "border-transparent text-stone-500 hover:text-stone-700"
                }`}
              >
                Mantra Apparatus
              </button>
              <button
                onClick={() => setActiveCommentaryTab("license")}
                className={`flex-1 py-3.5 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                  activeCommentaryTab === "license"
                    ? "border-amber-500 text-stone-800 bg-white"
                    : "border-transparent text-stone-500 hover:text-stone-700"
                }`}
              >
                License Info
              </button>
            </div>

            <div className="p-6 md:p-8 min-h-[150px]">
              {activeCommentaryTab === "sayana" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                      Classical Sanskrit Commentary (Mantra {activeMantra.mantra})
                    </h4>
                    <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      Commentator: Sāyaṇācārya
                    </span>
                  </div>
                  {activeMantra.commentary.text ? (
                    <p className="font-deva text-xl leading-loose text-stone-800 tracking-wide text-justify">
                      {activeMantra.commentary.text}
                    </p>
                  ) : (
                    <p className="text-sm text-stone-400 italic">
                      No commentary exists or has been transcribed for Mantra {activeMantra.mantra} in this release.
                    </p>
                  )}
                </div>
              )}

              {activeCommentaryTab === "metadata" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                      Deity (Devatā)
                    </span>
                    <strong className="text-stone-800 text-base font-serif">
                      {activeMantra.deity}
                    </strong>
                    <p className="text-xs text-stone-500 mt-2">
                      The divine aspect or force of nature invoked in this specific mantra.
                    </p>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                      Rishi (Seer)
                    </span>
                    <strong className="text-stone-800 text-base font-serif">
                      {activeMantra.rishi}
                    </strong>
                    <p className="text-xs text-stone-500 mt-2">
                      The ancient seer who originally perceived and composed this sacred verse.
                    </p>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                      Meter (Chandas)
                    </span>
                    <strong className="text-stone-800 text-base font-serif">
                      {activeMantra.meter}
                    </strong>
                    <p className="text-xs text-stone-500 mt-2">
                      The poetic structure and syllable pattern governing the chant.
                    </p>
                  </div>
                </div>
              )}

              {activeCommentaryTab === "license" && (
                <div className="space-y-3 text-sm text-stone-600">
                  <p>
                    <strong>Translation License:</strong> Creative Commons Attribution-ShareAlike 4.0 International ({activeMantra.translation.license}).
                  </p>
                  <p>
                    <strong>Translator:</strong> {activeMantra.translation.author}
                  </p>
                  <p className="text-xs text-stone-400">
                    This scholarly edition prioritizes philological accuracy. All digitized content is free to share and adapt under open-access guidelines.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Pane / Sidebar - Philological Inspector (Desktop view) */}
        <div className="hidden lg:block lg:w-1/3 bg-stone-100 p-6 overflow-y-auto max-h-[calc(100vh-73px)] border-l border-stone-200">
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
                  <div
                    key={word.word_index}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200/60"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-deva text-2xl text-stone-800 font-semibold">
                        {word.pada}
                      </span>
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                        Word #{word.word_index}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Lemma / Root */}
                      <div className="flex justify-between text-xs py-1.5 border-b border-stone-100">
                        <span className="text-stone-400 font-medium">Root Lemma</span>
                        <strong className="font-deva text-stone-700 text-sm">
                          {word.lemma}
                        </strong>
                      </div>

                      {/* Grammar breakdown */}
                      <div className="py-2 border-b border-stone-100">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                          Grammatical Properties
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

                      {/* Literal translation */}
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                          Literal Definition
                        </span>
                        <p className="text-sm text-stone-600 leading-relaxed font-serif">
                          {word.literal_meaning}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 px-6 border-2 border-dashed border-stone-300 rounded-2xl">
                <p className="text-sm text-stone-400 font-serif leading-relaxed">
                  Click on any Sanskrit word in the Samhitapatha to view its Padapatha alignment, root lemma, grammatical cases, and literal translation.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom drawer/sheet for Philological Inspector */}
        {isInspectorOpenMobile && selectedWords.length > 0 && (
          <div className="lg:hidden fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-end">
            <div className="w-full bg-[#fbfbf9] rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col border-t border-stone-200">
              
              {/* Drawer Handle / Header */}
              <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50 rounded-t-3xl">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">
                    Inspector
                  </h3>
                  <h4 className="text-sm font-bold text-stone-800 font-serif">
                    Word Breakdown
                  </h4>
                </div>
                <button
                  onClick={() => setIsInspectorOpenMobile(false)}
                  className="text-stone-400 hover:text-stone-700 text-2xl font-bold p-1 leading-none"
                >
                  &times;
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                {selectedWords.map((word) => (
                  <div
                    key={word.word_index}
                    className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-deva text-2xl text-stone-800 font-semibold">
                        {word.pada}
                      </span>
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                        Word #{word.word_index}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-xs py-1.5 border-b border-stone-100">
                        <span className="text-stone-400 font-medium">Root Lemma</span>
                        <strong className="font-deva text-stone-700 text-sm">
                          {word.lemma}
                        </strong>
                      </div>

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

                      <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                          Literal Definition
                        </span>
                        <p className="text-sm text-stone-600 leading-relaxed font-serif">
                          {word.literal_meaning}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
      </div>
    </main>
  );
}
