import { readdir } from "node:fs/promises";
import path from "node:path";
import { capitalize } from "akanjs/common";
import { AppExecutor, LibExecutor, type SysExecutor, type WorkspaceExecutor } from "./executors";
import { FileSys } from "./fileSys";
import type { PackageJson } from "./types";

export type AkanContextFormat = "json" | "markdown";
export type AkanModuleKind = "domain" | "service" | "scalar";
export type AkanDiagnosticSeverity = "warning" | "error";

export interface AkanAbstractSummary {
  path: string;
  exists: boolean;
  title?: string;
  headings: string[];
  content?: string;
}

export interface AkanModuleContext {
  kind: AkanModuleKind;
  name: string;
  folderName: string;
  sysName: string;
  sysType: "app" | "lib";
  path: string;
  abstract: AkanAbstractSummary;
  files: string[];
}

export interface AkanSysContext {
  type: "app" | "lib";
  name: string;
  path: string;
  hasConfig: boolean;
  modules: AkanModuleContext[];
}

export interface AkanPackageContext {
  name: string;
  path: string;
  version?: string;
}

export interface AkanWorkspaceContext {
  schemaVersion: 1;
  repoName: string;
  root: string;
  packageVersion?: string;
  apps: AkanSysContext[];
  libs: AkanSysContext[];
  pkgs: AkanPackageContext[];
  generatedFiles: string[];
  validationCommands: string[];
}

export interface AkanDiagnostic {
  severity: AkanDiagnosticSeverity;
  code: string;
  message: string;
  path?: string;
}

export interface AkanDoctorResult {
  schemaVersion: 1;
  strict: boolean;
  diagnostics: AkanDiagnostic[];
}

export interface AkanContextOptions {
  app?: string | null;
  module?: string | null;
  includeAbstractContent?: boolean;
}

const generatedFiles = [
  "cnst.ts",
  "db.ts",
  "dict.ts",
  "option.ts",
  "sig.ts",
  "srv.ts",
  "st.ts",
  "useClient.ts",
  "useServer.ts",
];

const appRootAllowFiles = new Set([
  "akan.app.json",
  "akan.config.ts",
  "capacitor.config.ts",
  "client.ts",
  "main.ts",
  "package.json",
  "server.ts",
  "tsconfig.json",
]);

const appRootAllowDirs = new Set([
  ".akan",
  "android",
  "common",
  "env",
  "ios",
  "lib",
  "page",
  "private",
  "public",
  "script",
  "srvkit",
  "ui",
  "webkit",
]);

const safeReadDir = async (dirPath: string) => {
  try {
    return (await readdir(dirPath, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
};

const safeReadText = async (filePath: string) => {
  try {
    return await FileSys.readText(filePath);
  } catch {
    return null;
  }
};

const safeReadJson = async <T>(filePath: string) => {
  try {
    return await FileSys.readJson<T>(filePath);
  } catch {
    return null;
  }
};

const parseAbstractSummary = (
  relativePath: string,
  content: string | null,
  includeContent: boolean,
): AkanAbstractSummary => {
  if (content === null) return { path: relativePath, exists: false, headings: [] };
  const headings = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("#"))
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .filter(Boolean);
  return {
    path: relativePath,
    exists: true,
    title: headings[0],
    headings: headings.slice(0, 8),
    ...(includeContent ? { content } : {}),
  };
};

const readFiles = async (dirPath: string) =>
  (await safeReadDir(dirPath))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();

const getRelative = (workspace: WorkspaceExecutor, absolutePath: string) =>
  path.relative(workspace.workspaceRoot, absolutePath).replaceAll(path.sep, "/");

const createModuleContext = async (
  workspace: WorkspaceExecutor,
  sys: SysExecutor,
  kind: AkanModuleKind,
  folderName: string,
  moduleName: string,
  includeAbstractContent: boolean,
): Promise<AkanModuleContext> => {
  const modulePath =
    kind === "scalar"
      ? path.join(sys.cwdPath, "lib", "__scalar", moduleName)
      : path.join(sys.cwdPath, "lib", folderName);
  const relativePath = getRelative(workspace, modulePath);
  const abstractPath = `${relativePath}/${moduleName}.abstract.md`;
  const abstractContent = await safeReadText(path.join(workspace.workspaceRoot, abstractPath));
  return {
    kind,
    name: moduleName,
    folderName,
    sysName: sys.name,
    sysType: sys.type,
    path: relativePath,
    abstract: parseAbstractSummary(abstractPath, abstractContent, includeAbstractContent),
    files: await readFiles(modulePath),
  };
};

const getSysModules = async (
  workspace: WorkspaceExecutor,
  sys: SysExecutor,
  {
    includeAbstractContent = false,
    module: moduleFilter,
  }: { includeAbstractContent?: boolean; module?: string | null } = {},
) => {
  const libPath = path.join(sys.cwdPath, "lib");
  const entries = await safeReadDir(libPath);
  const modules: AkanModuleContext[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "__scalar") continue;
    if (entry.name.startsWith("__")) continue;
    if (entry.name.startsWith("_")) {
      const serviceName = entry.name.replace(/^_+/, "");
      if (moduleFilter && moduleFilter !== serviceName && moduleFilter !== entry.name) continue;
      if (!(await FileSys.fileExists(path.join(libPath, entry.name, `${serviceName}.service.ts`)))) continue;
      modules.push(
        await createModuleContext(workspace, sys, "service", entry.name, serviceName, includeAbstractContent),
      );
    } else {
      if (moduleFilter && moduleFilter !== entry.name) continue;
      if (!(await FileSys.fileExists(path.join(libPath, entry.name, `${entry.name}.constant.ts`)))) continue;
      modules.push(await createModuleContext(workspace, sys, "domain", entry.name, entry.name, includeAbstractContent));
    }
  }

  const scalarRoot = path.join(libPath, "__scalar");
  for (const entry of await safeReadDir(scalarRoot)) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
    if (moduleFilter && moduleFilter !== entry.name) continue;
    if (!(await FileSys.fileExists(path.join(scalarRoot, entry.name, `${entry.name}.constant.ts`)))) continue;
    modules.push(await createModuleContext(workspace, sys, "scalar", entry.name, entry.name, includeAbstractContent));
  }

  return modules.sort((a, b) => `${a.sysName}:${a.path}`.localeCompare(`${b.sysName}:${b.path}`));
};

const getSysContext = async (
  workspace: WorkspaceExecutor,
  type: "app" | "lib",
  name: string,
  options: AkanContextOptions,
): Promise<AkanSysContext> => {
  const sys = type === "app" ? AppExecutor.from(workspace, name) : LibExecutor.from(workspace, name);
  return {
    type,
    name,
    path: `${type}s/${name}`,
    hasConfig: await FileSys.fileExists(path.join(sys.cwdPath, "akan.config.ts")),
    modules: await getSysModules(workspace, sys, {
      includeAbstractContent: options.includeAbstractContent,
      module: options.module,
    }),
  };
};

export class AkanContextAnalyzer {
  static async analyze(workspace: WorkspaceExecutor, options: AkanContextOptions = {}): Promise<AkanWorkspaceContext> {
    const [appNames, libNames, pkgNames] = await workspace.getExecs();
    const rootPackageJson = await safeReadJson<PackageJson>(path.join(workspace.workspaceRoot, "package.json"));
    const filteredApps = options.app ? appNames.filter((name) => name === options.app) : appNames;
    const [apps, libs, pkgs] = await Promise.all([
      Promise.all(filteredApps.map((name) => getSysContext(workspace, "app", name, options))),
      Promise.all(libNames.map((name) => getSysContext(workspace, "lib", name, options))),
      Promise.all(
        pkgNames.map(async (name) => {
          const packageJson = await safeReadJson<PackageJson>(
            path.join(workspace.workspaceRoot, "pkgs", name, "package.json"),
          );
          return {
            name,
            path: `pkgs/${name}`,
            ...(packageJson?.version ? { version: packageJson.version } : {}),
          };
        }),
      ),
    ]);

    return {
      schemaVersion: 1,
      repoName: workspace.repoName,
      root: workspace.workspaceRoot,
      packageVersion: rootPackageJson?.dependencies?.akanjs ?? rootPackageJson?.devDependencies?.["@akanjs/devkit"],
      apps,
      libs,
      pkgs,
      generatedFiles,
      validationCommands: ["akan lint <app-or-lib-or-pkg>", "akan build <app-name>", "akan start <app-name>"],
    };
  }

  static async doctor(
    workspace: WorkspaceExecutor,
    { strict = false }: { strict?: boolean } = {},
  ): Promise<AkanDoctorResult> {
    const context = await AkanContextAnalyzer.analyze(workspace);
    const diagnostics: AkanDiagnostic[] = [];

    for (const app of context.apps) {
      const appPath = path.join(workspace.workspaceRoot, app.path);
      for (const entry of await safeReadDir(appPath)) {
        const allowed = entry.isDirectory() ? appRootAllowDirs.has(entry.name) : appRootAllowFiles.has(entry.name);
        if (!allowed) {
          diagnostics.push({
            severity: "warning",
            code: "app-root-unknown-entry",
            path: `${app.path}/${entry.name}`,
            message: `Unexpected ${entry.isDirectory() ? "folder" : "file"} in app root: ${app.path}/${entry.name}`,
          });
        }
      }
    }

    for (const sys of [...context.apps, ...context.libs]) {
      for (const module of sys.modules) {
        if (!module.abstract.exists) {
          diagnostics.push({
            severity: strict ? "error" : "warning",
            code: "module-abstract-missing",
            path: module.abstract.path,
            message: `${capitalize(module.kind)} module ${sys.name}:${module.name} should include ${module.abstract.path}`,
          });
        }
      }
    }

    return { schemaVersion: 1, strict, diagnostics };
  }

  static findModules(context: AkanWorkspaceContext, moduleName?: string | null) {
    const modules = [...context.apps, ...context.libs].flatMap((sys) => sys.modules);
    return moduleName
      ? modules.filter((module) => module.name === moduleName || module.folderName === moduleName)
      : modules;
  }

  static renderMarkdown(context: AkanWorkspaceContext, { module: moduleName }: { module?: string | null } = {}) {
    const lines = [`# Akan Workspace Context`, "", `- Repo: ${context.repoName}`, `- Root: ${context.root}`];
    if (context.packageVersion) lines.push(`- Akan version: ${context.packageVersion}`);
    lines.push("", "## Apps", ...context.apps.map((app) => `- ${app.name}: ${app.modules.length} module(s)`));
    lines.push("", "## Libraries", ...context.libs.map((lib) => `- ${lib.name}: ${lib.modules.length} module(s)`));
    lines.push(
      "",
      "## Packages",
      ...context.pkgs.map((pkg) => `- ${pkg.name}${pkg.version ? ` (${pkg.version})` : ""}`),
    );

    const modules = AkanContextAnalyzer.findModules(context, moduleName);
    lines.push("", "## Modules");
    for (const module of modules) {
      lines.push("", `### ${module.sysName}:${module.name} (${module.kind})`, `- Path: ${module.path}`);
      lines.push(`- Abstract: ${module.abstract.exists ? module.abstract.path : "missing"}`);
      if (module.abstract.exists && module.abstract.content) lines.push("", module.abstract.content.trim(), "");
      else if (module.abstract.headings.length)
        lines.push(`- Abstract headings: ${module.abstract.headings.join(", ")}`);
      lines.push(`- Files: ${module.files.join(", ") || "none"}`);
    }

    lines.push("", "## Validation", ...context.validationCommands.map((command) => `- \`${command}\``));
    return `${lines.join("\n")}\n`;
  }
}
