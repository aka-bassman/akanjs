import fs from "node:fs";
import path from "node:path";

/**
 * The file a URL path names inside one directory, or `null` when it names something outside it.
 *
 * Every static route the web router serves goes through here, so this is the single place a request path stops
 * being a string and becomes a file. The order matters: percent-decoding first (so `%2e%2e` is seen as `..`),
 * then a NUL check (a truncating byte in a path), then `path.resolve` to collapse the traversal, then
 * containment against the base **with a separator** — without it `/public-secrets` passes a `/public` check.
 *
 * `path.resolve` works on the string and does not follow links, so a symlink inside the tree can still point
 * out of it. Callers check existence after this, so a path that resolves to nothing is handed back and 404s
 * there; only a link that really leads outside is refused.
 */
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
  try {
    // Against the base's *real* path, not its lexical one: an ancestor of the base is very often itself a link
    // (macOS `/var`, a symlinked release directory, a bind mount), and comparing to the lexical base would then
    // refuse every file in the tree.
    const realBase = fs.realpathSync(normalizedBase);
    const realBaseWithSep = realBase.endsWith(path.sep) ? realBase : realBase + path.sep;
    const real = fs.realpathSync(resolved);
    if (real !== realBase && !real.startsWith(realBaseWithSep)) return null;
  } catch {
    // The base or the target does not exist, or is unreadable. Either way there is no link to follow out of
    // the tree, and the lexical containment above already held.
  }
  return resolved;
};
