import path from "node:path";
import { Logger } from "akanjs/common";
import { parseNamedList } from "./moduleSyntax";

export interface BarrelExportTarget {
  subpath: string;
  originalName: string;
}

export type BarrelExportMap = Map<string, BarrelExportTarget>;

export interface PackageEntry {
  pkgName: string;
  /** Absolute path of the barrel entry file. */
  entryFile: string;
  /** Absolute base directory for subpath computation, typically `dirname(entryFile)`. */
  pkgDir: string;
  /** Emit concrete file paths, for package exports that do not support extensionless deep imports. */
  preserveFilePath?: boolean;
}

export interface BarrelAnalyzerOptions {
  resolvePackage: (pkgName: string) => Promise<PackageEntry | null>;
  /** Resolves to an absolute file path on disk. */
  resolveRelative?: (fromFile: string, relSpec: string) => Promise<string | null>;
}

// `Transpiler.scan` gives the export names but not their sources; this regex supplies the name↔source mapping.
const REEXPORT_RE =
  /(?:^|\n)\s*export\s+(?:type\s+)?(?:(\*)(?:\s+as\s+(\w+))?|\{\s*([^}]*?)\s*\})\s+from\s+(["'])([^"']+)\4;?/g;

// `Transpiler.scan` omits `export { A, B as C };`. The lookahead sits right after `}` so whitespace backtracking
// cannot also match `export type { X } from "./y"`.
const LOCAL_NAMED_RE = /(?:^|\n)\s*export\s+\{\s*([^}]*?)\s*\}(?!\s*from)/g;

const CANDIDATE_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

export class BarrelAnalyzer {
  readonly #logger = new Logger("BarrelAnalyzer");
  readonly #opts: BarrelAnalyzerOptions;
  readonly #cache = new Map<string, Promise<BarrelExportMap | null>>();
  readonly #tsTranspiler = new Bun.Transpiler({ loader: "ts" });
  readonly #tsxTranspiler = new Bun.Transpiler({ loader: "tsx" });

  constructor(opts: BarrelAnalyzerOptions) {
    this.#opts = opts;
  }

  analyze(pkgName: string): Promise<BarrelExportMap | null> {
    const cached = this.#cache.get(pkgName);
    if (cached) return cached;
    const promise = this.#analyzeSafe(pkgName);
    this.#cache.set(pkgName, promise);
    return promise;
  }

  async #analyzeSafe(pkgName: string): Promise<BarrelExportMap | null> {
    try {
      return await this.#analyzeUncached(pkgName);
    } catch (err) {
      this.#logger.error(`analyze failed for ${pkgName}: ${(err as Error).message}`);
      return null;
    }
  }

  async #analyzeUncached(pkgName: string): Promise<BarrelExportMap | null> {
    const pkg = await this.#opts.resolvePackage(pkgName);
    if (!pkg) return null;
    const map: BarrelExportMap = new Map();
    const visited = new Set<string>();
    await this.#walk(pkg.entryFile, pkg, map, visited);
    return map;
  }

  async #walk(absFile: string, pkg: PackageEntry, map: BarrelExportMap, visited: Set<string>): Promise<void> {
    if (visited.has(absFile)) return;
    visited.add(absFile);
    const source = await readIfExists(absFile);
    if (source === null) return;
    const currentSubpath = this.#subpathFor(pkg, absFile);
    if (!currentSubpath) return;

    // scan leaves out `export *` names (they surface only as imports), so star re-exports are walked below.
    const authoritative = this.#scanExports(source, absFile);
    // Barrels rarely proxy defaults, and rewriting `import X from "pkg"` needs different semantics.
    authoritative.delete("default");

    const attributed = new Set<string>();

    REEXPORT_RE.lastIndex = 0;
    let m: RegExpExecArray | null = REEXPORT_RE.exec(source);
    while (m !== null) {
      const star = m[1];
      const nsAs = m[2];
      const namedList = m[3];
      const spec = m[5] ?? "";
      m = REEXPORT_RE.exec(source);
      if (!isRelative(spec)) continue;

      if (star) {
        if (nsAs) {
          // A namespace re-export cannot be flattened into subpath imports, nor is it a local declaration.
          authoritative.delete(nsAs);
          continue;
        }
        const targetAbs = await this.#resolveRel(absFile, spec);
        if (!targetAbs) continue;
        await this.#walk(targetAbs, pkg, map, visited);
        continue;
      }

      if (namedList !== undefined) {
        const targetAbs = await this.#resolveRel(absFile, spec);
        if (!targetAbs) continue;
        const targetSubpath = this.#subpathFor(pkg, targetAbs);
        if (!targetSubpath) continue;
        for (const item of parseNamedList(namedList)) {
          if (item.isType) continue;
          if (item.imported === "default") continue;
          if (!authoritative.has(item.local)) continue;
          attributed.add(item.local);
          if (!map.has(item.local)) {
            map.set(item.local, { subpath: targetSubpath, originalName: item.imported });
          }
        }
      }
    }

    LOCAL_NAMED_RE.lastIndex = 0;
    let n: RegExpExecArray | null = LOCAL_NAMED_RE.exec(source);
    while (n !== null) {
      const body = n[1] ?? "";
      n = LOCAL_NAMED_RE.exec(source);
      for (const item of parseNamedList(body)) {
        if (item.isType) continue;
        if (item.imported === "default") continue;
        if (!authoritative.has(item.local)) continue;
        attributed.add(item.local);
        if (!map.has(item.local)) {
          map.set(item.local, { subpath: currentSubpath, originalName: item.imported });
        }
      }
    }

    for (const name of authoritative) {
      if (attributed.has(name)) continue;
      if (map.has(name)) continue;
      map.set(name, { subpath: currentSubpath, originalName: name });
    }
  }

  #scanExports(source: string, absFile: string): Set<string> {
    try {
      const transpiler = [".tsx", ".jsx"].includes(path.extname(absFile)) ? this.#tsxTranspiler : this.#tsTranspiler;
      const { exports } = transpiler.scan(source);
      return new Set(exports);
    } catch (err) {
      this.#logger.error(`scan failed: ${(err as Error).message}`);
      return new Set();
    }
  }

  #subpathFor(pkg: PackageEntry, absFile: string): string | null {
    const rel = path.relative(pkg.pkgDir, absFile);
    if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null;
    if (pkg.preserveFilePath) return `${pkg.pkgName}/${rel.split(path.sep).join("/")}`;
    const noExt = stripKnownExt(rel);
    // `xxx/index` collapses to `xxx`: callers import `@pkg/xxx`, never `@pkg/xxx/index`.
    const tail = collapseIndex(noExt);
    if (tail === "") return pkg.pkgName;
    return `${pkg.pkgName}/${tail.split(path.sep).join("/")}`;
  }

  async #resolveRel(fromFile: string, relSpec: string): Promise<string | null> {
    if (this.#opts.resolveRelative) return this.#opts.resolveRelative(fromFile, relSpec);
    return defaultResolveRelative(fromFile, relSpec);
  }
}

const isRelative = (spec: string): boolean => {
  return spec.startsWith("./") || spec.startsWith("../") || spec === "." || spec === "..";
};

const readIfExists = async (absFile: string): Promise<string | null> => {
  const file = Bun.file(absFile);
  if (!(await file.exists())) return null;
  return file.text();
};

const defaultResolveRelative = async (fromFile: string, relSpec: string): Promise<string | null> => {
  const baseDir = path.dirname(fromFile);
  const joined = path.resolve(baseDir, relSpec);
  if (path.extname(joined)) {
    if (await Bun.file(joined).exists()) return joined;
    return null;
  }
  for (const ext of CANDIDATE_EXTS) {
    const cand = joined + ext;
    if (await Bun.file(cand).exists()) return cand;
  }
  for (const ext of CANDIDATE_EXTS) {
    const cand = path.join(joined, `index${ext}`);
    if (await Bun.file(cand).exists()) return cand;
  }
  return null;
};

const stripKnownExt = (relPath: string): string => {
  for (const ext of CANDIDATE_EXTS) {
    if (relPath.endsWith(ext)) return relPath.slice(0, -ext.length);
  }
  return relPath;
};

const collapseIndex = (relPathNoExt: string): string => {
  const parts = relPathNoExt.split(path.sep);
  if (parts[parts.length - 1] === "index") parts.pop();
  return parts.join(path.sep);
};
