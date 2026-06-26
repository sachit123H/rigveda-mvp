import Link from "next/link";
import Image from "next/image";

export default function Home() {
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
      {/* Premium Header */}
      <header className="px-8 md:px-12 py-6 border-b border-stone-200/60 bg-stone-50/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-widest uppercase text-amber-700">DLIIH</span>
          <h1 className="text-lg md:text-xl font-serif tracking-wide font-bold text-stone-800">
            Digital Library of Indic Intellectual History
          </h1>
        </div>
        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/texts/rigveda/1/1" className="text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors">
            Rigveda Viewer
          </Link>
          <a href="#about" className="text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors">
            About Project
          </a>
          <a href="#roadmap" className="text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors">
            Roadmap
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-grow">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-6 pt-16 pb-20 text-center max-w-5xl mx-auto">
          {/* Main Hero Artwork */}
          <div className="w-full max-w-4xl mb-12 relative group">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-stone-200/50 bg-white p-3 transition-transform duration-500 hover:scale-[1.01]">
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
                  <span className="bg-amber-500 text-stone-900 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 inline-block">
                    Phase 1 MVP Release
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl font-semibold leading-tight">
                    Vedic Agnihotra & The Sacred Fire
                  </h3>
                  <p className="text-stone-200 text-xs md:text-sm mt-2 font-light">
                    An artistic visualization of the primordial ritual space where the Rigvedic Mantras were composed and chanted, celebrating Agni—the divine conduit.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-4xl md:text-6xl font-serif mb-6 text-stone-800 leading-tight">
            The Earliest Layers of Indian Thought
          </h2>

          <div className="w-20 h-1 bg-amber-500 mb-8 rounded-full"></div>

          <p className="text-lg md:text-xl text-stone-600 mb-12 leading-relaxed max-w-3xl font-serif italic">
            &ldquo;अ॒ग्निमी॑ळे पु॒रोहि॑तं य॒ज्ञस्य॑ दे॒वमृत्विज॑म् । होता॑रं रत्न॒धात॑मम् ॥&rdquo;
          </p>

          <p className="text-base md:text-lg text-stone-600 mb-16 leading-relaxed max-w-3xl">
            DLIIH represents a pioneering effort in digital humanities to create a standardized, TEI/XML encoded corpus of ancient Indic philosophy, utilizing a strict top-down chronological approach.
          </p>

          {/* Primary Call to Action */}
          <div className="w-full max-w-3xl bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-left flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-grow">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Explore Primary Source Code</span>
              <h3 className="text-2xl font-serif text-stone-800 font-semibold mt-1">Rigveda Saṃhitā Viewer</h3>
              <p className="text-stone-500 text-sm mt-2 max-w-lg leading-relaxed">
                Dive into Mandala 1, Sukta 1 dedicated to Agni. Interrogate metrical analysis, word-by-word padapatha grammar tags, and Sāyaṇa's classical commentaries side-by-side.
              </p>
            </div>
            <Link
              href="/texts/rigveda/1/1"
              className="w-full md:w-auto px-8 py-4 bg-stone-900 hover:bg-amber-600 text-amber-50 hover:text-white font-medium rounded-xl shadow-md transition-all duration-300 hover:shadow-lg text-center tracking-wide"
            >
              Open Rigveda 1.1
            </Link>
          </div>
        </section>

        {/* Philosophy / About Section */}
        <section id="about" className="bg-stone-900 text-stone-50 py-24 px-8 md:px-16 border-t border-stone-800">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif mb-8 text-stone-100 text-center">
              The Layered Disclosure Paradigm
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-stone-300 mt-12 text-sm md:text-base leading-relaxed text-justify">
              <div className="space-y-6">
                <p>
                  Traditional digital books overwhelm readers with massive chunks of text, translations, footnotes, and commentaries scattered across different sections. DLIIH moves away from static pages toward a modern Human-Computer Interaction (HCI) model.
                </p>
                <p>
                  By default, the platform offers an uncluttered, distraction-free environment containing only the raw accents of the <strong>Samhitapatha</strong> alongside its fluid translation. The complex apparatus of morphological tagging resides behind simple, tactile clicks.
                </p>
              </div>
              <div className="space-y-6">
                <p>
                  Clicking any word opens the <strong>Philological Inspector</strong>, showing the un-sandhied <strong>Padapatha</strong> structure, grammatical details (case, gender, tense, conjugation), and literal semantic definitions.
                </p>
                <p>
                  Underneath, Sāyaṇa&apos;s classical commentaries reside in a toggleable apparatus. This creates a scalable interface for both casual readers seeking spiritual meaning and academic scholars conducting deep grammatical analysis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap / Timeline Section */}
        <section id="roadmap" className="py-24 px-8 md:px-16 bg-stone-100">
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
            <Link href="/texts/rigveda/1/1" className="hover:text-amber-700 transition-colors">Rigveda Samhita</Link>
            <span>•</span>
            <a href="https://github.com/sachit123H/Nanak-Panthi" target="_blank" rel="noopener noreferrer" className="hover:text-amber-700 transition-colors">Template Github</a>
          </div>
          <p className="text-stone-400 text-xs font-medium tracking-wide">
            © {new Date().getFullYear()} DLIIH. Creative Commons CC-BY-SA-4.0.
          </p>
        </div>
      </footer>
    </main>
  );
}
