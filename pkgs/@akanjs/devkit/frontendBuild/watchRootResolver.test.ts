import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
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

const makeApp = (workspaceRoot: string, name: string, paths: Record<string, string[]>) =>
  ({
    cwdPath: path.join(workspaceRoot, "apps", name),
    workspace: { workspaceRoot },
    getTsConfig: async () => ({ compilerOptions: { paths } }),
  }) as unknown as App;

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("WatchRootResolver", () => {
  test("narrows the apps container to the app being served", async () => {
    const workspaceRoot = await makeWorkspace(["apps/app1/page", "apps/app2/page", "libs/util"]);
    const resolved = await new WatchRootResolver(
      makeApp(workspaceRoot, "app1", { "@apps/*": ["./apps/*"], "@libs/*": ["./libs/*"] }),
    ).resolve();

    expect(resolved).toContain(path.join(workspaceRoot, "apps/app1"));
    expect(resolved).not.toContain(path.join(workspaceRoot, "apps"));
    expect(resolved).not.toContain(path.join(workspaceRoot, "apps/app2"));
  });

  test("keeps the libs container whole", async () => {
    const workspaceRoot = await makeWorkspace(["apps/app1/page", "libs/util", "libs/shared"]);
    const resolved = await new WatchRootResolver(makeApp(workspaceRoot, "app1", { "@libs/*": ["./libs/*"] })).resolve();

    expect(resolved).toContain(path.join(workspaceRoot, "libs"));
  });

  test("resolves a package alias to its own directory, filename and glob stripped", async () => {
    const workspaceRoot = await makeWorkspace(["apps/app1/page", "pkgs/akanjs/base"]);
    const resolved = await new WatchRootResolver(
      makeApp(workspaceRoot, "app1", {
        akanjs: ["./pkgs/akanjs/index.ts"],
        "akanjs/*": ["./pkgs/akanjs/*"],
        missing: ["./pkgs/nothing/index.ts"],
      }),
    ).resolve();

    expect(resolved).toContain(path.join(workspaceRoot, "pkgs/akanjs"));
    expect(resolved).not.toContain(path.join(workspaceRoot, "pkgs/nothing"));
  });

  test("always watches the app's page tree", async () => {
    const workspaceRoot = await makeWorkspace(["apps/app1/page"]);
    const resolved = await new WatchRootResolver(makeApp(workspaceRoot, "app1", {})).resolve();

    expect(resolved).toEqual([path.join(workspaceRoot, "apps/app1/page")]);
  });
});
