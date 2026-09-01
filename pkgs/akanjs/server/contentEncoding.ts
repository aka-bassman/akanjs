import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const COMPRESSIBLE_TYPES = new Set([
  "application/javascript",
  "application/json",
  "application/manifest+json",
  "image/svg+xml",
]);

/**
 * br is tried first: it is ~15% smaller than gzip across the artifact and ~22% on the CSS bundle, and on a
 * model listing it is half of gzip's size at the same cost. The gzip entry stays the fallback because browsers
 * only advertise `br` on secure origins, so a plain-http dev server or an intermediary that rewrites
 * Accept-Encoding still gets a compressed body.
 */
export const CONTENT_ENCODINGS = [
  { encoding: "br", ext: ".br", accept: /(?:^|,)\s*(?:br|\*)(?![\w-])\s*(?:;\s*q=([\d.]+))?/i },
  { encoding: "gzip", ext: ".gz", accept: /(?:^|,)\s*(?:gzip|\*)(?![\w-])\s*(?:;\s*q=([\d.]+))?/i },
] as const;

export type ContentEncoding = (typeof CONTENT_ENCODINGS)[number]["encoding"];

/** `q=0` is an explicit refusal, not a preference. */
export const acceptsEncoding = (acceptEncoding: string, accept: RegExp): boolean => {
  const match = accept.exec(acceptEncoding);
  return !!match && !(match[1] !== undefined && Number.parseFloat(match[1]) <= 0);
};

export const isCompressibleContentType = (contentType: string): boolean => {
  const type = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  // An event stream has no end, so both readers here — a `.br` sidecar lookup and a buffering
  // compressor — would wait on a body that never completes.
  if (type === "text/event-stream") return false;
  return type.startsWith("text/") || COMPRESSIBLE_TYPES.has(type);
};

/**
 * Quality 4, not brotli's default 11: on a 132KB model listing q4 lands at 1.4KB in 0.10ms, where q11 spends
 * tens of milliseconds to save a few hundred more bytes. gzip level 6 costs the same 0.10ms and lands at 2.7KB.
 */
const BROTLI_QUALITY = 4;
const GZIP_LEVEL = 6;
/** Under a KB the framing bytes and the call cost more than the repetition they remove. */
const MIN_COMPRESS_BYTES = 1024;

const compressBody = (bytes: Uint8Array, encoding: ContentEncoding) =>
  encoding === "br"
    ? brotliCompressSync(bytes, {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY,
          [constants.BROTLI_PARAM_SIZE_HINT]: bytes.byteLength,
        },
      })
    : gzipSync(bytes, { level: GZIP_LEVEL });

export const negotiateContentEncoding = (req: Request): ContentEncoding | null => {
  if (process.env.AKAN_HTTP_COMPRESS === "false" || process.env.AKAN_HTTP_COMPRESS === "0") return null;
  const acceptEncoding = req.headers.get("accept-encoding") ?? "";
  return CONTENT_ENCODINGS.find(({ accept }) => acceptsEncoding(acceptEncoding, accept))?.encoding ?? null;
};

/**
 * Compresses a fully-materialized response the caller accepts an encoding for, or hands back the original.
 *
 * Buffers the body, so it is only ever applied where the body is already in memory — a signal endpoint's JSON.
 * A streamed response (SSR HTML, an RSC flight payload, an event stream) must not reach this: buffering one
 * would hold the whole render before the first byte, which is the opposite of what streaming it was for.
 */
export const compressResponse = async (req: Request, response: Response): Promise<Response> => {
  if (response.headers.has("content-encoding") || !response.body) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!isCompressibleContentType(contentType)) return response;
  const encoding = negotiateContentEncoding(req);
  if (!encoding) return response;
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < MIN_COMPRESS_BYTES) return new Response(bytes, response);
  const compressed = compressBody(bytes, encoding);
  const headers = new Headers(response.headers);
  headers.set("Content-Encoding", encoding);
  headers.set("Content-Length", String(compressed.byteLength));
  // Without it a shared cache can hand a br body to a client that never asked for one.
  headers.append("Vary", "Accept-Encoding");
  return new Response(compressed, { status: response.status, statusText: response.statusText, headers });
};
