import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Logger } from "akanjs/common";
import type { App } from "../commandDecorators";
import { BackendImportGraph } from "./BackendImportGraph";
import { filesChangedSince } from "./devHostPolicy";

describe("BackendImportGraph", () => {
  const tempRoots: string[] = [];

  const makeGraph = async (files: Record<string, string>) => {
    // Realpath, not the mkdtemp path: `Bun.resolveSync` returns real paths, and on macOS `/var/folders`
    // is a symlink, so an unresolved root makes every resolved import look like it escapes the workspace.
    const workspaceRoot = await realpath(await mkdtemp(path.join(os.tmpdir(), "akan-devkit-graph-")));
    tempRoots.push(workspaceRoot);
    const cwdPath = path.join(workspaceRoot, "apps/demo");
    for (const [rel, source] of Object.entries(files)) {
      const filePath = path.join(cwdPath, rel);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, source);
    }
    const app = { cwdPath, workspace: { workspaceRoot } } as unknown as App;
    return { graph: new BackendImportGraph(app, new Logger("test")), cwdPath };
  };

  afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  test("walks the backend entrypoints' import graph", async () => {
    const { graph, cwdPath } = await makeGraph({
      "main.ts": 'import "./server";\n',
      "server.ts": 'import { handler } from "./lib/handler";\nexport default handler;\n',
      "lib/handler.ts": "export const handler = () => null;\n",
      "lib/unreachable.ts": "export const nope = 1;\n",
    });

    expect(await graph.refresh()).toBe(true);
    expect(graph.has(path.join(cwdPath, "lib/handler.ts"))).toBe(true);
    expect(graph.has(path.join(cwdPath, "lib/unreachable.ts"))).toBe(false);
  });

  test("picks up an import added to an already-scanned file", async () => {
    const { graph, cwdPath } = await makeGraph({
      "main.ts": 'import "./server";\n',
      "server.ts": "export default 1;\n",
      "lib/added.ts": "export const added = 1;\n",
    });
    await graph.refresh();
    expect(graph.has(path.join(cwdPath, "lib/added.ts"))).toBe(false);

    // The scan cache is keyed on (mtimeMs, size), so the rewrite must invalidate it.
    await writeFile(path.join(cwdPath, "server.ts"), 'import "./lib/added";\nexport default 1;\n');

    await graph.refresh();
    expect(graph.has(path.join(cwdPath, "lib/added.ts"))).toBe(true);
  });

  test("drops a file that left the graph", async () => {
    const { graph, cwdPath } = await makeGraph({
      "main.ts": 'import "./server";\n',
      "server.ts": 'import "./lib/leaving";\nexport default 1;\n',
      "lib/leaving.ts": "export const leaving = 1;\n",
    });
    await graph.refresh();
    expect(graph.has(path.join(cwdPath, "lib/leaving.ts"))).toBe(true);

    await writeFile(path.join(cwdPath, "server.ts"), "export default 1;\n");
    await graph.refresh();
    expect(graph.has(path.join(cwdPath, "lib/leaving.ts"))).toBe(false);
  });

  test("reports which backend files moved while nobody was watching", async () => {
    const { graph, cwdPath } = await makeGraph({
      "main.ts": 'import "./server";\n',
      "server.ts": 'import "./lib/handler";\nexport default 1;\n',
      "lib/handler.ts": "export const handler = () => null;\n",
    });
    await graph.refresh();
    const before = await graph.fingerprint();

    // The builder is gone here, so no watcher event exists for this save — which is the whole reason
    // the stamps are taken. `mtimeMs` has a coarse clock on Linux, so the size has to move too.
    await writeFile(path.join(cwdPath, "lib/handler.ts"), "export const handler = () => 'changed';\n");

    expect(filesChangedSince(before, await graph.fingerprint())).toEqual([path.join(cwdPath, "lib/handler.ts")]);
  });

  test("says nothing when the tree is untouched, and names a deleted file", async () => {
    const { graph, cwdPath } = await makeGraph({
      "main.ts": 'import "./server";\n',
      "server.ts": 'import "./lib/handler";\nexport default 1;\n',
      "lib/handler.ts": "export const handler = () => null;\n",
    });
    await graph.refresh();
    const before = await graph.fingerprint();
    // A recycle with no edit in it is the common case, and it must not cost a backend restart.
    expect(filesChangedSince(before, await graph.fingerprint())).toEqual([]);

    await rm(path.join(cwdPath, "lib/handler.ts"));
    // Deleted counts as changed: the backend is still running what used to be there.
    expect(filesChangedSince(before, await graph.fingerprint())).toEqual([path.join(cwdPath, "lib/handler.ts")]);
  });

  test("keeps the previous graph when a refresh finds no entrypoints", async () => {
    const { graph, cwdPath } = await makeGraph({
      "main.ts": 'import "./lib/kept";\n',
      "lib/kept.ts": "export const kept = 1;\n",
    });
    await graph.refresh();
    expect(graph.ready).toBe(true);

    await rm(path.join(cwdPath, "main.ts"));
    await graph.refresh();
    // An empty scan is not a failure, so the graph legitimately empties out.
    expect(graph.has(path.join(cwdPath, "lib/kept.ts"))).toBe(false);
  });
});
