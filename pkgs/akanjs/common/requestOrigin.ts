/**
 * The origin a caller actually saw, and whether a body claims to be JSON. Both read only headers and a URL, so
 * they answer the same way for the cache layer, the CSRF gate, and anything else that has to compare origins.
 */
export const originFromRequest = (headers: Headers, url: URL): string => {
  // A proxy terminates TLS and rewrites the host, so the parsed request origin is the internal one behind it.
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost ?? headers.get("host")?.split(",")[0]?.trim();
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

/**
 * Whether a request body may be read as JSON.
 *
 * `Request.json()` parses whatever bytes it holds regardless of this header, and the three content types a
 * cross-site form can send — `text/plain`, `application/x-www-form-urlencoded`, `multipart/form-data` — are
 * exactly the ones a browser sends with **no preflight**. Requiring the JSON type is therefore what puts a
 * preflight in front of every mutation that carries a body.
 */
export const isJsonContentType = (contentType: string | null): boolean => {
  if (!contentType) return false;
  const essence = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return essence === "application/json" || essence.endsWith("+json");
};
