/**
 * app/texts/[veda]/[shakha]/[mandala]/[sukta]/page.tsx
 *
 * DLIIH — Vedic Corpus Viewer (Phase 1)
 *
 * Architecture:
 *  - Root export is a **Server Component** (no "use client") that:
 *    1. Resolves params via async/await (Next.js 15+ pattern)
 *    2. Validates params against Vedic corpus boundaries
 *    3. Calls notFound() for structurally invalid routes
 *    4. Fetches mantra data via the mantra-loader abstraction (DB-first/JSON-fallback)
 *    5. Passes serialised data to the leaf "use client" component
 *
 *  - `VedaViewerClient` is the interactive "use client" component that handles:
 *    - Layer 0: Samhitapātha with clickable token spans
 *    - Layer 1 (toggle): Padapātha split view with danda separators
 *    - Layer 2 (right panel): Philological Inspector (grammar + multi-dictionary)
 *    - Comparative Panel (bottom): Translation vs. Sāyaṇabhāṣya accordion
 */

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { validateVedicParams, VEDIC_CORPUS } from "@/lib/vedic-boundaries";
import { loadMantras, MantraData } from "@/lib/mantra-loader";
import VedaViewerClient from "./VedaViewerClient";

// ── Route Segment Config ─────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

// ── Params Type ──────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{
    veda: string;
    shakha: string;
    mandala: string;
    sukta: string;
  }>;
}

// ── Dynamic Metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const p = await params;
  const mandala = parseInt(p.mandala, 10);
  const sukta = parseInt(p.sukta, 10);
  const vedaName = VEDIC_CORPUS[p.veda]?.name ?? p.veda;

  return {
    title: `${vedaName} ${mandala}.${sukta} — DLIIH Corpus Viewer`,
    description: `Read and analyse ${vedaName} Mandala ${mandala}, Sūkta ${sukta} with Padapātha breakdown, grammatical annotations, and multi-dictionary lexicon entries from the DLIIH Digital Library.`,
    openGraph: {
      title: `${vedaName} ${mandala}.${sukta} — DLIIH`,
      description: `Philological reader: Samhitapātha, Padapātha, and SanskritKosha lexicon for ${vedaName} ${mandala}.${sukta}`,
    },
  };
}

// ── Server Component Root ────────────────────────────────────────────────────

export default async function VedaSuktaPage({ params }: PageProps) {
  const rawParams = await params;
  const result = validateVedicParams(rawParams);

  // Hard 404 for structurally invalid routes (bad veda, bad shakha, out-of-corpus)
  if (!result.valid) {
    notFound();
  }

  const { state } = result;
  const veda = state.veda;
  const shakha = state.shakha;
  const mandala = state.mandala;
  const sukta = state.sukta;
  const vedaBoundary = VEDIC_CORPUS[veda]!;

  // Roadmap state — within corpus but not yet digitised
  if (state.type === "roadmap") {
    return <RoadmapPlaceholder veda={veda} shakha={shakha} mandala={mandala} sukta={sukta} />;
  }

  // Active dataset — fetch mantras
  const mantras = await loadMantras({ veda, shakha, mandala, sukta });

  // If loader returned empty (data gap) — show roadmap rather than blank page
  if (mantras.length === 0) {
    return <RoadmapPlaceholder veda={veda} shakha={shakha} mandala={mandala} sukta={sukta} />;
  }

  return (
    <VedaViewerClient
      mantras={mantras}
      veda={veda}
      shakha={shakha}
      mandala={mandala}
      sukta={sukta}
      divisionLabel={vedaBoundary.divisionLabel}
      subdivisionLabel={vedaBoundary.subdivisionLabel}
    />
  );
}

// ── Roadmap Placeholder (Server Component) ───────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function RoadmapPlaceholder({
  veda, shakha, mandala, sukta,
}: {
  veda: string; shakha: string; mandala: number; sukta: number;
}) {
  const vedaBoundary = VEDIC_CORPUS[veda];
  const divLabel = vedaBoundary?.divisionLabel ?? "Division";
  const subLabel = vedaBoundary?.subdivisionLabel ?? "Section";

  return (
    <main className="min-h-screen bg-[#fbfbf9] text-[#1c1917] font-sans flex flex-col selection:bg-amber-100">
      <header className="px-6 py-4 border-b border-stone-200 bg-white/90 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <a
            href="/texts"
            className="text-stone-500 hover:text-amber-700 transition-colors p-2 rounded-lg hover:bg-stone-100"
            title="Back to Selection"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
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
          {divLabel} {mandala}, {subLabel} {sukta}
        </div>
      </header>

      <div className="flex-grow flex flex-col justify-center items-center max-w-2xl mx-auto px-6 py-20 text-center space-y-6">
        <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-full border border-amber-200 text-xs font-bold uppercase tracking-widest">
          Vedic Roadmap Placeholder
        </div>
        <h2 className="text-3xl font-serif text-stone-850 font-bold">
          {capitalize(veda)} ({shakha}) &bull; {divLabel} {mandala}
        </h2>
        <p className="text-stone-600 leading-relaxed font-serif text-justify text-base">
          This section of the Vedic corpus ({capitalize(veda)} {capitalize(shakha)}&nbsp;&bull;&nbsp;
          {divLabel} {mandala}, {subLabel} {sukta}) is currently being scanned, transcribed, and
          TEI/XML aligned according to the <strong>DLIIH 5-Year Chronological Roadmap</strong>.
        </p>
        <p className="text-stone-500 text-sm text-justify">
          During Phase 1, our focus is on establishing foundational standards using a deep vertical
          slice of the <strong>Rigveda Samhitā (Śākala Recension) &bull; Mandala 1</strong>.
        </p>
        <div className="w-20 h-0.5 bg-stone-200 my-4" />
        <div className="space-y-4 w-full">
          <a
            href="/texts/rigveda/sakala/1/1"
            className="inline-block px-8 py-3.5 bg-stone-900 hover:bg-amber-600 text-amber-50 hover:text-white font-bold rounded-xl shadow-md transition-all text-xs uppercase tracking-wider"
          >
            Explore Active Rigveda 1.1 Dataset
          </a>
          <br />
          <a
            href="/texts"
            className="inline-block text-xs font-bold text-stone-400 hover:text-amber-700 transition-colors uppercase tracking-wider"
          >
            &larr; Back to Selection Portal
          </a>
        </div>
      </div>
    </main>
  );
}
