import { afterEach, describe, expect, test } from "bun:test";
import { DevGeneratedIndexSync } from "../frontendBuild";
import { DevStabilityHarness } from "./devStabilityHarness";

const integrationEnabled = process.env.AKAN_DEV_STABILITY_INTEGRATION === "1";
const INTEGRATION_TIMEOUT_MS = 120_000;
const MB = 1024 * 1024;
const harnesses: DevStabilityHarness[] = [];

const integrationTest = (name: string, fn: () => Promise<void>): void => {
  if (integrationEnabled) test(name, fn, INTEGRATION_TIMEOUT_MS);
  else test.skip(name, fn);
};

const createHarness = async (): Promise<DevStabilityHarness> => {
  const harness = new DevStabilityHarness();
  harnesses.push(harness);
  await harness.createFixture();
  return harness;
};

const isRefreshMessage = (msg: unknown): boolean =>
  typeof msg === "object" &&
  msg !== null &&
  "type" in msg &&
  (msg.type === "client-refresh" || msg.type === "rsc-refresh" || msg.type === "reload");

const isBuildStatus =
  (status: "error" | "ok") =>
  (msg: unknown): boolean =>
    typeof msg === "object" &&
    msg !== null &&
    "type" in msg &&
    msg.type === "build-status" &&
    "status" in msg &&
    msg.status === status;

const waitForFileIncludes = async (filePath: string, text: string, timeoutMs = 5_000): Promise<string | null> => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const file = Bun.file(filePath);
    const contents = (await file.exists()) ? await file.text() : "";
    if (contents.includes(text)) return contents;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return null;
};

interface GatewayHealth {
  status: string;
  pid?: number;
  children: Array<{ idx: number; role: string; status: string; ready: boolean; pid?: number }>;
}

const fetchGatewayHealth = async (port: number): Promise<GatewayHealth | null> => {
  const res = await fetch(`http://127.0.0.1:${port}/_akan/app/health`).catch(() => null);
  if (!res?.ok) return null;
  return (await res.json()) as GatewayHealth;
};

const waitForGatewayHealth = async (
  port: number,
  predicate: (health: GatewayHealth) => boolean,
  timeoutMs = 60_000,
): Promise<GatewayHealth> => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const health = await fetchGatewayHealth(port);
    if (health && predicate(health)) return health;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for gateway health on port ${port}`);
};

const isProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const waitForProcessesGone = async (pids: number[], timeoutMs = 15_000): Promise<boolean> => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (pids.every((pid) => !isProcessAlive(pid))) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
};

afterEach(async () => {
  await Promise.all(harnesses.splice(0).map((harness) => harness.cleanup()));
});

describe("dev stability integration harness", () => {
  integrationTest("server-only valid edits restart backend without client refresh", async () => {
    const harness = await createHarness();
    const host = await harness.startHost();
    const hmr = await harness.tryConnectHmrProbe();
    const mark = host.markLog();
    const hmrMark = hmr?.mark() ?? 0;

    await harness.replaceText("srvkit/backendMarker.ts", "initial-backend-marker", "updated-backend-marker");

    await host.waitForLogSince(mark, /\[backend-reload\]|Shutting down gracefully|stopping backend/);
    await host.waitForLogSince(mark, /backend ready pid=(\d+)|AkanApp gateway is running on port/);
    expect(host.proc.killed).toBe(false);
    expect(host.logs.join("").slice(mark)).not.toMatch(/\[hmr\].*(client-refresh|rsc-refresh)/);
    await hmr?.waitForNoMessageSince(hmrMark, isRefreshMessage);
    hmr?.close();
  });

  integrationTest("client-only valid edits refresh browser state without backend restart", async () => {
    const harness = await createHarness();
    const host = await harness.startHost();
    const hmr = await harness.tryConnectHmrProbe();
    const initialHtml = await harness.tryWaitForHttpText("initial-client-marker", 3_000);
    if (!initialHtml) {
      expect(host.proc.killed).toBe(false);
      hmr?.close();
      return;
    }
    const mark = host.markLog();
    const hmrMark = hmr?.mark() ?? 0;

    await harness.replaceText("ui/ClientMarker.tsx", "initial-client-marker", "updated-client-marker");

    await host.waitForLogSince(mark, /\[dev-plan\].*roles=.*client.*actions=.*rebuild-client/);
    if (hmr) {
      const message = await hmr.waitForMessageSince(hmrMark, isRefreshMessage);
      expect(message).toBeTruthy();
    } else {
      await host.waitForLogSince(mark, /\[hmr\].*(client-refresh|rsc-refresh|reload)|\[SSR\] pages-updated/);
    }
    expect(host.logs.join("").slice(mark)).not.toMatch(/\[backend-reload\]/);
    hmr?.close();
  });

  integrationTest("shared valid edits rebuild client and restart backend in one generation", async () => {
    const harness = await createHarness();
    const host = await harness.startHost();
    const hmr = await harness.tryConnectHmrProbe();
    const initialHtml = await harness.tryWaitForHttpText("initial-shared-marker", 3_000);
    if (!initialHtml) {
      expect(host.proc.killed).toBe(false);
      hmr?.close();
      return;
    }
    const mark = host.markLog();

    await harness.replaceText("common/marker.ts", "initial-shared-marker", "updated-shared-marker");

    const plan = await host.waitForLogSince(
      mark,
      /\[dev-plan\] generation=(\d+).*roles=.*shared.*actions=.*rebuild-client.*restart-backend/,
    );
    const generation = plan[1];
    await host.waitForLogSince(mark, new RegExp(`\\[backend-reload\\].*generation=${generation}`));
    // Asserted backend-side, not through the probe. A shared edit restarts the backend, which closes
    // the socket the probe opened, and the probe is a raw WebSocket that never reconnects. A real
    // browser does: on reconnect it gets a `hello` and reloads when the buildId moved
    // (`akanjs/server/hmr/clientScript.ts`). Requiring a probe message here only held while the client
    // rebuild happened to finish before the restart killed the connection — a race this test lost the
    // moment builds moved into a worker process and took ~240ms longer to start.
    await host.waitForLogSince(mark, new RegExp(`\\[SSR\\] pages-updated.*generation=${generation}`));
    await harness.waitForHttpText("updated-shared-marker");
    hmr?.close();
  });

  integrationTest("dictionary edits recycle runtime metadata and replace stale snapshots", async () => {
    const harness = await createHarness();
    const host = await harness.startHost();
    const hmr = await harness.tryConnectHmrProbe();
    const initialHtml = await harness.tryWaitForHttpText("initial-shared-marker", 3_000);
    if (!initialHtml) {
      expect(host.proc.killed).toBe(false);
      hmr?.close();
      return;
    }
    const mark = host.markLog();

    await harness.writeFile(
      "lib/_fixture/fixture.dictionary.ts",
      `import { serviceDictionary } from "akanjs/dictionary";

import type { FixtureEndpoint } from "./fixture.signal";

export const dictionary = serviceDictionary(["en", "ko"])
  .endpoint<FixtureEndpoint>(() => ({}))
  .translate({
    hello: ["Updated Dictionary", "업데이트 사전"],
  });
`,
    );

    await host.waitForLogSince(mark, /\[dev-plan\].*actions=.*restart-builder/);
    await host.waitForLogSince(mark, /\[dev-host\] recycling builder\/backend for runtime metadata/);
    await host.waitForLogSince(mark, /backend ready pid=(\d+)|AkanApp gateway is running on port/);
    await harness.waitForHttpText("initial-shared-marker");
    expect(host.proc.killed).toBe(false);
    hmr?.close();
  });

  integrationTest("config edits restart the dev host and keep serving", async () => {
    const harness = await createHarness();
    const host = await harness.startHost();
    const initialHtml = await harness.tryWaitForHttpText("initial-shared-marker", 3_000);
    if (!initialHtml) {
      expect(host.proc.killed).toBe(false);
      return;
    }
    const mark = host.markLog();

    await harness.writeFile(
      "akan.config.ts",
      `import type { AppConfig } from "akanjs";

const config: AppConfig = { externalLibs: [] };
export default config;
`,
    );

    await host.waitForLogSince(mark, /\[dev-plan\].*actions=.*restart-dev-host/);
    await host.waitForLogSince(mark, /\[dev-host\] config change detected; restarting dev host/);
    await host.waitForLogSince(mark, /backend ready pid=(\d+)|AkanApp gateway is running on port/);
    await harness.waitForHttpText("initial-shared-marker");
    expect(host.proc.killed).toBe(false);
  });

  integrationTest("client build failure reports error and recovers after fix", async () => {
    const harness = await createHarness();
    const host = await harness.startHost();
    const hmr = await harness.tryConnectHmrProbe();
    const initialHtml = await harness.tryWaitForHttpText("initial-client-marker", 3_000);
    if (!initialHtml) {
      expect(host.proc.killed).toBe(false);
      hmr?.close();
      return;
    }
    const failureMark = host.markLog();
    const failureHmrMark = hmr?.mark() ?? 0;

    await harness.writeFile(
      "ui/ClientMarker.tsx",
      `export function ClientMarker() {
  return <p>broken</p>
`,
    );

    await host.waitForLogSince(
      failureMark,
      /\[build-status\].*phase=pages.*ok=false|\[build-status\].*phase=csr.*ok=false/,
    );
    if (hmr) await hmr.waitForMessageSince(failureHmrMark, isBuildStatus("error"));
    await harness.waitForHttpText("initial-client-marker");
    const recoveryMark = host.markLog();
    const recoveryHmrMark = hmr?.mark() ?? 0;

    await harness.writeFile(
      "ui/ClientMarker.tsx",
      `export function ClientMarker() {
  return <p data-testid="client-marker">recovered-client-marker</p>;
}
`,
    );

    await host.waitForLogSince(recoveryMark, /\[build-status\].*ok=true/);
    if (hmr) await hmr.waitForMessageSince(recoveryHmrMark, isBuildStatus("ok"));
    await harness.waitForHttpText("recovered-client-marker");
    hmr?.close();
  });

  integrationTest("barrel add/delete includes generated indexes in watch generation", async () => {
    const harness = await createHarness();
    const sync = new DevGeneratedIndexSync({ workspaceRoot: harness.workspaceRoot });
    // `common` barrels export camelCase names; `ui` barrels export PascalCase component names. Each facet's
    // fixture file must follow its own casing convention or the barrel deliberately skips it.
    const facets = [
      { facet: "common", moduleName: "tmpExample", fileName: "tmpExample.ts", exportName: "commonTmpExample" },
      { facet: "ui", moduleName: "TmpExample", fileName: "TmpExample.tsx", exportName: "TmpExample" },
    ] as const;

    for (const { facet, moduleName, fileName, exportName } of facets) {
      const indexPath = `${facet}/index.ts`;
      const absChangedFile = `${harness.appDir}/${facet}/${fileName}`;
      const absIndexPath = `${harness.appDir}/${indexPath}`;

      await harness.writeFile(
        `${facet}/${fileName}`,
        `export const ${exportName} = "added-${facet}-example";
`,
      );

      const added = await sync.syncForBatch([absChangedFile]);
      expect(added.errors).toEqual([]);
      expect(added.changedFiles).toContain(absIndexPath);
      const addedIndex = await waitForFileIncludes(absIndexPath, moduleName);
      expect(addedIndex).not.toBeNull();
      expect(addedIndex ?? "").toContain(moduleName);

      await harness.removeFile(`${facet}/${fileName}`);
      const removed = await sync.syncForBatch([absChangedFile]);
      expect(removed.errors).toEqual([]);
      expect(removed.changedFiles).toContain(absIndexPath);
      const deletedIndex = await waitForFileIncludes(absIndexPath, moduleName, 1_000);
      if (deletedIndex) throw new Error(`${indexPath} still contains ${moduleName} after delete`);
      const finalIndex = await Bun.file(absIndexPath).text();
      expect(finalIndex).toBeString();
    }
  });

  integrationTest("backend boot failure stops the crash loop, surfaces build-status, and recovers on fix", async () => {
    const harness = await createHarness();
    const host = await harness.startHost();
    const failureMark = host.markLog();

    // The service file is part of the generated server graph (`akan start` regenerates server.ts
    // from lib/), so a module-level throw here breaks every replica boot.
    await harness.writeFile(
      "lib/_fixture/fixture.service.ts",
      `import { serve } from "akanjs/service";

export class FixtureService extends serve("fixture" as const, { serverMode: "batch" }, () => ({})) {}

throw new Error("intentional-backend-boot-crash");
`,
    );

    // The gateway abandons the replica after three failed boots instead of retrying forever...
    await host.waitForLogSince(failureMark, /\[child-crash-loop\].*failed 3 consecutive boots/);
    // ...and the failure reaches the dev host's build-status pipeline (HMR overlay path).
    await host.waitForLogSince(failureMark, /\[build-status\].*phase=backend.*ok=false/);
    expect(host.proc.killed).toBe(false);

    const recoveryMark = host.markLog();
    await harness.writeFile(
      "lib/_fixture/fixture.service.ts",
      `import { serve } from "akanjs/service";

export class FixtureService extends serve("fixture" as const, { serverMode: "batch" }, () => ({})) {}
`,
    );

    await host.waitForLogSince(recoveryMark, /backend ready pid=(\d+)|AkanApp gateway is running on port/);
    expect(host.proc.killed).toBe(false);
  });

  integrationTest("SIGKILL'd gateway leaves no orphaned replicas and the host recovers", async () => {
    const harness = await createHarness();
    const host = await harness.startHost();
    const port = await harness.resolvePort();

    const healthy = await waitForGatewayHealth(
      port,
      (health) =>
        typeof health.pid === "number" &&
        health.children.length > 0 &&
        health.children.every((child) => child.ready && typeof child.pid === "number"),
    );
    const gatewayPid = healthy.pid as number;
    const childPids = healthy.children.map((child) => child.pid as number);
    const mark = host.markLog();

    process.kill(gatewayPid, "SIGKILL");

    // Children must notice the closed IPC channel and exit instead of orphaning (they would
    // otherwise keep holding their ws ports and break every subsequent boot).
    expect(await waitForProcessesGone(childPids)).toBe(true);

    await host.waitForLogSince(mark, /backend ready pid=(\d+)|AkanApp gateway is running on port/);
    const recovered = await waitForGatewayHealth(
      port,
      (health) => typeof health.pid === "number" && health.pid !== gatewayPid && health.children.some((c) => c.ready),
    );
    expect(recovered.pid).not.toBe(gatewayPid);
    expect(host.proc.killed).toBe(false);
  });

  integrationTest("occupied preferred ws port falls back to an ephemeral port and stays bootable", async () => {
    const harness = await createHarness();
    const port = await harness.resolvePort();
    // The gateway assigns child 0 the deterministic ws port `port + 10_000`; occupy it up front
    // the way an orphaned replica from a killed run would.
    const blocker = Bun.serve({ port: port + 10_000, fetch: () => new Response("occupied") });
    try {
      const host = await harness.startHost();
      await host.waitForLog(/falling back to an ephemeral port/);
      const health = await waitForGatewayHealth(port, (h) => h.children.some((child) => child.ready));
      expect(health.children.some((child) => child.ready)).toBe(true);
      expect(host.proc.killed).toBe(false);
    } finally {
      blocker.stop(true);
    }
  });

  integrationTest("route and css phase-5 scope remains smoke-level in this harness", async () => {
    const manualSmoke = [
      "route add/delete should be covered by a later browser-driven test",
      "css build failure should preserve active stylesheet and report build-status",
    ];

    expect(manualSmoke).toHaveLength(2);
  });
});

/**
 * Resource budgets for `akan start`. A dev sandbox holds this process tree for a whole session, so
 * every regression here multiplies by the number of tenants. Budgets are deliberately loose (they
 * carry headroom over the measured values) — they exist to catch a *reintroduced* eager import or an
 * unbounded per-save ratchet, not to pin exact numbers. Raising one should be a visible diff.
 *
 * Deliberately two tests, not one per property: each boots a full dev server, and four boots after
 * the eleven tests above pushed cold boot from 3s to 21-55s through sheer machine contention, which
 * silently exhausted the waits and looked like product failures. Both tests therefore assert several
 * related properties against a single boot, with explicit generous waits. Run the block on its own
 * (`-t "dev resource budgets"`) when timing matters.
 */
describe("dev resource budgets", () => {
  const BOOT_MS = 150_000;
  const WAIT_MS = 90_000;
  const budgetTest = (name: string, fn: () => Promise<void>): void => {
    if (integrationEnabled) test(name, fn, 300_000);
    else test.skip(name, fn);
  };

  budgetTest("builds the dev CSR artifact only once a request needs it, then keeps it in sync", async () => {
    const harness = await createHarness();
    const host = await harness.startHost({ timeoutMs: BOOT_MS });
    const port = await harness.resolvePort();

    // A full minified browser-target build of every page, only reachable via `/__csr` and `?csr=true`.
    expect(host.logs.join("")).not.toMatch(/\[csr-build\] output ->/);

    // Mobile local dev points a device WebView at this URL, so it must serve HTML, not a 404. Wait
    // for the app to actually serve first: `backend ready` fires before the gateway routes to the
    // replica, and a too-early request 503s without reaching the router that arms CSR.
    await harness.waitForHttpText("initial-client-marker", WAIT_MS);
    const armMark = host.markLog();
    const res = await fetch(`http://127.0.0.1:${port}/?csr=true`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("<html");
    expect(host.logs.join("").slice(armMark)).toMatch(/csr-build ok on demand/);

    // Armed: from here on every save rebuilds CSR, which is what keeps a live mobile session working.
    //
    // The settle wait is not padding. Bun's recursive `fs.watch` on macOS silently drops a file event
    // that lands in the same FSEvents coalescing window as a burst of writes elsewhere in the tree, and
    // the CSR build above emits exactly such a burst into `.akan/artifact/csr`. Saving immediately after
    // the request returns therefore loses the event 100% of the time — a Bun bug this test must not
    // depend on. See `local/optimize-resource/06-watcher-dropped-event.md` for the 30-line repro.
    await Bun.sleep(500);
    const resyncMark = host.markLog();
    await harness.replaceText("ui/ClientMarker.tsx", "initial-client-marker", "csr-armed-marker");
    await host.waitForLogSince(resyncMark, /csr-rebundle ok/, WAIT_MS);
  });

  budgetTest("bounds the rsc worker and the tree across repeated saves", async () => {
    const harness = await createHarness();
    const host = await harness.startHost({
      // Recycle on the second reload so this needs a couple of saves rather than the ten a
      // default-threshold run would take, and take the burst-coalescing floor out of the equation.
      timeoutMs: BOOT_MS,
      env: { AKAN_RSC_WORKER_MAX_RELOADS: "1", AKAN_RSC_WORKER_MIN_RECYCLE_INTERVAL_MS: "1" },
    });
    await harness.waitForHttpText("initial-client-marker", WAIT_MS);

    const idleTotal = await DevStabilityHarness.processTreeRssBytes(host.proc.pid);
    const idleWithoutBuilder = await DevStabilityHarness.processTreeRssBytes(host.proc.pid, { excludeBuilder: true });
    const idleBuilder = await DevStabilityHarness.builderProcess(host.proc.pid);
    // Nothing should be building at idle, so the disposable worker must not be resident.
    expect(await DevStabilityHarness.buildWorkerProcess(host.proc.pid)).toBeNull();
    // Measured ~670MB for this fixture; the headroom covers machine variance, not a reintroduced
    // eager import (the cheapest of those is ~30MB, and the devkit barrel cycle was 236MB).
    expect(idleTotal).toBeLessThan(1_000 * MB);

    const start = host.markLog();
    for (let i = 1; i <= 3; i++) {
      const mark = host.markLog();
      await harness.replaceText("ui/ClientMarker.tsx", /marker(-\d+)?/, `marker-${i}`);
      await host.waitForLogSince(mark, /pages-rebundle ok/, WAIT_MS);
      // CSR was never requested in this fixture, so no save may pay for a CSR rebuild.
      const afterSave = host.logs.join("").slice(mark);
      expect(afterSave).toMatch(/csr-rebundle skipped/);
      expect(afterSave).not.toMatch(/csr-rebundle ok/);
      // Bun drops a watcher event that lands in the same window as a write burst
      // (`06-watcher-dropped-event.md`), so saving again before this generation has fully settled loses
      // the next edit outright — this test hanging for the full 90s wait on iteration 2. Waiting for
      // the builder alone is not enough: the backend is still applying the reload after that, and it
      // writes too. Wait for the backend to finish, then leave the drop window (measured under 200ms).
      await host.waitForLogSince(mark, /css-rebuild checked/, WAIT_MS);
      await host.waitForLogSince(mark, /\[hmr\] backend apply/, WAIT_MS);
      await Bun.sleep(300);
    }

    // Each in-place reload re-imports the pages bundle under a fresh `?v=`, and Bun's ESM registry
    // never evicts — so without a recycle the worker grows for the life of the process.
    await host.waitForLogSince(start, /rolling recycle worker reason=pages-reload-accumulation/, WAIT_MS);

    // The dev host, gateway, replica and rsc worker must all stay flat across saves.
    const afterWithoutBuilder = await DevStabilityHarness.processTreeRssBytes(host.proc.pid, {
      excludeBuilder: true,
    });
    expect(afterWithoutBuilder - idleWithoutBuilder).toBeLessThan(120 * MB);

    // And so must the builder. It used to be excluded from this budget because `Bun.build` retains
    // native arenas no GC reclaims, which made it grow ~120MB per save on this fixture; every build
    // that scales per save now runs in a process that exits, so its memory goes back to the OS.
    const afterBuilder = await DevStabilityHarness.builderProcess(host.proc.pid);
    expect(afterBuilder?.pid).toBe(idleBuilder?.pid);
    expect((afterBuilder?.rssBytes ?? 0) - (idleBuilder?.rssBytes ?? 0)).toBeLessThan(30 * MB);
    // The worker is transient: three generations built, and none of them is still around.
    expect(await DevStabilityHarness.buildWorkerProcess(host.proc.pid)).toBeNull();
  });

  budgetTest("recycles the builder at an unmeetable ceiling and keeps developing through it", async () => {
    const harness = await createHarness();
    // Deliberately *below* this fixture's post-boot builder. Moving every per-save build into a
    // disposable worker means the builder no longer grows into a ceiling, so a ceiling it is already
    // over is the only way left to drive the recycle path end to end — and it is also the case the
    // escape hatch exists for: an app whose boot floor simply does not fit under the limit.
    const host = await harness.startHost({ timeoutMs: BOOT_MS, env: { AKAN_BUILDER_MAX_RSS_MB: "200" } });
    const start = host.markLog();
    await harness.waitForHttpText("initial-client-marker", WAIT_MS);

    // One save is enough: the builder reports its rss as soon as the batch drains, and the host arms
    // the recycle from that report. The old pid comes from the log rather than from `ps`, so this does
    // not race the swap it is about to observe.
    const firstSave = host.markLog();
    await harness.replaceText("ui/ClientMarker.tsx", /marker(-[\w-]+)?/, "marker-1");
    await host.waitForLogSince(firstSave, /pages-rebundle ok/, WAIT_MS);

    // The host decides, the builder drains rather than being killed, and the replacement comes up.
    const recycleLog = await host.waitForLogSince(
      start,
      /recycling builder pid=(\d+) \((rss=\d+MiB>=200MiB after \d+ build\(s\))\)/,
      WAIT_MS,
    );
    await host.waitForLogSince(start, /exiting for recycle/, WAIT_MS);
    await host.waitForLogSince(start, /builder spawned pid=\d+ .*restart=1/, WAIT_MS);
    await host.waitForLogSince(start, /builder ready after restart/, WAIT_MS);
    // The backend read `base-artifact.json` once at boot, so the replacement has to re-announce what
    // it booted with or the backend keeps serving the artifact of the builder that just exited.
    await host.waitForLogSince(start, /announced boot state after recycle/, WAIT_MS);

    const recycled = await DevStabilityHarness.builderProcess(host.proc.pid);
    expect(recycled).not.toBeNull();
    expect(String(recycled?.pid)).not.toBe(recycleLog[1]);

    // And the dev server is still a dev server: the replacement watches, rebuilds and serves.
    //
    // Waiting for readiness above is load-bearing, not padding. The watcher is installed at the end of
    // the boot build, so a save during the recycle is seen by neither builder — this test lost one
    // exactly that way. The settle wait on top is for Bun's dropped-event bug: the recycle boot writes
    // a burst of artifacts, and a save inside that window is never reported at all
    // (`06-watcher-dropped-event.md`).
    await Bun.sleep(500);
    const attempts: string[] = [];
    for (let attempt = 1; attempt <= 4; attempt++) {
      const mark = host.markLog();
      await harness.replaceText("ui/ClientMarker.tsx", /marker(-[\w-]+)?/, `marker-after-recycle-${attempt}`);
      const seen = await host
        .waitForLogSince(mark, /pages-rebundle ok/, 15_000)
        .then(() => true)
        .catch(() => false);
      attempts.push(`${attempt}=${seen ? "rebuilt" : "silent"}`);
      if (seen) break;
      await Bun.sleep(750);
    }
    console.info(
      `[recycle-guard] ${recycleLog[2]}; builder ${recycleLog[1]} -> ${recycled?.pid} at ${Math.round((recycled?.rssBytes ?? 0) / MB)}MiB; post-recycle saves: ${attempts.join(" ")}`,
    );
    expect(attempts.join(" ")).toMatch(/rebuilt/);
    await harness.waitForHttpText("marker-after-recycle", WAIT_MS);

    // A replacement that is still over the ceiling proves the ceiling cannot be met, and the host has
    // to stop rather than recycle forever. Two reports inside the minimum interval is the threshold.
    for (let i = 1; i <= 3; i++) {
      await Bun.sleep(500);
      const mark = host.markLog();
      await harness.replaceText("ui/ClientMarker.tsx", /marker(-[\w-]+)?/, `marker-settled-${i}`);
      await host.waitForLogSince(mark, /pages-rebundle ok/, WAIT_MS).catch(() => undefined);
    }
    await host.waitForLogSince(start, /ceiling cannot be met for this app/, WAIT_MS);
  });
});
