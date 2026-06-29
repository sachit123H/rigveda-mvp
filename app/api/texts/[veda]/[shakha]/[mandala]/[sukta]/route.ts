/**
 * app/api/texts/[veda]/[shakha]/[mandala]/[sukta]/route.ts
 *
 * GET /api/texts/{veda}/{shakha}/{mandala}/{sukta}
 *
 * Returns the full mantra payload for a requested sukta.
 *
 * Validation:
 *  - Params are checked against VEDIC_CORPUS boundaries via validateVedicParams()
 *  - Invalid veda/shakha or out-of-range numbers → 404
 *  - Valid params that are not yet digitised → 200 with { state: "roadmap" }
 *  - Valid active params → 200 with { state: "active", mantras: [...] }
 */

import { NextRequest, NextResponse } from "next/server";
import { validateVedicParams } from "@/lib/vedic-boundaries";
import { loadMantras } from "@/lib/mantra-loader";

// Next.js route segment config
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    veda: string;
    shakha: string;
    mandala: string;
    sukta: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const params = await context.params;
  const result = validateVedicParams(params);

  // Structurally invalid or totally out of corpus range → hard 404
  if (!result.valid) {
    return NextResponse.json(
      {
        error: "not_found",
        reason: result.reason,
        message: `No Vedic text found for: ${params.veda}/${params.shakha}/${params.mandala}/${params.sukta}`,
      },
      { status: 404 }
    );
  }

  const { state } = result;

  // Roadmap state — within corpus but not yet digitised
  if (state.type === "roadmap") {
    return NextResponse.json(
      {
        state: "roadmap",
        veda: state.veda,
        shakha: state.shakha,
        mandala: state.mandala,
        sukta: state.sukta,
        message:
          "This section of the corpus is being digitised. Check back in a future DLIIH release.",
      },
      { status: 200 }
    );
  }

  // Active dataset — load mantras
  try {
    const mantras = await loadMantras({
      veda: state.veda,
      shakha: state.shakha,
      mandala: state.mandala,
      sukta: state.sukta,
    });

    if (mantras.length === 0) {
      // Data files exist but this sukta has no content — treat as roadmap
      return NextResponse.json(
        {
          state: "roadmap",
          veda: state.veda,
          shakha: state.shakha,
          mandala: state.mandala,
          sukta: state.sukta,
          message:
            "Mantra data for this sukta has not yet been loaded into the active dataset.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        state: "active",
        veda: state.veda,
        shakha: state.shakha,
        mandala: state.mandala,
        sukta: state.sukta,
        numMantras: mantras.length,
        mantras,
      },
      {
        status: 200,
        headers: {
          // Cache for 5 minutes at CDN edge; 1 hour stale-while-revalidate
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err) {
    console.error("[api/texts] Loader error:", err);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to load mantra data." },
      { status: 500 }
    );
  }
}
