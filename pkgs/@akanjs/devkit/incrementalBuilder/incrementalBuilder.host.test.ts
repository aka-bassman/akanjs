import { afterEach, describe, expect, mock, test } from "bun:test";
import { IncrementalBuilderHost } from "./incrementalBuilder.host";

const originalSpawn = Bun.spawn;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

afterEach(() => {
  (Bun as unknown as { spawn: typeof Bun.spawn }).spawn = originalSpawn;
  mock.restore();
});

interface SpawnRecord {
  proc: { pid: number; send: ReturnType<typeof mock>; kill: ReturnType<typeof mock>; killed: boolean };
  options: { ipc?: (message: unknown) => void; onExit?: () => void; env?: Record<string, string> };
}

const mockSpawns = (): SpawnRecord[] => {
  const spawns: SpawnRecord[] = [];
  (Bun as unknown as { spawn: typeof Bun.spawn }).spawn = mock((_, options) => {
    const proc = { pid: 10_000 + spawns.length, send: mock(), kill: mock(), killed: false };
    spawns.push({ proc, options: options as SpawnRecord["options"] });
    return proc as never;
  }) as never;
  return spawns;
};

describe("IncrementalBuilderHost", () => {
  test("restarts after a ready builder exits", async () => {
    const spawns = mockSpawns();

    const onReady = mock();
    const onRestartReady = mock();
    const host = new IncrementalBuilderHost({
      app: { cwdPath: "/tmp/app" } as never,
      entry: "/tmp/builder.ts",
      env: {},
      onMessage: () => undefined,
    });

    host.start({ onReady, onRestartReady });
    spawns[0]?.options.ipc?.({ type: "builder-ready" });
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(host.status).toBe("ready");

    spawns[0]?.options.onExit?.();
    expect(host.status).toBe("restarting");
    expect(host.send({ type: "build-route", id: 1, routeId: "a", seeds: [], knownEntries: [] })).toBe(false);

    await wait(1_050);
    expect(spawns).toHaveLength(2);
    spawns[1]?.options.ipc?.({ type: "builder-ready" });
    expect(onRestartReady).toHaveBeenCalledTimes(1);
    expect(host.status).toBe("ready");

    host.stop();
  });

  test("recycles a ready builder gracefully and replaces it immediately", async () => {
    const spawns = mockSpawns();
    const onRestartReady = mock();
    const host = new IncrementalBuilderHost({
      app: { cwdPath: "/tmp/app" } as never,
      entry: "/tmp/builder.ts",
      env: {},
      onMessage: () => undefined,
    });

    host.start({ onRestartReady });
    spawns[0]?.options.ipc?.({ type: "builder-ready" });
    expect(spawns[0]?.options.env?.AKAN_BUILDER_RECYCLED).toBeUndefined();

    const reason = "rss=1300MiB>=1200MiB after 3 build(s)";
    expect(host.recycle(reason)).toBe(true);
    // Graceful: the builder is asked to drain, not killed, so a rebuild in flight still completes.
    expect(spawns[0]?.proc.send).toHaveBeenCalledWith({ type: "builder-shutdown", reason });
    expect(spawns[0]?.proc.kill).not.toHaveBeenCalled();
    expect(host.recycle("second request")).toBe(false);

    // A planned exit skips the crash backoff — the dev server has no file watcher until it is back.
    spawns[0]?.options.onExit?.();
    expect(spawns).toHaveLength(2);
    expect(spawns[1]?.options.env?.AKAN_BUILDER_RECYCLED).toBe("1");
    spawns[1]?.options.ipc?.({ type: "builder-ready" });
    expect(onRestartReady).toHaveBeenCalledTimes(1);
    expect(host.status).toBe("ready");

    // The flag is per-recycle: a later crash restart must not re-announce a boot artifact.
    spawns[1]?.options.onExit?.();
    expect(spawns).toHaveLength(2);
    await wait(1_050);
    expect(spawns).toHaveLength(3);
    expect(spawns[2]?.options.env?.AKAN_BUILDER_RECYCLED).toBeUndefined();

    host.stop();
  });

  test("only recycles a builder that is ready", () => {
    const spawns = mockSpawns();
    const host = new IncrementalBuilderHost({
      app: { cwdPath: "/tmp/app" } as never,
      entry: "/tmp/builder.ts",
      env: {},
      onMessage: () => undefined,
    });

    host.start();
    expect(host.recycle("while still booting")).toBe(false);
    expect(spawns[0]?.proc.send).not.toHaveBeenCalled();

    host.stop();
    expect(host.recycle("after stop")).toBe(false);
  });
});

describe("IncrementalBuilderHost.maxRssBytes", () => {
  const withEnv = (values: Record<string, string | undefined>, fn: () => void) => {
    const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
    try {
      for (const [key, value] of Object.entries(values)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      fn();
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  };

  test("defaults to a dev ceiling well above a fresh boot", () => {
    withEnv(
      { AKAN_BUILDER_MAX_RSS_MB: undefined, AKAN_BUILDER_MAX_RSS: undefined, AKAN_MEMORY_LIMIT: undefined },
      () => {
        expect(IncrementalBuilderHost.maxRssBytes()).toBe(1_200 * 1024 * 1024);
      },
    );
  });

  test("honors an explicit override and treats 0 as unbounded", () => {
    withEnv({ AKAN_BUILDER_MAX_RSS_MB: "700" }, () => {
      expect(IncrementalBuilderHost.maxRssBytes()).toBe(700 * 1024 * 1024);
    });
    withEnv({ AKAN_BUILDER_MAX_RSS_MB: "0" }, () => {
      expect(IncrementalBuilderHost.maxRssBytes()).toBeNull();
    });
  });

  test("takes a share of a declared memory limit, leaving room for the other dev processes", () => {
    withEnv({ AKAN_BUILDER_MAX_RSS_MB: undefined, AKAN_BUILDER_MAX_RSS: undefined, AKAN_MEMORY_LIMIT: "4gb" }, () => {
      expect(IncrementalBuilderHost.maxRssBytes()).toBe(Math.floor(4 * 1024 ** 3 * 0.35));
    });
  });
});
