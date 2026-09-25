import path from "node:path";

/**
 * The file a URL path names inside one directory, or `null` when it names something outside it.
 *
 * Every static route the web router serves goes through here, so this is the single place a request path stops
 * being a string and becomes a file. The order matters: percent-decoding first (so `%2e%2e` is seen as `..`),
 * then a NUL check (a truncating byte in a path), then `path.resolve` to collapse the traversal, then
 * containment against the base **with a separator** — without it `/public-secrets` passes a `/public` check.
 *
 * Symlinks are followed, like nginx and `serve-static` do: `akan sync` builds `public/libs/<lib>` as a link to
 * `<workspaceRoot>/libs/<lib>/public`, so a link out of the tree is how a lib ships its assets, not an attack.
 * Refusing those would 404 every lib asset under `akan start` and nothing else — `akan build` copies `public/`
 * with `dereference: true`, so a built app has no links left to refuse. Traversal is what the string checks
 * above stop, and they run before any of this touches the filesystem.
 *
 * Callers check existence after this, so a path that resolves to nothing is handed back and 404s there.
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
  return resolved;
};
