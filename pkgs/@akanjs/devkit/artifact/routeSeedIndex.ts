import path from "node:path";
import { assertUniqueRoutePatterns, compareRouteSpecificity, parseRouteModuleKey } from "akanjs/common";
import type { PageEntry } from "./implicitRootLayout";

export interface RouteSeedEntry {
  routeId: string;
  pattern: string;
  seeds: string[];
}

export interface RouteSeedIndex {
  entries: RouteSeedEntry[];
  globalLayoutFiles: string[];
}

export type SerializedRouteSeedEntry = Pick<RouteSeedEntry, "routeId"> &
  Partial<Pick<RouteSeedEntry, "pattern" | "seeds">>;

export interface SerializedRouteSeedIndex {
  entries: SerializedRouteSeedEntry[];
  globalLayoutFiles?: string[];
}

export function computeRouteSeedIndex(pageEntries: PageEntry[]): RouteSeedIndex {
  const layoutsByPrefix = new Map<string, string[]>();
  const pagesBySegments: Array<{
    key: string;
    pattern: string;
    segments: string[];
    files: string[];
    includeOwnLayout: boolean;
  }> = [];

  for (const { key, moduleAbsPath, seedAbsPaths } of pageEntries) {
    const parsed = parseRouteModuleKey(key);
    const files = [path.resolve(moduleAbsPath), ...(seedAbsPaths ?? []).map((seed) => path.resolve(seed))];
    if (parsed.kind === "layout" || parsed.kind === "overrides") {
      //? Every route under an overrides prefix needs its "use client" wrapper in the client graph, as with a layout.
      const prefix = parsed.routeSegments.join("/");
      const prev = layoutsByPrefix.get(prefix) ?? [];
      layoutsByPrefix.set(prefix, [...prev, ...files]);
    } else if (parsed.kind === "page") {
      pagesBySegments.push({
        key,
        pattern: parsed.pattern,
        segments: parsed.routeSegments,
        files,
        includeOwnLayout: parsed.leaf === "_index",
      });
    }
  }
  assertUniqueRoutePatterns(pagesBySegments);

  const rootLayouts = layoutsByPrefix.get("") ?? [];
  const globalLayoutFiles = rootLayouts;

  const seedEntries: RouteSeedEntry[] = [];
  for (const { pattern, segments, files, includeOwnLayout } of pagesBySegments) {
    const layouts: string[] = [];
    const maxPrefixLength = includeOwnLayout ? segments.length : Math.max(segments.length - 1, 0);
    for (let i = 0; i <= maxPrefixLength; i++) {
      const prefix = segments.slice(0, i).join("/");
      const layoutFiles = layoutsByPrefix.get(prefix);
      if (layoutFiles) layouts.push(...layoutFiles);
    }
    const seeds = Array.from(new Set([...layouts, ...files]));
    const routeId = pattern || "/";
    seedEntries.push({ routeId, pattern: routeId, seeds });
  }
  // Static segments must beat `:param` ones (`/persona/new` is not `[personaId]=new`); the runtime is first-match-wins.
  seedEntries.sort((a, b) => compareRouteSpecificity(a.pattern, b.pattern));
  return { entries: seedEntries, globalLayoutFiles };
}

export const ROUTE_SEED_INDEX_JSON = "route-seed-index.json";

export function serializeRouteSeedIndexForArtifact(
  index: RouteSeedIndex,
  artifactDir: string,
  options: { production?: boolean } = {},
): SerializedRouteSeedIndex {
  const normalizedArtifactDir = path.resolve(artifactDir);
  if (options.production) {
    return {
      entries: index.entries.map((entry) => ({ routeId: entry.routeId })),
    };
  }
  return {
    entries: index.entries.map((entry) => ({
      ...entry,
      seeds: entry.seeds.map((seed) => serializeArtifactPath(seed, normalizedArtifactDir)),
    })),
    globalLayoutFiles: index.globalLayoutFiles.map((file) => serializeArtifactPath(file, normalizedArtifactDir)),
  };
}

export async function saveRouteSeedIndex(
  artifactDir: string,
  index: RouteSeedIndex,
  options: { production?: boolean } = {},
): Promise<string> {
  const absPath = path.join(path.resolve(artifactDir), ROUTE_SEED_INDEX_JSON);
  await Bun.write(
    absPath,
    `${JSON.stringify(serializeRouteSeedIndexForArtifact(index, artifactDir, options), null, 2)}\n`,
  );
  return absPath;
}

function serializeArtifactPath(artifactPath: string, artifactDir: string): string {
  if (!path.isAbsolute(artifactPath)) return artifactPath;
  return path.relative(artifactDir, artifactPath).split(path.sep).join("/");
}
