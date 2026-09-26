import path from "node:path";

// Order matters: decode (so %2e%2e is ..), refuse NUL, resolve, contain with a separator (/public-secrets vs /public).
// Symlinks are followed on purpose: akan sync links public/libs/<lib> out of the tree; a build dereferences them.
export const resolveStaticPath = (baseDir: string, urlPath: string): string | null => {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  const normalizedBase = path.resolve(baseDir);
  const rel = decoded.replace(/^[/\\]+/, "");
  const resolved = path.resolve(normalizedBase, rel);
  if (resolved === normalizedBase) return resolved;
  const baseWithSep = normalizedBase.endsWith(path.sep) ? normalizedBase : normalizedBase + path.sep;
  if (!resolved.startsWith(baseWithSep)) return null;
  return resolved;
};
