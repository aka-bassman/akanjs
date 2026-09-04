import { afterEach, describe, expect, mock, test } from "bun:test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { CommandContainer } from "@akanjs/devkit/commandDecorators";
import { LibSource } from "@akanjs/devkit/libSource";
import {
  cleanupCliTempWorkspace,
  createCallRecorder,
  createFakeExecutor,
  createTempLib,
  writeJson,
} from "../testHelpers";
import { LibraryRunner } from "./library.runner";
import { LibraryScript } from "./library.script";

const tempRoots: string[] = [];

afterEach(async () => {
  CommandContainer.clear();
  mock.restore();
  await Promise.all(tempRoots.splice(0).map((root) => cleanupCliTempWorkspace(root)));
});

describe("LibraryScript", () => {
  test("syncs and installs libraries through runner boundaries", async () => {
    const script = CommandContainer.get(LibraryScript);
    const recorder = createCallRecorder();
    const lib = createFakeExecutor("shared", {}, recorder);
    const workspace = createFakeExecutor("workspace", {}, recorder);
    script.libraryRunner.createLibrary = async (...args) => {
      recorder.record("createLibrary", ...args);
      return lib as never;
    };
    script.libraryRunner.installLibrary = async (...args) => {
      recorder.record("installLibrary", ...args);
      return lib as never;
    };
    script.libraryRunner.mergeLibraryDependencies = async (...args) =>
      recorder.record("mergeLibraryDependencies", ...args);

    await script.createLibrary("shared", workspace as never);
    await script.installLibrary(workspace as never, "shared");

    expect(recorder.names()).toContain("createLibrary");
    expect(recorder.names()).toContain("shared.scan");
    expect(recorder.names()).toContain("installLibrary");
    expect(recorder.names()).toContain("mergeLibraryDependencies");
  });
});

describe("LibraryRunner", () => {
  test("merges library dependencies into the root package using newer versions", async () => {
    const { root, workspace, lib } = await createTempLib("shared");
    tempRoots.push(root);
    await writeJson(`${root}/package.json`, {
      name: "repo",
      version: "1.0.0",
      description: "repo",
      dependencies: { react: "18.0.0", lodash: "4.17.0" },
      devDependencies: { typescript: "5.0.0" },
    });
    await writeJson(`${root}/libs/shared/package.json`, {
      name: "shared",
      version: "1.0.0",
      description: "shared",
      dependencies: { react: "19.0.0" },
      devDependencies: { typescript: "5.5.0", vite: "5.0.0" },
    });
    workspace.spawn = mock(async () => "") as never;
    workspace.commit = mock(async () => undefined) as never;

    await new LibraryRunner().mergeLibraryDependencies(lib);

    const merged = (await Bun.file(`${root}/package.json`).json()) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(merged.dependencies).toEqual({ lodash: "4.17.0", react: "19.0.0" });
    expect(merged.devDependencies).toEqual({ typescript: "5.5.0", vite: "5.0.0" });
    expect(workspace.spawn).toHaveBeenCalledWith("bun", ["install"]);
    expect(workspace.commit).toHaveBeenCalledWith("Merge shared library dependencies");
  });

  // `installLibrary` has always assumed a git repo — it commits — and now also hashes the copy through
  // `git ls-files`, so the fixture initializes one and only `commit` itself stays mocked.
  const createInstallableLib = async (libName: string) => {
    const { root, workspace } = await createTempLib(libName);
    tempRoots.push(root);
    await mkdir(`${root}/node_modules/akanjs/libs/${libName}/env`, { recursive: true });
    await Bun.write(`${root}/node_modules/akanjs/libs/${libName}/package.json`, `{ "name": "@${libName}" }\n`);
    await Bun.write(`${root}/node_modules/akanjs/package.json`, '{ "version": "3.0.0" }\n');
    await Bun.write(`${root}/node_modules/akanjs/libs/${libName}/env/env.server.example.ts`, "export default {};\n");
    await Bun.write(`${root}/.gitignore`, "node_modules\n");
    await workspace.spawn("git", ["init", "--quiet"]);
    workspace.exec = mock(async () => "") as never;
    workspace.commit = mock(async () => undefined) as never;
    return { root, workspace };
  };

  test("installs a library from the local akanjs package before falling back to git", async () => {
    const { root, workspace } = await createInstallableLib("shared");

    await new LibraryRunner().installLibrary(workspace, "shared");

    expect(await Bun.file(path.join(root, "libs/shared/package.json")).exists()).toBe(true);
    expect(await Bun.file(path.join(root, "libs/shared/env/env.server.testing.ts")).exists()).toBe(true);
    expect(workspace.exec).not.toHaveBeenCalledWith(expect.stringContaining("git clone"));
    expect(workspace.commit).toHaveBeenCalledWith("Install shared library from akanjs");
  });

  test("stamps the installed source and stays re-runnable", async () => {
    const { root, workspace } = await createInstallableLib("stamped");
    const testingEnv = path.join(root, "libs/stamped/env/env.server.testing.ts");
    const runner = new LibraryRunner();

    const lib = await runner.installLibrary(workspace, "stamped");
    const stamp = await new LibSource(lib).read();
    expect(stamp?.origin).toBe("akanjs");
    expect(stamp?.sha).toBe("3.0.0");
    expect((await new LibSource(lib).status()).drift).toBe("clean");

    await Bun.write(testingEnv, "export default { key: 1 };\n");
    await runner.installLibrary(workspace, "stamped");

    expect(await Bun.file(testingEnv).text()).toBe("export default { key: 1 };\n");
    expect((await new LibSource(lib).status()).drift).toBe("clean");
  });
});
