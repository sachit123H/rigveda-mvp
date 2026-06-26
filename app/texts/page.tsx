"use client";

import Link from "next/link";
import { useState } from "react";

// Definitions of Vedas, Shakhas, Mandalas, and Suktas
interface VedaOption {
  id: string;
  name: string;
  sanskritName: string;
  desc: string;
  shakhas: { id: string; name: string }[];
  divisionType: "Mandala" | "Kāṇḍa" | "Prapāṭhaka";
  maxDivisions: number;
  maxSubdivisions: Record<number, number> | number; // maps division number to max subdivisions or a flat number
}

const vedaData: Record<string, VedaOption> = {
  rigveda: {
    id: "rigveda",
    name: "Rigveda",
    sanskritName: "ऋग्वेद",
    desc: "The Veda of praise, containing hymns of worship, philosophy, and cosmology addressed to Agni, Indra, Soma, and other deities.",
    shakhas: [
      { id: "sakala", name: "Śākala (शाकल)" },
      { id: "baskala", name: "Bāṣkala (बाष्कल)" },
    ],
    divisionType: "Mandala",
    maxDivisions: 10,
    maxSubdivisions: {
      1: 191, // Mandala 1 has 191 Suktas
      2: 43,
      3: 62,
      4: 58,
      5: 87,
      6: 75,
      7: 104,
      8: 103,
      9: 114,
      10: 191,
    },
  },
  yajurveda: {
    id: "yajurveda",
    name: "Yajurveda",
    sanskritName: "यजुर्वेद",
    desc: "The Veda of rituals and liturgy, containing instructions for the performance of fire sacrifices and ceremonial duties.",
    shakhas: [
      { id: "taittiriya", name: "Taittirīya (तैत्तिरीय)" },
      { id: "kanva", name: "Kāṇva (काण्व)" },
      { id: "madhyandina", name: "Mādhyandina (माध्यन्दिन)" },
    ],
    divisionType: "Kāṇḍa",
    maxDivisions: 7,
    maxSubdivisions: 8, // Flat 8 Prapathakas per Kanda
  },
  samaveda: {
    id: "samaveda",
    name: "Samaveda",
    sanskritName: "सामवेद",
    desc: "The Veda of melodies and chants, setting Rigvedic verses to musical notation for invocation during soma ceremonies.",
    shakhas: [
      { id: "kauthuma", name: "Kauthuma (कौथुम)" },
      { id: "jaiminiya", name: "Jaiminīya (जैमिनीय)" },
    ],
    divisionType: "Prapāṭhaka",
    maxDivisions: 6,
    maxSubdivisions: 10,
  },
  atharvaveda: {
    id: "atharvaveda",
    name: "Atharvaveda",
    sanskritName: "अथर्ववेद",
    desc: "The Veda of daily life and spells, containing incantations for healing, protection, success, and domestic harmony.",
    shakhas: [
      { id: "saunaka", name: "Śaunaka (शौनक)" },
      { id: "paippalada", name: "Paippalāda (पैप्पलाद)" },
    ],
    divisionType: "Kāṇḍa",
    maxDivisions: 20,
    maxSubdivisions: 10,
  },
};

export default function VedaSelectorPage() {
  const [step, setStep] = useState<number>(1);
  const [selectedVedaId, setSelectedVedaId] = useState<string>("");
  const [selectedShakhaId, setSelectedShakhaId] = useState<string>("");
  const [selectedDivision, setSelectedDivision] = useState<number>(1);
  const [selectedSubdivision, setSelectedSubdivision] = useState<number>(1);

  const selectedVeda = selectedVedaId ? vedaData[selectedVedaId] : null;
  const selectedShakha = selectedVeda?.shakhas.find((s) => s.id === selectedShakhaId);

  // Get max subdivisions for current selection
  const getMaxSubdivisions = () => {
    if (!selectedVeda) return 1;
    if (typeof selectedVeda.maxSubdivisions === "number") {
      return selectedVeda.maxSubdivisions;
    }
    return selectedVeda.maxSubdivisions[selectedDivision] || 1;
  };

  const handleVedaSelect = (id: string) => {
    setSelectedVedaId(id);
    setSelectedShakhaId("");
    setSelectedDivision(1);
    setSelectedSubdivision(1);
    setStep(2);
  };

  const handleShakhaSelect = (id: string) => {
    setSelectedShakhaId(id);
    setStep(3);
  };

  const handleDivisionSelect = (num: number) => {
    setSelectedDivision(num);
    setSelectedSubdivision(1);
    setStep(4);
  };

  const handleSubdivisionSelect = (num: number) => {
    setSelectedSubdivision(num);
  };

  const resetWizard = () => {
    setSelectedVedaId("");
    setSelectedShakhaId("");
    setSelectedDivision(1);
    setSelectedSubdivision(1);
    setStep(1);
  };

  const getSubdivisionName = (type: string) => {
    if (type === "Mandala") return "Sūkta";
    if (type === "Kāṇḍa") return "Prapāṭhaka / Anuvāka";
    return "Section / Hymn";
  };

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col selection:bg-amber-100">
      
      {/* Sticky Header */}
      <header className="px-8 py-5 border-b border-stone-200 bg-white sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-stone-500 hover:text-amber-700 transition-colors p-2 rounded-lg hover:bg-stone-100"
            title="Back to Home"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-base md:text-lg font-serif font-bold text-stone-800 uppercase tracking-wide">
              Veda Selection Portal
            </h1>
            <p className="text-[10px] text-stone-400 font-medium">
              Digital Library of Indic Intellectual History
            </p>
          </div>
        </div>

        <button
          onClick={resetWizard}
          className="text-xs font-bold uppercase tracking-wider text-stone-400 hover:text-amber-700 transition-all px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-white"
        >
          Reset Selection
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-grow max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-start">
        
        {/* Progress Tracker */}
        <div className="flex justify-between items-center mb-12 max-w-md mx-auto w-full text-xs font-bold uppercase tracking-widest text-stone-400">
          <span className={`${step >= 1 ? "text-amber-600 font-extrabold" : ""}`}>1. Veda</span>
          <span className="text-stone-300">&rarr;</span>
          <span className={`${step >= 2 ? "text-amber-600 font-extrabold" : ""}`}>2. Śākhā</span>
          <span className="text-stone-300">&rarr;</span>
          <span className={`${step >= 3 ? "text-amber-600 font-extrabold" : ""}`}>3. {selectedVeda?.divisionType || "Book"}</span>
          <span className="text-stone-300">&rarr;</span>
          <span className={`${step >= 4 ? "text-amber-600 font-extrabold" : ""}`}>4. {selectedVeda ? getSubdivisionName(selectedVeda.divisionType) : "Verse"}</span>
        </div>

        {/* STEP 1: Select Veda */}
        {step === 1 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-3xl font-serif text-stone-850 font-semibold">Select a Veda</h2>
              <p className="text-stone-500 text-sm mt-2">
                Begin your journey into the primary text structures of the Indic philosophical canon.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {Object.values(vedaData).map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleVedaSelect(v.id)}
                  className="p-8 bg-white border border-stone-200 rounded-2xl hover:border-amber-500/50 hover:shadow-xl transition-all duration-300 text-left group flex flex-col justify-between cursor-pointer min-h-[180px]"
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">{v.id}</span>
                      <span className="font-deva text-lg text-stone-400 group-hover:text-amber-600 transition-colors">
                        {v.sanskritName}
                      </span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
                      {v.name}
                    </h3>
                    <p className="text-stone-500 text-xs mt-3 leading-relaxed">
                      {v.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Select Shakha */}
        {step === 2 && selectedVeda && (
          <div className="space-y-8 animate-fadeIn max-w-xl mx-auto w-full">
            <div className="text-center">
              <button onClick={() => setStep(1)} className="text-xs text-stone-400 hover:text-stone-700 font-bold uppercase tracking-wider mb-2 block mx-auto">
                &larr; Back to Vedas
              </button>
              <h2 className="text-3xl font-serif text-stone-855 font-semibold">Select a Śākhā (Recension)</h2>
              <p className="text-stone-500 text-sm mt-2">
                Vedic texts were preserved in different regional recensions or schools. Select a historical branch.
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-8">
              {selectedVeda.shakhas.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleShakhaSelect(s.id)}
                  className="w-full p-6 bg-white border border-stone-200 rounded-xl hover:border-amber-500/50 hover:shadow-md transition-all text-left font-serif text-lg text-stone-700 flex justify-between items-center cursor-pointer group"
                >
                  <span className="group-hover:text-amber-700 transition-colors font-bold">{s.name}</span>
                  <span className="text-xs text-stone-400 font-bold group-hover:text-amber-500 transition-colors uppercase tracking-widest">Select Śākhā &rarr;</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Select Division (Mandala/Kanda/Prapathaka) */}
        {step === 3 && selectedVeda && (
          <div className="space-y-8 animate-fadeIn max-w-xl mx-auto w-full">
            <div className="text-center">
              <button onClick={() => setStep(2)} className="text-xs text-stone-400 hover:text-stone-700 font-bold uppercase tracking-wider mb-2 block mx-auto">
                &larr; Back to Śākhās
              </button>
              <h2 className="text-3xl font-serif text-stone-855 font-semibold">
                Select a {selectedVeda.divisionType}
              </h2>
              <p className="text-stone-500 text-sm mt-2">
                Choose the main structural division or book of the {selectedVeda.name}.
              </p>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-5 gap-3 mt-8">
              {Array.from({ length: selectedVeda.maxDivisions }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => handleDivisionSelect(num)}
                  className="py-4 border border-stone-200 rounded-lg hover:border-amber-500/50 hover:bg-white hover:shadow-sm transition-all text-center font-serif text-lg font-bold text-stone-700 bg-stone-50/50 cursor-pointer"
                >
                  <span className="block text-[9px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">
                    {selectedVeda.divisionType.slice(0, 4)}
                  </span>
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Select Subdivision (Sukta/Prapathaka) */}
        {step === 4 && selectedVeda && selectedShakha && (
          <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto w-full">
            <div className="text-center">
              <button onClick={() => setStep(3)} className="text-xs text-stone-400 hover:text-stone-700 font-bold uppercase tracking-wider mb-2 block mx-auto">
                &larr; Back to {selectedVeda.divisionType}s
              </button>
              <h2 className="text-3xl font-serif text-stone-855 font-semibold">
                Select a {getSubdivisionName(selectedVeda.divisionType)}
              </h2>
              <p className="text-stone-500 text-sm mt-2">
                Choose the target hymn or section inside {selectedVeda.divisionType} {selectedDivision}.
              </p>
            </div>

            {/* Selection Options */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm max-h-[300px] overflow-y-auto mt-6">
              <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
                {Array.from({ length: getMaxSubdivisions() }, (_, i) => i + 1).map((num) => {
                  const isSelected = selectedSubdivision === num;
                  return (
                    <button
                      key={num}
                      onClick={() => handleSubdivisionSelect(num)}
                      className={`py-3 rounded-lg text-center font-serif text-sm font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-100 text-amber-900 border-amber-500 font-extrabold shadow-xs"
                          : "border-stone-100 hover:border-amber-300 hover:bg-stone-50 text-stone-600"
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary & Exploration Button */}
            <div className="bg-stone-900 text-stone-50 rounded-2xl p-6 shadow-xl border border-stone-850 mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-left">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
                  Selected Configuration
                </span>
                <h4 className="font-serif text-xl font-bold text-stone-100">
                  {selectedVeda.name} ({selectedShakha.name})
                </h4>
                <p className="text-xs text-stone-400 mt-1">
                  {selectedVeda.divisionType} {selectedDivision} &bull; {getSubdivisionName(selectedVeda.divisionType)} {selectedSubdivision}
                </p>
              </div>
              <Link
                href={`/texts/${selectedVeda.id}/${selectedShakha.id}/${selectedDivision}/${selectedSubdivision}`}
                className="w-full md:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-stone-950 hover:text-stone-900 font-bold rounded-xl shadow-lg transition-all text-center tracking-wide text-xs uppercase"
              >
                Begin Exploration
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-stone-200 text-center bg-white">
        <p className="text-stone-400 text-xs font-medium tracking-wide">
          © {new Date().getFullYear()} Digital Library of Indic Intellectual History. Creative Commons CC-BY-SA-4.0.
        </p>
      </footer>
    </main>
  );
}
