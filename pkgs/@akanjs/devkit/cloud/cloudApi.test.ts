import { afterEach, describe, expect, test } from "bun:test";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { tempDirs, writeJson, writeText } from "../testHelpers";

// The cloud rotates a refresh token on every use and treats a second use as theft, revoking every session.
class FakeCloud {
  readonly server: ReturnType<typeof Bun.serve>;
  readonly refreshes: string[] = [];
  reused = false;
  delayMs = 0;
  hang: boolean = false;
  readonly #refreshTokens = new Set(["refresh-0"]);
  readonly #spent = new Set<string>();
  readonly #jwts = new Set(["jwt-0"]);
  #issued = 0;

  constructor() {
    this.server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: (request) => this.#route(request) });
  }

  get host() {
    return `http://127.0.0.1:${this.server.port}`;
  }

  async #route(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/getRemoteSelf") {
      const jwt = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
      return Response.json(this.#jwts.has(jwt) ? { id: "u1", nickname: "akan" } : null);
    }
    if (url.pathname !== "/api/refreshAuthToken") return new Response("not found", { status: 404 });
    const { refreshToken } = (await request.json()) as { refreshToken: string };
    this.refreshes.push(refreshToken);
    if (this.#spent.has(refreshToken)) this.reused = true;
    if (!this.#refreshTokens.delete(refreshToken)) return Response.json({ error: "invalid" }, { status: 401 });
    this.#spent.add(refreshToken);
    this.#issued += 1;
    const next = { jwt: `jwt-${this.#issued}`, refreshToken: `refresh-${this.#issued}` };
    this.#refreshTokens.add(next.refreshToken);
    this.#jwts.add(next.jwt);
    if (this.hang) await new Promise(() => undefined);
    await Bun.sleep(this.delayMs);
    return Response.json({ ...next, expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString() });
  }
}

const makeHome = tempDirs("akan-cloud-home-");
const cloudIndex = path.resolve(import.meta.dir, "index.ts");
let cloud: FakeCloud;

afterEach(() => cloud.server.stop(true));

// A separate `bun` per CLI process, with HOME pointing at a temp dir: the config path is fixed when the module loads.
const cliRun = async (home: string, { callers = 1 } = {}) => {
  const script = path.join(home, `cli-${crypto.randomUUID()}.ts`);
  await writeText(
    script,
    `import { CloudApi, configPath } from ${JSON.stringify(cloudIndex)};
if (!configPath.startsWith(${JSON.stringify(home)})) throw new Error("refusing to touch " + configPath);
const workspace = { workspaceRoot: ${JSON.stringify(home)} };
const selves = await Promise.all(
  Array.from({ length: ${callers} }, async () => (await (await CloudApi.fromHost(workspace, ${JSON.stringify(cloud.host)})).getRemoteSelf())?.nickname ?? null),
);
process.stdout.write(JSON.stringify(selves));
`,
  );
  return Bun.spawn(["bun", script], { env: { ...process.env, HOME: home }, stdout: "pipe", stderr: "pipe" });
};
const output = async (proc: Bun.Subprocess<"ignore", "pipe", "pipe">) => {
  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  expect(await proc.exited, stderr).toBe(0);
  return JSON.parse(stdout) as (string | null)[];
};

const writerRun = async (home: string, waitTimeoutMs: number) => {
  const script = path.join(home, `writer-${crypto.randomUUID()}.ts`);
  await writeText(
    script,
    `import { GlobalConfig, configPath } from ${JSON.stringify(cloudIndex)};
import { ConfigLock } from ${JSON.stringify(path.resolve(import.meta.dir, "configLock.ts"))};
if (!configPath.startsWith(${JSON.stringify(home)})) throw new Error("refusing to touch " + configPath);
Object.defineProperty(ConfigLock, "waitTimeoutMs", { value: ${waitTimeoutMs} });
await GlobalConfig.setTestTargets({ linux: { cpus: 2 } });
`,
  );
  const proc = Bun.spawn(["bun", script], { env: { ...process.env, HOME: home }, stdout: "pipe", stderr: "pipe" });
  return { code: await proc.exited, stderr: await new Response(proc.stderr).text() };
};

const storeSession = async (home: string, { expiresInMs = 30 * 60_000, refreshToken = "refresh-0" } = {}) =>
  await writeJson(path.join(home, ".akan", "config.json"), {
    cloudHost: {
      [cloud.host]: {
        host: cloud.host,
        auth: {
          accessToken: { jwt: "jwt-0", refreshToken, expiresAt: new Date(Date.now() + expiresInMs).toISOString() },
          self: { id: "u1", nickname: "akan" },
        },
      },
    },
  });
const storedToken = async (home: string) => {
  const config = JSON.parse(await readFile(path.join(home, ".akan", "config.json"), "utf8"));
  return config.cloudHost[cloud.host].auth.accessToken as { jwt: string; refreshToken: string | null };
};

describe("CloudApi.fromHost token refresh", () => {
  test("two CLI processes with a session in its last hour make exactly one refresh, and both use its result", async () => {
    cloud = new FakeCloud();
    cloud.delayMs = 300;
    const home = await makeHome();
    await storeSession(home);

    const [first, second] = await Promise.all([
      cliRun(home, { callers: 2 }).then(output),
      cliRun(home, { callers: 2 }).then(output),
    ]);

    expect(cloud.refreshes).toEqual(["refresh-0"]);
    expect(cloud.reused).toBe(false);
    expect([...first, ...second]).toEqual(["akan", "akan", "akan", "akan"]);
    expect(await storedToken(home)).toMatchObject({ jwt: "jwt-1", refreshToken: "refresh-1" });
  }, 30_000);

  test("a CLI started while another is mid-refresh waits for that refresh and uses its session", async () => {
    cloud = new FakeCloud();
    cloud.delayMs = 1_500;
    const home = await makeHome();
    await storeSession(home);

    const first = cliRun(home).then(output);
    for (let tries = 0; tries < 300 && (await storedToken(home)).refreshToken !== null; tries++) await Bun.sleep(10);
    expect((await storedToken(home)).refreshToken).toBeNull();
    const second = await cliRun(home).then(output);

    expect(await first).toEqual(["akan"]);
    expect(second).toEqual(["akan"]);
    expect(cloud.refreshes).toEqual(["refresh-0"]);
  }, 30_000);

  test("a CLI killed while its refresh is in flight never lets the next one present that refresh token", async () => {
    cloud = new FakeCloud();
    cloud.hang = true;
    const home = await makeHome();
    await storeSession(home);

    const killed = await cliRun(home);
    for (let waited = 0; !cloud.refreshes.length && waited < 10_000; waited += 25) await Bun.sleep(25);
    expect(cloud.refreshes).toEqual(["refresh-0"]);
    killed.kill("SIGKILL");
    await killed.exited;
    cloud.hang = false;

    const started = Date.now();
    expect(await output(await cliRun(home))).toEqual([null]);
    expect(Date.now() - started).toBeLessThan(10_000);
    expect(cloud.refreshes).toEqual(["refresh-0"]);
    expect(cloud.reused).toBe(false);
    expect((await storedToken(home)).refreshToken).toBeNull();
  }, 30_000);

  test("a refresh the cloud refuses is not presented again", async () => {
    cloud = new FakeCloud();
    const home = await makeHome();
    await storeSession(home, { refreshToken: "refresh-unknown" });

    expect(await output(await cliRun(home))).toEqual([null]);
    expect(await output(await cliRun(home))).toEqual([null]);
    expect(cloud.refreshes).toEqual(["refresh-unknown"]);
    expect((await storedToken(home)).refreshToken).toBeNull();
  }, 30_000);

  test("any other config write waits for the lock instead of writing around it", async () => {
    cloud = new FakeCloud();
    const home = await makeHome();
    await storeSession(home);
    const lockPath = path.join(home, ".akan", "config.json.lock");
    await writeJson(lockPath, { pid: process.pid, at: Date.now() });

    const blocked = await writerRun(home, 300);
    expect(blocked.code).not.toBe(0);
    expect(blocked.stderr).toContain(lockPath);
    expect(JSON.parse(await readFile(path.join(home, ".akan", "config.json"), "utf8")).testTargets).toBeUndefined();

    await rm(lockPath);
    expect((await writerRun(home, 300)).code).toBe(0);
    const config = JSON.parse(await readFile(path.join(home, ".akan", "config.json"), "utf8"));
    expect(config.testTargets).toEqual({ linux: { cpus: 2 } });
    expect(config.cloudHost[cloud.host].auth.accessToken.refreshToken).toBe("refresh-0");
  }, 30_000);

  test("a session with more than an hour left is used as it is", async () => {
    cloud = new FakeCloud();
    const home = await makeHome();
    await storeSession(home, { expiresInMs: 2 * 86_400_000 });

    expect(await output(await cliRun(home))).toEqual(["akan"]);
    expect(cloud.refreshes).toEqual([]);
    expect(await storedToken(home)).toMatchObject({ jwt: "jwt-0", refreshToken: "refresh-0" });
  }, 30_000);
});
