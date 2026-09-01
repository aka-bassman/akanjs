import { afterEach, describe, expect, test } from "bun:test";
import { brotliDecompressSync, gunzipSync } from "node:zlib";
import { compressResponse, isCompressibleContentType } from "./contentEncoding";

const body = JSON.stringify({ rows: Array.from({ length: 200 }, (_, i) => ({ id: i, title: "repeated title" })) });
const json = (payload = body) => Response.json(JSON.parse(payload) as unknown);
const req = (acceptEncoding?: string) =>
  new Request("http://localhost/api/x", acceptEncoding ? { headers: { "accept-encoding": acceptEncoding } } : {});

afterEach(() => {
  process.env.AKAN_HTTP_COMPRESS = undefined;
});

describe("compressResponse", () => {
  test("prefers brotli and reports it, leaving the decoded body unchanged", async () => {
    const original = await json().text();
    const response = await compressResponse(req("gzip, deflate, br"), json());

    expect(response.headers.get("Content-Encoding")).toBe("br");
    expect(response.headers.get("Vary")).toContain("Accept-Encoding");
    const compressed = Buffer.from(await response.arrayBuffer());
    expect(compressed.byteLength).toBeLessThan(Buffer.byteLength(original) / 4);
    expect(brotliDecompressSync(compressed).toString()).toBe(original);
    expect(response.headers.get("Content-Length")).toBe(String(compressed.byteLength));
  });

  test("falls back to gzip when brotli is not advertised", async () => {
    const original = await json().text();
    const response = await compressResponse(req("gzip, deflate"), json());

    expect(response.headers.get("Content-Encoding")).toBe("gzip");
    expect(gunzipSync(Buffer.from(await response.arrayBuffer())).toString()).toBe(original);
  });

  test("leaves the body alone when nothing is accepted, or the encoding is refused with q=0", async () => {
    expect((await compressResponse(req(), json())).headers.get("Content-Encoding")).toBeNull();
    expect((await compressResponse(req("identity"), json())).headers.get("Content-Encoding")).toBeNull();
    expect((await compressResponse(req("br;q=0, gzip;q=0"), json())).headers.get("Content-Encoding")).toBeNull();
  });

  test("skips a body too small to pay for its own framing", async () => {
    const small = Response.json({ ok: true });
    const response = await compressResponse(req("br"), small);

    expect(response.headers.get("Content-Encoding")).toBeNull();
    expect(await response.json()).toEqual({ ok: true });
  });

  test("skips a body that is already encoded, and one whose type is not compressible", async () => {
    const encoded = new Response(body, {
      headers: { "Content-Type": "application/json", "Content-Encoding": "gzip" },
    });
    const png = new Response(body, { headers: { "Content-Type": "image/png" } });

    expect((await compressResponse(req("br"), encoded)).headers.get("Content-Encoding")).toBe("gzip");
    expect((await compressResponse(req("br"), png)).headers.get("Content-Encoding")).toBeNull();
  });

  test("is switched off wholesale by AKAN_HTTP_COMPRESS", async () => {
    process.env.AKAN_HTTP_COMPRESS = "false";

    expect((await compressResponse(req("br"), json())).headers.get("Content-Encoding")).toBeNull();
  });

  test("carries the status and the headers the handler set", async () => {
    const created = new Response(body, {
      status: 201,
      statusText: "Created",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
    const response = await compressResponse(req("br"), created);

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });
});

describe("isCompressibleContentType", () => {
  test("refuses an event stream, which has no end to buffer", () => {
    expect(isCompressibleContentType("text/event-stream")).toBe(false);
    expect(isCompressibleContentType("text/html; charset=utf-8")).toBe(true);
    expect(isCompressibleContentType("application/json")).toBe(true);
    expect(isCompressibleContentType("image/png")).toBe(false);
  });
});
