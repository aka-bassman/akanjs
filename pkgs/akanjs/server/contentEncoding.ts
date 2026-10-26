import { brotliCompressSync, constants, createBrotliCompress, createGzip, gzipSync } from "node:zlib";

const COMPRESSIBLE_TYPES = new Set([
  "application/javascript",
  "application/json",
  "application/manifest+json",
  "image/svg+xml",
]);

// gzip stays as the fallback: browsers only advertise `br` on secure origins.
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
  // An event stream never ends, so a sidecar lookup or a buffering compressor would wait forever.
  if (type === "text/event-stream") return false;
  return type.startsWith("text/") || COMPRESSIBLE_TYPES.has(type);
};

// Not brotli's default 11: q11 spends tens of ms per response to save a few hundred bytes over q4.
const BROTLI_QUALITY = 4;
const GZIP_LEVEL = 6;
/** Under a KB the framing bytes and the call cost more than the repetition they remove. */
const MIN_COMPRESS_BYTES = 1024;
//? Compressing blocks the event loop, ~6 ms (br) and ~12 ms (gzip) per MiB of JSON on an M-series core.
const MAX_COMPRESS_BYTES = 4 * 1024 * 1024;

const compressBody = (bytes: Uint8Array, encoding: ContentEncoding) =>
  encoding === "br"
    ? brotliCompressSync(bytes, {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY,
          [constants.BROTLI_PARAM_SIZE_HINT]: bytes.byteLength,
        },
      })
    : gzipSync(bytes, { level: GZIP_LEVEL });

//? A Range is Bun.serve's to answer: it sends a file body it gets untouched as a 206 of exactly those bytes.
const isWholeBody = (req: Request, response: Pick<Response, "status" | "headers">) =>
  !req.headers.has("range") &&
  !response.headers.has("content-range") &&
  response.status >= 200 &&
  response.status < 300 &&
  response.status !== 206;

const isCompressionOff = () => process.env.AKAN_HTTP_COMPRESS === "false" || process.env.AKAN_HTTP_COMPRESS === "0";

const negotiateEncoding = (req: Request, response: Pick<Response, "status" | "headers">): ContentEncoding | null => {
  if (response.headers.has("content-encoding")) return null;
  if (!isWholeBody(req, response)) return null;
  if (Number(response.headers.get("content-length")) > MAX_COMPRESS_BYTES) return null;
  if (!isCompressibleContentType(response.headers.get("content-type") ?? "")) return null;
  if (isCompressionOff()) return null;
  const acceptEncoding = req.headers.get("accept-encoding") ?? "";
  return CONTENT_ENCODINGS.find(({ accept }) => acceptsEncoding(acceptEncoding, accept))?.encoding ?? null;
};

// Buffers the body: never pass a streamed response (SSR HTML, RSC flight, SSE) — it would hold the whole render.
export const compressResponse = async (req: Request, response: Response): Promise<Response> => {
  const encoding = negotiateEncoding(req, response);
  if (!encoding || !response.body) return response;
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

const STREAM_FLUSH = { br: constants.BROTLI_OPERATION_FLUSH, gzip: constants.Z_SYNC_FLUSH } as const;

//? One flush per burst, not per chunk: React writes a shell as many small chunks in one task, and each flush costs
//? framing bytes and ratio, while a burst still leaves as soon as it is written.
const createStreamCompressor = (encoding: ContentEncoding) => {
  const compressor =
    encoding === "br"
      ? createBrotliCompress({ params: { [constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY } })
      : createGzip({ level: GZIP_LEVEL });
  let pendingFlush: ReturnType<typeof setImmediate> | null = null;
  let isCancelled = false;
  // `cancel` is in the Streams spec and Bun calls it on a client disconnect; TypeScript's DOM lib predates it.
  const transformer: Transformer<Uint8Array, Uint8Array> & { cancel: () => void } = {
    start: (controller) => {
      compressor.on("data", (chunk: Uint8Array) => {
        if (!isCancelled) controller.enqueue(chunk);
      });
      compressor.on("error", (error) => controller.error(error));
    },
    transform: (chunk) => {
      compressor.write(chunk);
      pendingFlush ??= setImmediate(() => {
        pendingFlush = null;
        compressor.flush(STREAM_FLUSH[encoding]);
      });
    },
    flush: () =>
      new Promise<void>((resolve, reject) => {
        if (pendingFlush) clearImmediate(pendingFlush);
        compressor.once("end", resolve).once("error", reject).end();
      }),
    cancel: () => {
      isCancelled = true;
      if (pendingFlush) clearImmediate(pendingFlush);
      compressor.destroy();
    },
  };
  return new TransformStream<Uint8Array, Uint8Array>(transformer);
};

// For SSR HTML and RSC flight: compresses as the body streams, so the shell still reaches the browser before the render ends.
export const compressStreamResponse = (req: Request, response: Response): Response => {
  const encoding = negotiateEncoding(req, response);
  if (!encoding || !response.body) return response;
  const headers = new Headers(response.headers);
  headers.set("Content-Encoding", encoding);
  headers.delete("Content-Length");
  headers.append("Vary", "Accept-Encoding");
  const etag = headers.get("etag");
  // The encoded bytes differ from the ones a strong validator names.
  if (etag && !etag.startsWith("W/")) headers.set("ETag", `W/${etag}`);
  return new Response(response.body.pipeThrough(createStreamCompressor(encoding)), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export interface EncodedBody {
  bytes: Uint8Array<ArrayBuffer>;
  encodings: Partial<Record<ContentEncoding, Uint8Array<ArrayBuffer>>>;
  /** The raw bytes and every encoding, which is what keeping it costs. */
  byteLength: number;
}

// For a body kept to answer many requests: each encoding is made once here, not once per response.
export const encodeBody = (body: string | Uint8Array<ArrayBuffer>): EncodedBody => {
  const bytes = typeof body === "string" ? new TextEncoder().encode(body) : body;
  const encodings: EncodedBody["encodings"] = {};
  let byteLength = bytes.byteLength;
  if (isCompressionOff() || bytes.byteLength < MIN_COMPRESS_BYTES || bytes.byteLength > MAX_COMPRESS_BYTES)
    return { bytes, encodings, byteLength };
  for (const { encoding } of CONTENT_ENCODINGS) {
    const encoded = compressBody(bytes, encoding);
    encodings[encoding] = encoded;
    byteLength += encoded.byteLength;
  }
  return { bytes, encodings, byteLength };
};

export const encodedBodyResponse = (
  req: Request,
  body: EncodedBody,
  init: { status?: number; headers: Headers },
): Response => {
  const status = init.status ?? 200;
  const encoding = negotiateEncoding(req, { status, headers: init.headers });
  const encoded = encoding ? body.encodings[encoding] : undefined;
  if (!encoding || !encoded) return new Response(body.bytes, { status, headers: init.headers });
  const headers = new Headers(init.headers);
  headers.set("Content-Encoding", encoding);
  headers.set("Content-Length", String(encoded.byteLength));
  headers.append("Vary", "Accept-Encoding");
  return new Response(encoded, { status, headers });
};

export interface EncodedSidecar {
  bytes: ArrayBuffer;
  encoding: string;
}

export const resolveEncodedSidecar = async (
  req: Request,
  filePath: string,
  contentType: string,
): Promise<EncodedSidecar | null> => {
  if (!isCompressibleContentType(contentType)) return null;
  const acceptEncoding = req.headers.get("accept-encoding") ?? "";
  for (const { encoding, ext, accept } of CONTENT_ENCODINGS) {
    if (!acceptsEncoding(acceptEncoding, accept)) continue;
    const file = Bun.file(`${filePath}${ext}`);
    if (!(await file.exists())) continue;
    const bytes = await file.bytes();
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return { bytes: buffer, encoding };
  }
  return null;
};

// A precompressed `.br`/`.gz` sibling when the client takes one, else the file itself.
export const encodedFileResponse = async (
  req: Request,
  filePath: string,
  contentType: string,
  headers: Headers,
): Promise<Response> => {
  const sidecar = await resolveEncodedSidecar(req, filePath, contentType);
  if (!sidecar) return new Response(Bun.file(filePath).stream(), { headers });
  headers.set("Content-Encoding", sidecar.encoding);
  headers.set("Content-Length", String(sidecar.bytes.byteLength));
  headers.set("Vary", "Accept-Encoding");
  return new Response(sidecar.bytes, { headers });
};
