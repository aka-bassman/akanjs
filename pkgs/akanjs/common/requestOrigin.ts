export const originFromRequest = (headers: Headers, url: URL): string => {
  // A proxy terminates TLS and rewrites the host, so the parsed request origin is the internal one behind it.
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = hostFromRequest(headers, url);
  const proto = forwardedProto ?? url.protocol.slice(0, -1);
  if (host && proto) {
    try {
      return new URL(`${proto}://${host}`).origin;
    } catch {
      // A malformed forwarded host falls through to the origin the request itself parsed to.
    }
  }
  return url.origin;
};

export const hostFromRequest = (headers: Headers, url: URL): string =>
  headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? headers.get("host")?.split(",")[0]?.trim() ?? url.host;

// Requiring a JSON type is what puts a CORS preflight in front of every mutation that carries a body.
export const isJsonContentType = (contentType: string | null): boolean => {
  if (!contentType) return false;
  const essence = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return essence === "application/json" || essence.endsWith("+json");
};
