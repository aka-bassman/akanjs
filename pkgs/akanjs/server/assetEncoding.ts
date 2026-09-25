import { acceptsEncoding, CONTENT_ENCODINGS, isCompressibleContentType } from "./contentEncoding";

export { isCompressibleContentType } from "./contentEncoding";

export interface EncodedSidecar {
  bytes: ArrayBuffer;
  encoding: string;
}

/** Picks the best precompressed sidecar the caller accepts, or null to serve the file as-is. */
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
