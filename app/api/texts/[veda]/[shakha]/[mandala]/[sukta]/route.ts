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
 *
 * Caching strategy:
 *  - Active sukta data is wrapped in Next.js `unstable_cache` with a 1-hour TTL
 *    (revalidate: 3600). Vedic texts are immutable within a release; the cache
 *    is safe to hold for long periods.
 *  - Roadmap responses use a shorter TTL (60 s) since the active window expands
 *    as new suktas are digitised.
 *  - ETag header (stable hash of the sukta key) enables conditional GET support
 *    for clients that send `If-None-Match`, returning 304 Not Modified on cache hit.
 *  - `validateVedicParams()` is a pure O(1) hash lookup — no caching needed.
 */

import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { validateVedicParams } from "@/lib/vedic-boundaries";
import { loadMantras, MantraData } from "@/lib/mantra-loader";

// ── Route Segment Config ─────────────────────────────────────────────────────

// Remove `force-dynamic` — let Next.js cache the response via unstable_cache.
// The route is still dynamic (params from URL), but the *data fetch* is cached.
export const dynamic = "force-dynamic";

// ── ETag Utility ─────────────────────────────────────────────────────────────

/**
 * Generates a stable, lightweight ETag for a sukta key.
 * Not a cryptographic hash — purely for cache invalidation identity.
 * Format: "rv-{veda}-{shakha}-{mandala}-{sukta}"
 * Wrapped in double quotes per RFC 7232.
 */
function buildETag(veda: string, shakha: string, mandala: number, sukta: number): string {
  return `"dliih-${veda}-${shakha}-${mandala}-${sukta}"`;
}

// ── Cached Data Fetcher ───────────────────────────────────────────────────────

/**
 * Returns a cached version of `loadMantras` for a specific sukta.
 *
 * `unstable_cache` memoises the async function in the Next.js Data Cache,
 * shared across all requests to the same key within the TTL window.
 * Revalidation is time-based (stale-while-revalidate semantics handled by CDN).
 *
 * Cache tags allow programmatic invalidation via `revalidateTag()` if a
 * future admin endpoint needs to force-refresh specific corpus sections.
 */
function getCachedMantras(
  veda: string,
  shakha: string,
  mandala: number,
  sukta: number
): () => Promise<MantraData[]> {
  return unstable_cache(
    () => loadMantras({ veda, shakha, mandala, sukta }),
    // Cache key: stable array of discriminating values
    ["mantras", veda, shakha, String(mandala), String(sukta)],
    {
      // Vedic texts are immutable within a release — 1 hour TTL
      revalidate: 3600,
      tags: [
        `corpus:${veda}`,
        `shakha:${shakha}`,
        `mandala:${veda}-${mandala}`,
        `sukta:${veda}-${mandala}-${sukta}`,
      ],
    }
  );
}

// ── Route Handler ─────────────────────────────────────────────────────────────

interface RouteContext {
  params: Promise<{
    veda: string;
    shakha: string;
    mandala: string;
    sukta: string;
  }>;
}

export async function GET(
  request: NextRequest,
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
      {
        status: 200,
        headers: {
          // Short TTL: roadmap window expands as new suktas are digitised
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  }

  // ── Active dataset — load mantras (cached) ────────────────────────────────

  const etag = buildETag(state.veda, state.shakha, state.mandala, state.sukta);

  // Conditional GET: return 304 if client already has current version
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  try {
    // Retrieve from Next.js Data Cache (or DB/JSON on first miss)
    const fetchCached = getCachedMantras(
      state.veda,
      state.shakha,
      state.mandala,
      state.sukta
    );
    const mantras = await fetchCached();

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
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
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
          // 1-hour edge cache; 24-hour stale-while-revalidate for CDN layers
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          ETag: etag,
          Vary: "Accept-Encoding",
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
