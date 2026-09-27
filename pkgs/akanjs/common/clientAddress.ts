export const forwardedHeaders = [
  "x-real-ip",
  "x-forwarded-for",
  "x-forwarded-port",
  "x-forwarded-host",
  "x-forwarded-proto",
] as const;

// A dual-stack listener reports an IPv4 client as `::ffff:a.b.c.d`, which no `udp4` socket accepts.
export const normalizeIpAddress = (address: string): string => {
  const trimmed = address.trim();
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(trimmed);
  return mapped?.[1] ?? trimmed;
};

/** `x-real-ip`, else the first `x-forwarded-for` entry; `null`, never a placeholder, when neither is set. */
export const clientAddressFromHeaders = (headers: Headers): string | null => {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return normalizeIpAddress(realIp);
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded ? normalizeIpAddress(forwarded) : null;
};

export const clientPortFromHeaders = (headers: Headers): number | null => {
  const port = Number(headers.get("x-forwarded-port"));
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
};
