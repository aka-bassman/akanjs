import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { App } from "../commandDecorators";
import { WatchRootResolver } from "./watchRootResolver";

const roots: string[] = [];

const makeWorkspace = async (dirs: string[]) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "akan-watch-roots-"));
  roots.push(root);
  await Promise.all(dirs.map((dir) => mkdir(path.join(root, dir), { recursive: true })));
  return root;
};

const writeManifest = (workspaceRoot: string, scope: string, libDeps: unknown) =>
  writeFile(
    path.join(workspaceRoot, scope, scope.startsWith("apps/") ? "akan.app.json" : "akan.lib.json"),
    JSON.stringify({ libDeps }),
  );

interface AppStub {
  paths?: Record<string, string[]>;
  libDeps?: string[] | null;
}

const makeApp = (workspaceRoot: string, name: string, { paths = {}, libDeps = null }: AppStub = {}) =>
  ({
    cwdPath: path.join(workspaceRoot, "apps", name),
    workspace: { workspaceRoot },
    getTsConfig: async () => ({ compilerOptions: { paths } }),
    getScanInfo: () => (libDeps ? { type: "app", libDeps } : null),
  }) as unknown as App;

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("WatchRootResolver", () => {
  test("narrows the apps container to the app being served", async () => {
    const workspaceRoot = await makeWorkspace(["apps/app1/page", "apps/app2/page", "libs/util"]);
    const resolved = await new WatchRootResolver(
      makeApp(workspaceRoot, "app1", { paths: { "@apps/*": ["./apps/*"], "@libs/*": ["./libs/*"] } }),
    ).resolve();

    expect(resolved).toContain(path.join(workspaceRoot, "apps/app1"));
    expect(resolved).not.toContain(path.join(workspaceRoot, "apps"));
    expect(resolved).not.toContain(path.join(workspaceRoot, "apps/app2"));
  });

  test("narrows the libs container to the app's own dependencies", async () => {
    const workspaceRoot = await makeWorkspace(["apps/app1/page", "libs/util", "libs/shared"]);
    const resolved = await new WatchRootResolver(
      makeApp(workspaceRoot, "app1", { paths: { "@libs/*": ["./libs/*"] }, libDeps: ["util"] }),
    ).resolve();

    expect(resolved).toContain(path.join(workspaceRoot, "libs/util"));
    expect(resolved).not.toContain(path.join(workspaceRoot, "libs"));
    expect(resolved).not.toContain(path.join(workspaceRoot, "libs/shared"));
  });

  test("drops the libs container entirely when the app depends on no lib", async () => {
    const workspaceRoot = await makeWorkspace(["apps/app1/page", "libs/util"]);
    await writeManifest(workspaceRoot, "apps/app1", []);
    const resolved = await new WatchRootResolver(
      makeApp(workspaceRoot, "app1", { paths: { "@libs/*": ["./libs/*"] } }),
    ).resolve();

    expect(resolved).toEqual([path.join(workspaceRoot, "apps/app1/page")]);
  });

  test("takes the transitive closure from the synced manifests when nothing scanned in-process", async () => {
    const workspaceRoot = await makeWorkspace(["apps/app1/page", "libs/util", "libs/shared", "libs/unused"]);
    await writeManifest(workspaceRoot, "apps/app1", ["shared"]);
    await writeManifest(workspaceRoot, "libs/shared", ["util"]);
    await writeManifest(workspaceRoot, "libs/util", []);
    await writeManifest(workspaceRoot, "libs/unused", []);
    const resolved = await new WatchRootResolver(
      makeApp(workspaceRoot, "app1", { paths: { "@libs/*": ["./libs/*"] } }),
    ).resolve();

    expect(resolved).toContain(path.join(workspaceRoot, "libs/shared"));
    expect(resolved).toContain(path.join(workspaceRoot, "libs/util"));
    expect(resolved).not.toContain(path.join(workspaceRoot, "libs/unused"));
  });

  test("keeps the libs container whole when the app manifest is missing", async () => {
    const workspaceRoot = await makeWorkspace(["apps/app1/page", "libs/util", "libs/shared"]);
    const resolved = await new WatchRootResolver(
      makeApp(workspaceRoot, "app1", { paths: { "@libs/*": ["./libs/*"] } }),
    ).resolve();

    expect(resolved).toContain(path.join(workspaceRoot, "libs"));
  });

  test("keeps the libs container whole when a dependency lib is unsynced", async () => {
    const workspaceRoot = await makeWorkspace(["apps/app1/page", "libs/util", "libs/shared"]);
    await writeManifest(workspaceRoot, "apps/app1", ["shared"]);
    const resolved = await new WatchRootResolver(
      makeApp(workspaceRoot, "app1", { paths: { "@libs/*": ["./libs/*"] } }),
    ).resolve();

    expect(resolved).toContain(path.join(workspaceRoot, "libs"));
  });

  test("resolves a package alias to its own directory, filename and glob stripped", async () => {
    const workspaceRoot = await makeWorkspace(["apps/app1/page", "pkgs/akanjs/base"]);
    const resolved = await new WatchRootResolver(
      makeApp(workspaceRoot, "app1", {
        paths: {
          akanjs: ["./pkgs/akanjs/index.ts"],
          "akanjs/*": ["./pkgs/akanjs/*"],
          missing: ["./pkgs/nothing/index.ts"],
        },
      }),
    ).resolve();

    expect(resolved).toContain(path.join(workspaceRoot, "pkgs/akanjs"));
    expect(resolved).not.toContain(path.join(workspaceRoot, "pkgs/nothing"));
  });

  test("always watches the app's page tree", async () => {
    const workspaceRoot = await makeWorkspace(["apps/app1/page"]);
    const resolved = await new WatchRootResolver(makeApp(workspaceRoot, "app1")).resolve();

    expect(resolved).toEqual([path.join(workspaceRoot, "apps/app1/page")]);
  });
});
