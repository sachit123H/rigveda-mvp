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
}

const sandboxMantra = {
  id: "RV_1.1.1",
  tokens: ["अ॒ग्निमी॑ळे", "पु॒रोहि॑तं", "य॒ज्ञस्य॑", "दे॒वमृत्विज॑म्", "।", "होता॑रं", "रत्न॒धात॑मम्", "॥"],
  tokenPadas: {
    0: [
      { pada: "अ॒ग्निम्", lemma: "अग्नि", grammar: "noun, masc, acc, sg", literal_meaning: "to Fire / the Divine Light" },
      { pada: "ई॒ळे॒", lemma: "ईड्", grammar: "verb, present, middle, 1st pers, sg", literal_meaning: "I praise / I invoke" }
    ],
    1: [
      { pada: "पु॒रः्ऽहि॑तम्", lemma: "पुरोहित", grammar: "noun, masc, acc, sg (compound)", literal_meaning: "placed foremost / the high priest" }
    ],
    2: [
      { pada: "य॒ज्ञस्य॑", lemma: "यज्ञ", grammar: "noun, masc, gen, sg", literal_meaning: "of the sacrifice" }
    ],
    3: [
      { pada: "दे॒वम्", lemma: "देव", grammar: "noun, masc, acc, sg", literal_meaning: "the divine / the shining one" },
      { pada: "ऋ॒त्विज॑म्", lemma: "ऋत्विज्", grammar: "noun, masc, acc, sg", literal_meaning: "the seasonal priest / minister" }
    ],
    5: [
      { pada: "होता॑रम्", lemma: "होतृ", grammar: "noun, masc, acc, sg", literal_meaning: "the invoker / summoner" }
    ],
    6: [
      { pada: "रत्न्ऽधा॑तमम्", lemma: "रत्नधातम", grammar: "adj, masc, acc, sg (superlative)", literal_meaning: "bestower of ultimate treasures" }
    ]
  } as Record<number, SandboxWord[]>
};

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

  const handleTokenClick = (idx: number, token: string) => {
    if (token === "।" || token === "॥") return;
    setSelectedToken(idx);
    setSelectedWords(sandboxMantra.tokenPadas[idx] || []);
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
      <header className="px-6 md:px-12 py-5 border-b border-stone-200/60 bg-stone-50/80 backdrop-blur-md sticky top-0 z-20 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-700">DLIIH</span>
          <h1 className="text-md md:text-lg font-serif tracking-wide font-bold text-stone-800">
            Digital Library of Indic Intellectual History
          </h1>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 items-center text-xs font-semibold uppercase tracking-wider">
          <Link href="/" className="text-stone-600 hover:text-amber-700 transition-colors">
            Home
          </Link>
          <Link href="/texts" className="text-amber-700 hover:text-amber-800 transition-colors">
            Corpus Viewer
          </Link>
          <a href="#sandbox" className="text-stone-600 hover:text-amber-700 transition-colors">
            Interactive Sandbox
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
        <section className="flex flex-col items-center justify-center px-6 pt-16 pb-20 text-center max-w-5xl mx-auto">
          {/* Main Hero Artwork */}
          <div className="w-full max-w-4xl mb-12 relative group">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-stone-200/50 bg-white p-3 transition-transform duration-500 hover:scale-[1.005]">
              <div className="relative h-[250px] md:h-[400px] w-full rounded-xl overflow-hidden">
                <Image
                  src="/vedic_yajna_hero.png"
                  alt="Vedic Yajna Hero Illustration"
                  fill
                  style={{ objectFit: "cover" }}
                  className="opacity-95 group-hover:opacity-100 transition-opacity duration-500"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/65 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-left text-white max-w-xl">
                  <span className="bg-amber-500 text-stone-900 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 inline-block">
                    Phase 1 MVP Release
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl font-semibold leading-tight">
                    Vedic Agnihotra & The Sacred Fire
                  </h3>
                  <p className="text-stone-200 text-xs md:text-sm mt-2 font-light">
                    A rigorous, open-source digital corpus mapping the evolution of ancient Indic philosophy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-serif mb-4 text-stone-800 leading-tight">
            The Earliest Layers of Indian Thought
          </h2>

          <div className="w-20 h-1 bg-amber-500 mb-8 rounded-full"></div>

          {/* Sanskrit Shloka: Enhanced Treatment */}
          <div className="w-full max-w-2xl mx-auto bg-amber-50/60 border-l-4 border-amber-500 rounded-r-2xl px-6 py-6 shadow-sm mb-12">
            <p className="text-xl md:text-2xl text-amber-900 font-deva leading-loose tracking-wide text-center select-none font-semibold">
              अ॒ग्निमी॑ळे पु॒रोहि॑तं य॒ज्ञस्य॑ दे॒वमृत्विज॑म् ।<br className="hidden sm:inline" />
              होता॑रं रत्न॒धात॑मम् ॥
            </p>
            <span className="block text-center text-xs font-serif text-amber-700/80 mt-3 font-semibold uppercase tracking-wider">
              — Rigveda Saṃhitā 1.1.1
            </span>
          </div>

          <p className="text-base md:text-lg text-stone-600 mb-16 leading-relaxed max-w-3xl">
            DLIIH represents a pioneering effort in digital humanities to create a standardized, TEI/XML encoded corpus of ancient Indic philosophy, utilizing a strict top-down chronological approach.
          </p>

          {/* Call to Action Card */}
          <div className="w-full max-w-3xl bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-left flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-grow">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">Explore Primary Source Code</span>
              <h3 className="text-2xl font-serif text-stone-800 font-semibold">Rigveda Saṃhitā Viewer</h3>
              <p className="text-stone-500 text-sm mt-2 max-w-lg leading-relaxed">
                Interrogate metrical analysis, word-by-word padapatha grammar tags, and Sāyaṇa&apos;s classical commentaries side-by-side.
              </p>
            </div>
            <Link
              href="/texts"
              className="w-full md:w-auto px-8 py-4 bg-stone-900 hover:bg-amber-600 text-amber-50 hover:text-white font-medium rounded-xl shadow-md transition-all duration-300 hover:shadow-lg text-center tracking-wide text-sm uppercase"
            >
              Open Veda Portal
            </Link>
          </div>
        </section>

        {/* Sandbox Section (HCI "Show, Don't Tell" Sandbox) */}
        <section id="sandbox" className="py-24 px-6 bg-stone-100 border-t border-stone-200">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-2">Live Demo Sandbox</span>
              <h2 className="text-3xl md:text-4xl font-serif text-stone-800">
                Experience Layered Disclosure
              </h2>
              <p className="text-stone-500 text-sm md:text-base mt-2 max-w-xl mx-auto">
                Click a word in the verse below to resolve its sandhi division and review morphological tags dynamically.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {/* Sandbox Verse Reader */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-stone-200 shadow-sm flex flex-col justify-center min-h-[180px]">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-4 block">Interactive Samhitapatha</span>
                <div className="flex flex-wrap gap-x-2 gap-y-3 font-deva text-2xl md:text-3xl text-stone-800 tracking-wide">
                  {sandboxMantra.tokens.map((token, idx) => {
                    const isSelected = selectedToken === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleTokenClick(idx, token)}
                        className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                          token === "।" || token === "॥"
                            ? "text-stone-400 cursor-default"
                            : isSelected
                            ? "bg-amber-100 text-amber-900 font-bold border-b-2 border-amber-500"
                            : "hover:bg-stone-100 text-stone-800 hover:text-amber-700"
                        }`}
                      >
                        {token}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sandbox Inspector Result Panel */}
              <div className="bg-stone-900 text-stone-200 rounded-2xl p-6 border border-stone-850 flex flex-col min-h-[220px]">
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-4 block">Micro Inspector</span>
                
                {selectedWords.length > 0 ? (
                  <div className="space-y-4 flex-grow overflow-y-auto max-h-[200px]">
                    {selectedWords.map((word, wIdx) => (
                      <div key={wIdx} className="border-b border-stone-800 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-deva text-xl text-stone-100">{word.pada}</span>
                          <span className="text-[9px] text-amber-500 font-mono tracking-wider font-bold">PADAPATHA</span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-medium py-1">
                          Root: <span className="font-deva text-stone-300 text-xs ml-1">{word.lemma}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {word.grammar.split(",").map((g, gIdx) => (
                            <span key={gIdx} className="text-[9px] bg-stone-800 text-amber-400 px-2 py-0.5 rounded-full border border-stone-750">
                              {g.trim()}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-stone-300 font-serif mt-2 italic">
                          &ldquo;{word.literal_meaning}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-grow flex items-center justify-center text-center">
                    <p className="text-xs text-stone-500 font-serif px-4">
                      Click any active Sanskrit word on the left to reveal the philological inspector breakdown.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy & Scannability Section */}
        <section id="about" className="bg-stone-900 text-stone-50 py-24 px-8 md:px-16 border-t border-stone-800">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif mb-2 text-stone-100 text-center">
              The Layered Disclosure Paradigm
            </h2>
            <p className="text-stone-400 text-center max-w-lg mx-auto text-sm mb-12">
              Managing complex, deep linguistic datasets without cluttering the scholar&apos;s workspace.
            </p>

            {/* Scannable Grid Comparisons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm md:text-base">
              <div className="bg-stone-950/40 p-6 rounded-2xl border border-stone-800">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-red-400 text-lg font-bold">✕</span>
                  <h4 className="font-serif text-md font-bold text-stone-200 uppercase tracking-wider">The Traditional Overhead</h4>
                </div>
                <ul className="space-y-3 text-stone-400 text-xs md:text-sm list-disc list-inside">
                  <li>Textbooks cluttered with massive columns of commentary.</li>
                  <li>Footnotes scattered across separate pages or endnotes.</li>
                  <li>Sandhi-joined texts that hide individual word boundaries.</li>
                  <li>No immediate translation for individual grammatical tokens.</li>
                </ul>
              </div>

              <div className="bg-stone-950/70 p-6 rounded-2xl border border-amber-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-green-400 text-lg font-bold">✓</span>
                  <h4 className="font-serif text-md font-bold text-stone-200 uppercase tracking-wider">The DLIIH Solution</h4>
                </div>
                <ul className="space-y-3 text-stone-300 text-xs md:text-sm list-disc list-inside">
                  <li>A clean, distraction-free reading canvas by default.</li>
                  <li>Tactile one-click exploration of sandhi breaks and rules.</li>
                  <li>Granular morphological matrix data instantly visible on demand.</li>
                  <li>Connected commentary structures matching only active verses.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* XML Schema Section */}
        <section id="xml-schema" className="py-24 px-6 bg-white border-t border-stone-200">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-2">Technical Foundations</span>
              <h2 className="text-3xl md:text-4xl font-serif text-stone-800">
                TEI/XML Encoded Corpus
              </h2>
              <p className="text-stone-500 text-sm md:text-base mt-2 max-w-xl mx-auto">
                Every verse and morphosyntactic token complies with Text Encoding Initiative (TEI) standards.
              </p>
            </div>

            {/* XML Snippet Showcase */}
            <div className="bg-stone-900 text-stone-200 rounded-2xl overflow-hidden border border-stone-850 shadow-md">
              <div className="flex border-b border-stone-850 bg-stone-950 px-4 py-2 justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCodeTab("tei")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                      codeTab === "tei" ? "bg-stone-800 text-amber-400" : "text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    TEI/XML Source
                  </button>
                  <button
                    onClick={() => setCodeTab("json")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                      codeTab === "json" ? "bg-stone-800 text-amber-400" : "text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    JSON Payload
                  </button>
                </div>
                <span className="text-[10px] font-mono text-stone-500">RV_1.1.1.xml</span>
              </div>
              <div className="p-5 font-mono text-xs overflow-x-auto leading-relaxed text-stone-300 bg-stone-950/70 max-h-[300px]">
                <pre>{codeTab === "tei" ? xmlSnippet : jsonSnippet}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap / Timeline Section */}
        <section id="roadmap" className="py-24 px-8 md:px-16 bg-stone-100 border-t border-stone-200">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif mb-4 text-center text-stone-800">
              5-Year Digital Humanities Roadmap
            </h2>
            <p className="text-stone-500 text-center mb-16 max-w-xl mx-auto text-sm md:text-base">
              DLIIH is structured in progressive chronological layers, establishing rigorous standards and workflows before expanding.
            </p>

            <div className="relative border-l-2 border-stone-200/80 ml-4 md:ml-8 space-y-12">
              {timelinePhases.map((t, idx) => (
                <div key={idx} className="relative pl-8 group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-stone-200 border-4 border-stone-100 group-hover:bg-amber-500 group-hover:border-amber-100 transition-colors duration-300"></div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md transition-all duration-300">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <h4 className="font-serif text-lg font-bold text-stone-800">{t.phase}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{t.timeline}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          t.status === "Active MVP" ? "bg-amber-100 text-amber-800" :
                          t.status === "Upcoming" ? "bg-stone-100 text-stone-600" : "bg-stone-50 text-stone-400"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-stone-600 text-sm leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Premium Footer */}
      <footer className="py-12 border-t border-stone-200 bg-white px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col text-center md:text-left">
            <h4 className="font-serif font-bold text-stone-800 text-sm uppercase tracking-wider">DLIIH</h4>
            <p className="text-stone-400 text-xs mt-1">Digital Library of Indic Intellectual History</p>
          </div>
          <div className="flex gap-6 text-xs text-stone-400 font-medium tracking-wide">
            <Link href="/texts" className="hover:text-amber-700 transition-colors">Corpus Viewer</Link>
            <span>•</span>
            <a href="https://github.com/sachit123H/rigveda-mvp" target="_blank" rel="noopener noreferrer" className="hover:text-amber-700 transition-colors">GitHub Repository</a>
          </div>
          <p className="text-stone-400 text-xs font-medium tracking-wide">
            © {new Date().getFullYear()} DLIIH. Creative Commons CC-BY-SA-4.0.
          </p>
        </div>
      </footer>
    </main>
  );
}
