import { type Lib, runner, type Workspace } from "@akanjs/devkit/commandDecorators";
import { LibExecutor } from "@akanjs/devkit/executors";
import { LibSource } from "@akanjs/devkit/libSource";
import { compareSemver } from "@akanjs/devkit/semver";

export class LibraryRunner extends runner("library") {
  static readonly libraryRepository = "https://github.com/akan-team/akanjs.git";
  async createLibrary(libName: string, workspace: Workspace) {
    await workspace.mkdir(`libs/${libName}`);
    await workspace.applyTemplate({ basePath: `libs/${libName}`, template: "libRoot", dict: { libName } });
    const lib = LibExecutor.from(workspace, libName);
    return lib;
  }
  async removeLibrary(lib: Lib) {
    await lib.workspace.removeDir(`libs/${lib.name}`);
  }

  async #copyInstalledLibrary(workspace: Workspace, libName: string) {
    const installedPackageJson = `node_modules/akanjs/libs/${libName}/package.json`;
    if (!(await workspace.exists(installedPackageJson))) return null;
    await workspace.cp(`node_modules/akanjs/libs/${libName}`, `libs/${libName}`);
    return { origin: "akanjs", sha: await this.#installedAkanVersion(workspace) };
  }

  async #installedAkanVersion(workspace: Workspace) {
    const manifestPath = "node_modules/akanjs/package.json";
    if (!(await workspace.exists(manifestPath))) return "unknown";
    const { version } = (await workspace.readJson(manifestPath)) as { version?: string };
    return version ?? "unknown";
  }

  async #copyLibraryFromRepository(workspace: Workspace, libName: string) {
    await workspace.mkdir("node_modules/.akan");
    if (await workspace.exists("node_modules/.akan/akanjs")) await workspace.removeDir("node_modules/.akan/akanjs");
    await workspace.exec(`cd node_modules/.akan && git clone ${LibraryRunner.libraryRepository}`);
    await workspace.cp(`node_modules/.akan/akanjs/libs/${libName}`, `libs/${libName}`);
    const sha = await workspace.spawn("git", ["-C", "node_modules/.akan/akanjs", "rev-parse", "HEAD"]);
    return { origin: LibraryRunner.libraryRepository, sha: sha.trim().slice(0, 12) };
  }

  /**
   * Re-runnable: the copy overwrites the library source, which is the point, but the testing env is left
   * alone once it exists — it holds the installing workspace's own values, not the origin's. The commit
   * is skipped when nothing changed, so `git commit` is never handed an empty index.
   */
  async installLibrary(workspace: Workspace, libName: string) {
    const source =
      (await this.#copyInstalledLibrary(workspace, libName)) ??
      (await this.#copyLibraryFromRepository(workspace, libName));
    const testingEnv = `libs/${libName}/env/env.server.testing.ts`;
    if (!(await workspace.exists(testingEnv)))
      await workspace.cp(`libs/${libName}/env/env.server.example.ts`, testingEnv);
    const lib = LibExecutor.from(workspace, libName);
    const stamp = await new LibSource(lib).write(source);
    if (await workspace.hasChanges()) await workspace.commit(`Install ${libName} library from ${stamp.origin}`);
    return lib;
  }

  async libraryStatuses(workspace: Workspace) {
    const libNames = await workspace.getLibs();
    return await Promise.all(libNames.map((libName) => new LibSource(LibExecutor.from(workspace, libName)).status()));
  }
  async mergeLibraryDependencies(lib: Lib) {
    const libPackageJson = await lib.getPackageJson();
    const rootPackageJson = await lib.workspace.getPackageJson();
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {};
    const libDependencies = { ...libPackageJson.dependencies, ...libPackageJson.devDependencies };
    const rootDependencies = { ...rootPackageJson.dependencies, ...rootPackageJson.devDependencies };
    const allDependencies = Object.fromEntries(
      Object.keys({ ...libDependencies, ...rootDependencies }).map((dep) => {
        const libVersion = libDependencies[dep] ?? "0.0.0";
        const rootVersion = rootDependencies[dep] ?? "0.0.0";
        const newerVersion = compareSemver(rootVersion, libVersion) > 0 ? rootVersion : libVersion;
        return [dep, newerVersion];
      }),
    );
    Object.keys(allDependencies)
      .sort()
      .forEach((dep) => {
        if (libPackageJson.dependencies?.[dep] || rootPackageJson.dependencies?.[dep])
          dependencies[dep] = allDependencies[dep];
        else devDependencies[dep] = allDependencies[dep];
      });
    const newRootPackageJson = { ...rootPackageJson, dependencies, devDependencies };
    await lib.workspace.setPackageJson(newRootPackageJson);
    await lib.workspace.spawn("bun", ["install"]);
    await lib.workspace.commit(`Merge ${lib.name} library dependencies`);
  }
}
