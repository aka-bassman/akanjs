import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { App } from "../commandDecorators";

export interface PageEntry {
  key: string;
  moduleAbsPath: string;
  seedAbsPaths?: string[];
}

const LAYOUT_KEY_RE = /^\.\/(.+\/)?_layout\.(tsx|ts|jsx|js)$/;

async function appHasStModule(appCwdPath: string): Promise<boolean> {
  return Bun.file(path.join(appCwdPath, "lib", "st.ts")).exists();
}

const IMPLICIT_LAYOUT_DIR = path.join(".akan", "generated", "root-layouts");

interface RootBoundary {
  sourceKey: string | null;
  sourceAbsPath: string | null;
  segments: string[];
}

function getRootBoundarySegments(key: string): string[] | null {
  const match = LAYOUT_KEY_RE.exec(key);
  if (!match) return null;
  const prefix = match[1]?.replace(/\/$/, "");
  if (!prefix) return [];
  return prefix.split("/").filter(Boolean);
}

function implicitRootLayoutKey(segments: string[]): string {
  return `./${[...segments, "__root_layout"].join("/")}.tsx`;
}

function implicitRootLayoutAbsPath(appCwdPath: string, segments: string[]): string {
  const filename = segments.length ? `${segments.join("__")}__root_layout.tsx` : "__root_layout.tsx";
  return path.join(path.resolve(appCwdPath), IMPLICIT_LAYOUT_DIR, filename);
}

function isRootBoundarySegments(segments: string[], basePaths: Iterable<string>): boolean {
  const firstVisibleIndex = segments.findIndex((segment) => !/^\(.+\)$/.test(segment));
  if (firstVisibleIndex === -1) return segments.length <= 1;
  if (segments.slice(firstVisibleIndex + 1).some((segment) => /^\(.+\)$/.test(segment))) return false;
  const visible = segments.slice(firstVisibleIndex);
  const allowedBasePaths = new Set([...basePaths].map((basePath) => basePath.trim()).filter(Boolean));
  return visible.length === 1 && (firstVisibleIndex > 0 || allowedBasePaths.has(visible[0] ?? ""));
}

function findRootBoundaries(pageKeys: string[], appCwdPath: string, basePaths: Iterable<string>): RootBoundary[] {
  const boundaries = new Map<string, RootBoundary>();
  for (const key of pageKeys) {
    const segments = getRootBoundarySegments(key);
    if (!segments) continue;
    if (!isRootBoundarySegments(segments, basePaths)) continue;
    const id = segments.join("/");
    boundaries.set(id, {
      sourceKey: key,
      sourceAbsPath: path.resolve(appCwdPath, "page", key.replace(/^\.\//, "")),
      segments,
    });
  }
  const hasExplicitRootBoundary = [...boundaries.values()].some((boundary) => boundary.segments.length === 0);
  if (!hasExplicitRootBoundary && boundaries.size === 0) {
    boundaries.set("", { sourceKey: null, sourceAbsPath: null, segments: [] });
  }
  return [...boundaries.values()].sort((a, b) => a.segments.join("/").localeCompare(b.segments.join("/")));
}

function hasAncestorRootBoundary(boundary: RootBoundary, boundaries: RootBoundary[]): boolean {
  return boundaries.some(
    (candidate) =>
      candidate !== boundary &&
      candidate.segments.length < boundary.segments.length &&
      candidate.segments.every((segment, index) => boundary.segments[index] === segment),
  );
}

function findExplicitRootLayoutAbsPath(pageKeys: string[], appCwdPath: string): string | null {
  const rootLayoutKey = pageKeys.find((key) => {
    const segments = getRootBoundarySegments(key);
    return segments !== null && segments.length === 0;
  });
  return rootLayoutKey ? path.resolve(appCwdPath, "page", rootLayoutKey.replace(/^\.\//, "")) : null;
}

function routePrefixForSegments(segments: string[]): string | null {
  const visible = segments.filter((segment) => !/^\(.+\)$/.test(segment));
  return visible[0] ?? null;
}

async function assertEnvClientConvention(appCwdPath: string, appName: string) {
  const envPath = path.join(appCwdPath, "env", "env.client.ts");
  if (!(await Bun.file(envPath).exists())) {
    throw new Error(
      `[route-convention] app "${appName}" must provide env/env.client.ts exporting "env" for generated System.Provider`,
    );
  }
}

async function writeGeneratedRootLayoutFile(opts: {
  appCwdPath: string;
  appName: string;
  boundary: RootBoundary;
  rootSourceAbsPath: string | null;
  includeStInit: boolean;
  includeSystemProvider: boolean;
}): Promise<string> {
  await assertEnvClientConvention(opts.appCwdPath, opts.appName);
  const absPath = implicitRootLayoutAbsPath(opts.appCwdPath, opts.boundary.segments);
  await mkdir(path.dirname(absPath), { recursive: true });
  const sourceRel = opts.boundary.sourceAbsPath
    ? path.relative(path.dirname(absPath), opts.boundary.sourceAbsPath).split(path.sep).join("/")
    : null;
  const sourceSpecifier = sourceRel ? (sourceRel.startsWith(".") ? sourceRel : `./${sourceRel}`) : null;
  const inheritedSourceAbsPath =
    opts.rootSourceAbsPath && opts.rootSourceAbsPath !== opts.boundary.sourceAbsPath ? opts.rootSourceAbsPath : null;
  const inheritedSourceRel = inheritedSourceAbsPath
    ? path.relative(path.dirname(absPath), inheritedSourceAbsPath).split(path.sep).join("/")
    : null;
  const inheritedSourceSpecifier = inheritedSourceRel
    ? inheritedSourceRel.startsWith(".")
      ? inheritedSourceRel
      : `./${inheritedSourceRel}`
    : null;
  const clientImport = opts.includeStInit
    ? `import { st } from "@apps/${opts.appName}/client";\nvoid st;\n`
    : `import "@apps/${opts.appName}/client";\n`;
  const inheritedImport = inheritedSourceSpecifier
    ? `import * as inheritedLayout from ${JSON.stringify(inheritedSourceSpecifier)};\n`
    : "const inheritedLayout = {};\n";
  const prefix = routePrefixForSegments(opts.boundary.segments);
  const userImport = sourceSpecifier
    ? `import UserLayout, * as userLayout from ${JSON.stringify(sourceSpecifier)};\n`
    : "const UserLayout = ({ children }) => children;\nconst userLayout = {};\n";
  const source = opts.includeSystemProvider
    ? `import type { LayoutProps, PageProps } from "akanjs/client";\nimport { loadFonts } from "akanjs/client";\nimport { System } from "akanjs/ui";\nimport { env } from "@apps/${opts.appName}/env/env.client";\n${clientImport}${inheritedImport}${userImport}\nconst userFonts = userLayout.fonts ?? inheritedLayout.fonts ?? [];\nconst defaultFonts = userFonts.filter((font) => font.default);\nif (defaultFonts.length > 1) throw new Error("[route-convention] only one default font is allowed per root layout");\nconst defaultFont = defaultFonts[0];\nconst defaultFontClassName = defaultFont ? (defaultFont.className ?? \`font-\${defaultFont.name}\`) : undefined;\n\nexport async function generateHead(props: PageProps) {\n  if (userLayout.generateHead) return userLayout.generateHead(props);\n  if (userLayout.head !== undefined) return userLayout.head;\n  if (inheritedLayout.generateHead) return inheritedLayout.generateHead(props);\n  return inheritedLayout.head;\n}\n\nexport const NotFound = userLayout.NotFound ?? inheritedLayout.NotFound;\nexport const Error = userLayout.Error ?? inheritedLayout.Error;\n\nexport default function GeneratedLayout({ children, params, searchParams }: LayoutProps) {\n  return (\n    <System.Provider\n      of={GeneratedLayout as never}\n      appName=${JSON.stringify(opts.appName)}\n      ${prefix ? `prefix=${JSON.stringify(prefix)}\n      ` : ""}params={params}\n      manifest={userLayout.manifest ?? inheritedLayout.manifest}\n      env={env}\n      theme={userLayout.theme ?? inheritedLayout.theme}\n      fonts={loadFonts(userFonts)}\n      className={defaultFontClassName}\n      gaTrackingId={userLayout.gaTrackingId ?? inheritedLayout.gaTrackingId}\n      layoutStyle={userLayout.layoutStyle ?? inheritedLayout.layoutStyle}\n      reconnect={userLayout.reconnect ?? inheritedLayout.reconnect ?? false}\n    >\n      <UserLayout params={params} searchParams={searchParams}>{children}</UserLayout>\n    </System.Provider>\n  );\n}\n`
    : `import type { LayoutProps, PageProps } from "akanjs/client";\n${inheritedImport}${userImport}\nexport async function generateHead(props: PageProps) {\n  if (userLayout.generateHead) return userLayout.generateHead(props);\n  if (userLayout.head !== undefined) return userLayout.head;\n  if (inheritedLayout.generateHead) return inheritedLayout.generateHead(props);\n  return inheritedLayout.head;\n}\n\nexport const NotFound = userLayout.NotFound ?? inheritedLayout.NotFound;\nexport const Error = userLayout.Error ?? inheritedLayout.Error;\n\nexport default function GeneratedLayout({ children, params, searchParams }: LayoutProps) {\n  return <UserLayout params={params} searchParams={searchParams}>{children}</UserLayout>;\n}\n`;
  await Bun.write(absPath, source);
  return absPath;
}

/**
 * When no root `page/_layout.*` exists on disk, merge a generated implicit root layout
 * (with generated client runtime registration and optional `void st` when `lib/st.ts` exists).
 */
export async function resolveSsrPageEntries(opts: {
  appCwdPath: string;
  appName: string;
  pageKeys: string[];
  basePaths?: Iterable<string>;
}): Promise<PageEntry[]> {
  const absPageDir = path.resolve(opts.appCwdPath, "page");
  const hasSt = await appHasStModule(opts.appCwdPath);
  const basePaths = opts.basePaths ?? [];
  const rootSourceAbsPath = findExplicitRootLayoutAbsPath(opts.pageKeys, opts.appCwdPath);
  const rootBoundaries = findRootBoundaries(opts.pageKeys, opts.appCwdPath, basePaths);
  const rootLayoutKeys = new Set(
    opts.pageKeys.filter((key) => {
      const segments = getRootBoundarySegments(key);
      return segments !== null && isRootBoundarySegments(segments, basePaths);
    }),
  );
  const base = opts.pageKeys
    .filter((key) => !rootLayoutKeys.has(key))
    .map((key) => ({
      key,
      moduleAbsPath: path.resolve(absPageDir, key),
    }));
  const generated = await Promise.all(
    rootBoundaries.map(async (boundary) => ({
      key: implicitRootLayoutKey(boundary.segments),
      moduleAbsPath: await writeGeneratedRootLayoutFile({
        appCwdPath: opts.appCwdPath,
        appName: opts.appName,
        boundary,
        rootSourceAbsPath,
        includeStInit: hasSt && boundary.segments.length === 0,
        includeSystemProvider: !hasAncestorRootBoundary(boundary, rootBoundaries),
      }),
      seedAbsPaths: [...new Set([boundary.sourceAbsPath, rootSourceAbsPath].filter((absPath) => absPath !== null))],
    })),
  );
  const entries = [...base, ...generated];
  entries.sort((a, b) => a.key.localeCompare(b.key));
  return entries;
}

export async function resolveSsrPageEntriesForApp(app: App, pageKeys: string[]): Promise<PageEntry[]> {
  const config = await app.getConfig();
  return resolveSsrPageEntries({ appCwdPath: app.cwdPath, appName: app.name, pageKeys, basePaths: config.basePaths });
}
