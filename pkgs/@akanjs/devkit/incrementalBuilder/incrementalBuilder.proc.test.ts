import { describe, expect, test } from "bun:test";
import path from "node:path";
import type { BuilderMessage, BuilderReq } from "akanjs/server";
import { createTempApp, tempRoots, writeText } from "../testHelpers";

const track = tempRoots();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const until = async (proc: Bun.Subprocess, what: string, condition: () => boolean) => {
  const deadline = Date.now() + 20_000;
  while (!condition()) {
    if (proc.exitCode !== null || Date.now() > deadline) throw new Error(`the builder never sent ${what}`);
    await wait(20);
  }
};

describe("incremental builder process", () => {
  test("says why and where a route's client bundle failed, in its answer, its build status and its log", async () => {
    const { root } = track(await createTempApp("demo"));
    const appDir = path.join(root, "apps/demo");
    // The batch runner looks under the workspace root first: a stand-in for the boot build, which needs a whole app.
    await writeText(
      path.join(root, "pkgs/@akanjs/devkit/incrementalBuilder/buildBatch.proc.ts"),
      `const { generation } = JSON.parse(process.argv[2]);
process.send({ type: "build-batch-result", data: { generation, errors: {}, artifact: {}, optimizedFonts: { css: "", files: [] } } });
`,
    );
    const page = path.join(appDir, "page/_index.tsx");
    await writeText(page, 'import { Broken } from "../ui/Broken";\nexport default Broken;\n');
    await writeText(
      path.join(appDir, "ui/Broken.tsx"),
      '"use client";\nimport { gone } from "./not-there";\nexport const Broken = () => gone;\n',
    );

    const messages: BuilderMessage[] = [];
    const proc = Bun.spawn(["bun", path.join(import.meta.dir, "incrementalBuilder.proc.ts")], {
      cwd: appDir,
      env: {
        ...process.env,
        AKAN_WORKSPACE_ROOT: root,
        AKAN_PUBLIC_APP_NAME: "demo",
        AKAN_PUBLIC_REPO_NAME: "repo",
        AKAN_PUBLIC_SERVE_DOMAIN: "localhost",
        AKAN_PUBLIC_ENV: "local",
        AKAN_WATCH: "0",
      },
      stdio: ["ignore", "ignore", "pipe"],
      serialization: "advanced",
      ipc: (message: BuilderMessage) => {
        messages.push(message);
      },
    });
    try {
      await until(proc, "builder-ready", () => messages.some((message) => message.type === "builder-ready"));
      proc.send({
        type: "build-route",
        id: 1,
        routeId: "page:/",
        seeds: [page],
        knownEntries: [],
        generation: 3,
      } satisfies BuilderReq);
      await until(proc, "build-route-res", () => messages.some((message) => message.type === "build-route-res"));
    } finally {
      proc.kill();
    }
    const log = await new Response(proc.stderr).text();

    const reason = '"./not-there" (apps/demo/ui/Broken.tsx:2:22)';
    expect(messages.find((message) => message.type === "build-route-res")).toMatchObject({
      id: 1,
      ok: false,
      error: expect.stringContaining(reason),
    });
    expect(messages.find((message) => message.type === "build-status")).toMatchObject({
      data: { generation: 3, phase: "route", ok: false, message: expect.stringContaining(reason) },
    });
    expect(log).toContain(reason);
  }, 30_000);
});
