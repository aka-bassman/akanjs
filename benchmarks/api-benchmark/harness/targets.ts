import path from "node:path";
import { BENCH_ROOT } from "./lib";

/**
 * Target registry. Each target describes how to start a server and how to address its
 * endpoints. Competitors use canonical paths; akanjs uses Signal paths. Override any
 * value with benchmarks/targets.local.json (gitignored) for your machine/app.
 */

export type Runtime = "bun" | "node";

export interface TargetPaths {
  pureHttp: string;
  signalNoDb: string;
  ping: string;
  find: string; // contains {id}
  list: string;
  relation: string; // contains {id}
  create: string;
  login: string;
}

export interface Target {
  name: string;
  label: string;
  runtime: Runtime;
  /** Process group: which runtime layer this represents (for the runtime caveat in reports). */
  runtimeLabel: "bun" | "node";
  /** Command + args. {ENTRY} resolved relative to BENCH_ROOT. */
  cmd: string[];
  cwd?: string;
  env: Record<string, string>;
  port: number;
  baseUrl: string;
  wsUrl?: string;
  paths: TargetPaths;
  /** akanjs gateway metrics endpoint (enables resource + trace sampling). */
  metricsUrl?: string;
  /** Surfaces this target participates in. */
  surfaces: Array<"pure_http" | "signal" | "rest" | "db" | "websocket" | "fullstack" | "ssr">;
  /** Credentials POSTed to `paths.login`. Competitors leave this unset (login returns a token for `{}`). */
  loginCredentials?: Record<string, string>;
  /**
   * Seed N documents through `paths.create` before scenarios run, collecting the returned
   * document ids into a pool that find/relation scenarios sample from. Required for akanjs,
   * whose documents use string ids that cannot be synthesised client-side.
   */
  seed?: { count: number; bodyKey: string };
  notes?: string;
}

const canonicalPaths = (): TargetPaths => ({
  pureHttp: "/ping",
  signalNoDb: "/ping",
  ping: "/ping",
  find: "/users/{id}",
  list: "/users?limit=20&skip=0",
  relation: "/users/{id}/with-org",
  create: "/users",
  login: "/login",
});

const competitor = (
  name: string,
  label: string,
  entry: string,
  port: number,
  runtime: Runtime,
  runtimeLabel: "bun" | "node",
  surfaces: Target["surfaces"],
): Target => ({
  name,
  label,
  runtime,
  runtimeLabel,
  cmd:
    runtime === "node"
      ? ["node", "--experimental-strip-types", path.join(BENCH_ROOT, entry)]
      : ["bun", path.join(BENCH_ROOT, entry)],
  env: { PORT: String(port) },
  port,
  baseUrl: `http://127.0.0.1:${port}`,
  paths: canonicalPaths(),
  surfaces,
});

/**
 * Signal endpoint paths for an app exposing the shared `user` model + `admin` auth.
 * Routes are `/api/<refName>/<endpoint>/<params>` (see signal.resolver.ts). Verified against
 * the `minimal` app: find/relation are Public, list/create require an admin bearer token.
 */
const AKAN_USER_PATHS: TargetPaths = {
  pureHttp: "/_akan/bench/ping",
  signalNoDb: "/api/benchPing",
  ping: "/api/user/lightUser/{id}",
  find: "/api/user/user/{id}",
  list: "/api/user/userList?limit=20&skip=0",
  relation: "/api/user/user/{id}",
  create: "/api/user/createUser",
  login: "/api/admin/signinAdmin",
};

const AKAN_ADMIN_CREDENTIALS = {
  accountId: process.env.BENCH_AKAN_ADMIN_ACCOUNT_ID ?? "bench-admin@akanjs.com",
  password: process.env.BENCH_AKAN_ADMIN_PASSWORD ?? "benchadmin1234",
};

export const TARGETS: Record<string, Target> = {
  "raw-bun": competitor("raw-bun", "raw Bun.serve", "competitors/raw-bun/server.ts", 4001, "bun", "bun", [
    "pure_http",
    "rest",
    "fullstack",
  ]),
  elysia: competitor("elysia", "ElysiaJS (Bun)", "competitors/elysia/server.ts", 4002, "bun", "bun", [
    "pure_http",
    "rest",
    "fullstack",
  ]),
  hono: competitor("hono", "Hono (Bun)", "competitors/hono/server.ts", 4003, "bun", "bun", [
    "pure_http",
    "rest",
    "fullstack",
  ]),
  fastify: competitor("fastify", "Fastify (Node)", "competitors/fastify/server.ts", 4004, "node", "node", [
    "pure_http",
    "rest",
    "fullstack",
  ]),
  "raw-sqlite": competitor("raw-sqlite", "raw bun:sqlite", "competitors/raw-sqlite/server.ts", 4005, "bun", "bun", [
    "pure_http",
    "rest",
    "db",
    "fullstack",
  ]),

  // akanjs targets. The start command and Signal paths depend on the app under test.
  // Defaults assume an app named "minimal" with a `user` model, served via the gateway on :8282.
  // Override in targets.local.json (start cmd, baseUrl, paths) to match your app.
  "akan-single": {
    name: "akan-single",
    label: "akanjs (single / SQLite)",
    runtime: "bun",
    runtimeLabel: "bun",
    cmd: ["bun", "run", "akan", "start", process.env.BENCH_AKAN_APP ?? "minimal"],
    cwd: path.resolve(BENCH_ROOT, ".."),
    env: {
      AKAN_PUBLIC_OPERATION_MODE: "local",
      SERVER_MODE: "all",
      AKAN_PUBLIC_LOG_LEVEL: "warn",
      AKAN_LOG_FILE_LEVEL: "warn",
      AKAN_BENCH_SKIP_REQUEST_ID: "1",
      AKAN_MEMORY_LOG: "1",
      AKAN_MEMORY_LOG_INTERVAL_MS: "1000",
    },
    port: 8282,
    baseUrl: "http://127.0.0.1:8282",
    wsUrl: "ws://127.0.0.1:8282/api/ws",
    metricsUrl: "http://127.0.0.1:8282/_akan/app/metrics",
    paths: AKAN_USER_PATHS,
    loginCredentials: AKAN_ADMIN_CREDENTIALS,
    seed: { count: Number(process.env.BENCH_AKAN_SEED ?? "10000"), bodyKey: "data" },
    surfaces: ["pure_http", "signal", "rest", "db", "websocket", "fullstack", "ssr"],
    notes: "Single-process mode: SQLite document store, in-process cache/queue/pubsub.",
  },
  "akan-cluster": {
    name: "akan-cluster",
    label: "akanjs (cluster / Postgres+Redis)",
    runtime: "bun",
    runtimeLabel: "bun",
    cmd: ["bun", "run", "akan", "start", process.env.BENCH_AKAN_APP ?? "minimal"],
    cwd: path.resolve(BENCH_ROOT, ".."),
    env: {
      AKAN_PUBLIC_OPERATION_MODE: "cluster",
      SERVER_MODE: "federation",
      AKAN_PUBLIC_LOG_LEVEL: "warn",
      AKAN_LOG_FILE_LEVEL: "warn",
      AKAN_BENCH_SKIP_REQUEST_ID: "1",
      AKAN_REPLICA: process.env.BENCH_AKAN_REPLICA ?? "2,1,0",
      AKAN_MEMORY_LOG: "1",
      AKAN_MEMORY_LOG_INTERVAL_MS: "1000",
    },
    port: 8282,
    baseUrl: "http://127.0.0.1:8282",
    wsUrl: "ws://127.0.0.1:8282/api/ws",
    metricsUrl: "http://127.0.0.1:8282/_akan/app/metrics",
    paths: AKAN_USER_PATHS,
    loginCredentials: AKAN_ADMIN_CREDENTIALS,
    seed: { count: Number(process.env.BENCH_AKAN_SEED ?? "10000"), bodyKey: "data" },
    surfaces: ["pure_http", "signal", "rest", "db", "websocket", "fullstack", "ssr"],
    notes: "Cluster mode requires Postgres + Redis reachable via app env. Gateway proxies to federation workers.",
  },
};

export const loadTargets = async (): Promise<Record<string, Target>> => {
  const overrideFile = Bun.file(path.join(BENCH_ROOT, "targets.local.json"));
  if (!(await overrideFile.exists())) return TARGETS;
  const overrides = (await overrideFile.json()) as Record<string, Partial<Target>>;
  const merged: Record<string, Target> = { ...TARGETS };
  for (const [name, patch] of Object.entries(overrides)) {
    merged[name] = { ...(merged[name] ?? ({} as Target)), ...patch } as Target;
  }
  return merged;
};
