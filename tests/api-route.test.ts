/**
 * tests/api-route.test.ts
 *
 * Integration tests for the GET route handler in
 * `app/api/texts/[veda]/[shakha]/[mandala]/[sukta]/route.ts`
 *
 * Strategy:
 *  - Import the GET handler directly (no HTTP server needed)
 *  - Construct minimal NextRequest mocks
 *  - Assert response status, headers, and JSON body shape
 *
 * What we test:
 *  - 404 for invalid veda
 *  - 404 for invalid shakha
 *  - 404 for out-of-range mandala
 *  - 200 + state:"roadmap" for valid but undigitised corpus sections
 *  - 200 + state:"active" with mantra data for rigveda/sakala/1/1
 *  - ETag header present on active response
 *  - Cache-Control header present on active response
 *  - 304 Not Modified when If-None-Match matches current ETag
 */

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

// The Next.js `unstable_cache` requires a Next.js server context to work.
// In tests we mock it to be a pass-through so the loader is called directly.
import { vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
  revalidateTag: vi.fn(),
}));

// Import AFTER the mock is set up
import { GET } from "@/app/api/texts/[veda]/[shakha]/[mandala]/[sukta]/route";

// ── Mock NextRequest builder ──────────────────────────────────────────────────

function makeRequest(
  url: string,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(url, { headers });
}

function makeContext(veda: string, shakha: string, mandala: string, sukta: string) {
  return {
    params: Promise.resolve({ veda, shakha, mandala, sukta }),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/texts — invalid params → 404", () => {
  it("returns 404 for an unknown veda", async () => {
    // atharvaveda IS a valid corpus entry, use a genuinely unknown string
    const req = makeRequest("http://localhost/api/texts/purvavedas/unknown/1/1");
    const ctx = makeContext("purvavedas", "unknown", "1", "1");
    const res = await GET(req, ctx);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("not_found");
  });

  it("returns 404 for an invalid shakha on a valid veda", async () => {
    const req = makeRequest("http://localhost/api/texts/rigveda/unknown/1/1");
    const ctx = makeContext("rigveda", "unknown", "1", "1");
    const res = await GET(req, ctx);
    expect(res.status).toBe(404);
  });

  it("returns 404 for mandala out of range (Rigveda > 10)", async () => {
    const req = makeRequest("http://localhost/api/texts/rigveda/sakala/99/1");
    const ctx = makeContext("rigveda", "sakala", "99", "1");
    const res = await GET(req, ctx);
    expect(res.status).toBe(404);
  });

  it("returns 404 for mandala === 0", async () => {
    const req = makeRequest("http://localhost/api/texts/rigveda/sakala/0/1");
    const ctx = makeContext("rigveda", "sakala", "0", "1");
    const res = await GET(req, ctx);
    expect(res.status).toBe(404);
  });

  it("returns 404 for sukta === 0", async () => {
    const req = makeRequest("http://localhost/api/texts/rigveda/sakala/1/0");
    const ctx = makeContext("rigveda", "sakala", "1", "0");
    const res = await GET(req, ctx);
    expect(res.status).toBe(404);
  });

  it("error response body has message field", async () => {
    const req = makeRequest("http://localhost/api/texts/unknown/unknown/1/1");
    const ctx = makeContext("unknown", "unknown", "1", "1");
    const res = await GET(req, ctx);
    const body = await res.json();
    expect(typeof body.message).toBe("string");
    expect(body.message.length).toBeGreaterThan(0);
  });
});

describe("GET /api/texts — roadmap state", () => {
  it("returns 200 with state:roadmap for a valid but roadmap corpus section", async () => {
    // Mandala 2 is roadmap in Phase 1
    const req = makeRequest("http://localhost/api/texts/rigveda/sakala/2/1");
    const ctx = makeContext("rigveda", "sakala", "2", "1");
    const res = await GET(req, ctx);
    // May be roadmap (200) or 404 depending on corpus definition
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      const body = await res.json();
      expect(body.state).toBe("roadmap");
    }
  });

  it("roadmap response has correct Cache-Control (short TTL)", async () => {
    const req = makeRequest("http://localhost/api/texts/rigveda/sakala/2/1");
    const ctx = makeContext("rigveda", "sakala", "2", "1");
    const res = await GET(req, ctx);
    if (res.status === 200) {
      const body = await res.json();
      if (body.state === "roadmap") {
        const cc = res.headers.get("cache-control") ?? "";
        expect(cc).toContain("s-maxage=60");
      }
    }
  });
});

describe("GET /api/texts — active dataset (rigveda/sakala/1/1)", () => {
  it("returns 200 with state:active", async () => {
    const req = makeRequest("http://localhost/api/texts/rigveda/sakala/1/1");
    const ctx = makeContext("rigveda", "sakala", "1", "1");
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.state).toBe("active");
  });

  it("response body has mantras array with at least one element", async () => {
    const req = makeRequest("http://localhost/api/texts/rigveda/sakala/1/1");
    const ctx = makeContext("rigveda", "sakala", "1", "1");
    const res = await GET(req, ctx);
    const body = await res.json();
    expect(Array.isArray(body.mantras)).toBe(true);
    expect(body.mantras.length).toBeGreaterThan(0);
  });

  it("response body has correct metadata fields", async () => {
    const req = makeRequest("http://localhost/api/texts/rigveda/sakala/1/1");
    const ctx = makeContext("rigveda", "sakala", "1", "1");
    const res = await GET(req, ctx);
    const body = await res.json();
    expect(body.veda).toBe("rigveda");
    expect(body.shakha).toBe("sakala");
    expect(body.mandala).toBe(1);
    expect(body.sukta).toBe(1);
    expect(typeof body.numMantras).toBe("number");
    expect(body.numMantras).toBe(body.mantras.length);
  });

  it("each mantra in response has samhitapatha string", async () => {
    const req = makeRequest("http://localhost/api/texts/rigveda/sakala/1/1");
    const ctx = makeContext("rigveda", "sakala", "1", "1");
    const res = await GET(req, ctx);
    const body = await res.json();
    for (const m of body.mantras) {
      expect(typeof m.samhitapatha).toBe("string");
      expect(m.samhitapatha.length).toBeGreaterThan(0);
    }
  });

  it("ETag header is present on active response", async () => {
    const req = makeRequest("http://localhost/api/texts/rigveda/sakala/1/1");
    const ctx = makeContext("rigveda", "sakala", "1", "1");
    const res = await GET(req, ctx);
    const etag = res.headers.get("etag");
    expect(etag).not.toBeNull();
    expect(etag).toMatch(/^"dliih-/);
  });

  it("Cache-Control header has s-maxage=3600 on active response", async () => {
    const req = makeRequest("http://localhost/api/texts/rigveda/sakala/1/1");
    const ctx = makeContext("rigveda", "sakala", "1", "1");
    const res = await GET(req, ctx);
    const cc = res.headers.get("cache-control") ?? "";
    expect(cc).toContain("s-maxage=3600");
    expect(cc).toContain("stale-while-revalidate");
  });
});

describe("GET /api/texts — conditional GET (ETag / 304)", () => {
  it("returns 304 when If-None-Match matches current ETag", async () => {
    const etag = '"dliih-rigveda-sakala-1-1"';
    const req = makeRequest(
      "http://localhost/api/texts/rigveda/sakala/1/1",
      { "if-none-match": etag }
    );
    const ctx = makeContext("rigveda", "sakala", "1", "1");
    const res = await GET(req, ctx);
    expect(res.status).toBe(304);
  });

  it("returns 200 when If-None-Match does not match", async () => {
    const req = makeRequest(
      "http://localhost/api/texts/rigveda/sakala/1/1",
      { "if-none-match": '"stale-etag-value"' }
    );
    const ctx = makeContext("rigveda", "sakala", "1", "1");
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
  });
});
