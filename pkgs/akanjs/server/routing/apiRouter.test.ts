import { describe, expect, test } from "bun:test";
import { getDefaultInjectRegistry } from "akanjs/service";
import { AkanResponse, WebProxyRunner } from "../proxy";
import type { HttpRoutes, WebsocketRoutes } from "../types";
import type { AppWsData as AppWsDataType } from "./appWsData";

type RouteFn = (req: Request) => Response | Promise<Response>;
const get = (path: string, acceptEncoding = "") =>
  new Request(`http://localhost${path}`, acceptEncoding ? { headers: { "accept-encoding": acceptEncoding } } : {});

describe("ApiRouter.buildRoutes", () => {
  test("keeps the global prefix by default", async () => {
    process.env.AKAN_PUBLIC_APP_NAME = "test";
    const { ApiRouter } = await import("./apiRouter");
    const routes = ApiRouter.buildRoutes({
      prefix: "/api",
      websocketPrefix: "/ws",
      routes: { "/admin/ping": () => new Response("ok") } as HttpRoutes,
      renderEnvRoutes: {},
      upgradeAppWs: () => false,
    });

    expect(Object.keys(routes)).toContain("/api/admin/ping");
  });

  test("allows selected endpoints to skip the global prefix", async () => {
    process.env.AKAN_PUBLIC_APP_NAME = "test";
    const { ApiRouter } = await import("./apiRouter");
    const routes = ApiRouter.buildRoutes({
      prefix: "/api",
      websocketPrefix: "/ws",
      routes: { "/sitemap.xml": () => new Response("ok") } as HttpRoutes,
      routeOptions: { "/sitemap.xml": { globalPrefix: false } },
      renderEnvRoutes: { "/*": () => new Response("fallback") } as HttpRoutes,
      upgradeAppWs: () => false,
    });

    expect(Object.keys(routes)).toContain("/sitemap.xml");
    expect(Object.keys(routes)).not.toContain("/api/sitemap.xml");
  });

  test("keeps builtin routes before render catch-all without API prefix", async () => {
    process.env.AKAN_PUBLIC_APP_NAME = "test";
    const { ApiRouter } = await import("./apiRouter");
    const routes = ApiRouter.buildRoutes({
      prefix: "/api",
      websocketPrefix: "/ws",
      routes: { "/ping": () => new Response("api") } as HttpRoutes,
      builtinRoutes: { "/openapi.json": () => Response.json({ openapi: "3.1.0" }) } as HttpRoutes,
      renderEnvRoutes: { "/*": () => new Response("fallback") } as HttpRoutes,
      upgradeAppWs: () => false,
    });

    expect(Object.keys(routes)).toContain("/openapi.json");
    expect(Object.keys(routes)).not.toContain("/api/openapi.json");
    expect(await (await (routes["/openapi.json"] as RouteFn)(get("/openapi.json"))).json()).toEqual({
      openapi: "3.1.0",
    });
  });

  test("wraps only render routes with the web proxy runner", async () => {
    process.env.AKAN_PUBLIC_APP_NAME = "test";
    const { ApiRouter } = await import("./apiRouter");
    class RewriteRenderProxy {
      static refName = "rewriteRenderProxy";
      use() {
        return AkanResponse.rewrite("http://localhost/rendered", { request: { headers: { "x-proxy": "1" } } });
      }
    }
    const routes = ApiRouter.buildRoutes({
      prefix: "/api",
      websocketPrefix: "/ws",
      routes: { "/ping": () => Response.json("api") } as HttpRoutes,
      builtinRoutes: { "/openapi.json": () => Response.json({ openapi: "3.1.0" }) } as HttpRoutes,
      renderEnvRoutes: {
        "/*": (req) => Response.json({ url: req.url, proxy: req.headers.get("x-proxy") }),
      } as HttpRoutes,
      upgradeAppWs: () => false,
      webProxyRunner: new WebProxyRunner([RewriteRenderProxy]),
    });

    expect(await (await (routes["/api/ping"] as RouteFn)(get("/api/ping"))).json()).toBe("api");
    expect(await (await (routes["/openapi.json"] as RouteFn)(get("/openapi.json"))).json()).toEqual({
      openapi: "3.1.0",
    });
    const renderResponse = await (routes["/*"] as (req: Request) => Response | Promise<Response>)(
      new Request("http://localhost/dashboard"),
    );
    expect(await renderResponse.json()).toEqual({ url: "http://localhost/rendered", proxy: "1" });
  });
});

describe("ApiRouter.buildWebsocketHandlers", () => {
  test("dispatches app websocket messages and returns route errors", async () => {
    process.env.AKAN_PUBLIC_APP_NAME = "test";
    const { ApiRouter } = await import("./apiRouter");
    const sent: string[] = [];
    const loggerErrors: string[] = [];
    const ws = {
      data: {},
      send: (message: string) => sent.push(message),
    } as unknown as Bun.ServerWebSocket<{ kind?: string }>;
    const handlers = ApiRouter.buildWebsocketHandlers({
      wsRoutes: {
        echo: async (_ws, data, event) => ({ event, data }),
      } as WebsocketRoutes,
      registry: getDefaultInjectRegistry(),
      hmrHub: null,
      hmrState: null,
      logger: { error: (message: string) => loggerErrors.push(message) } as never,
    });

    await handlers.message?.(ws, JSON.stringify({ key: "echo", data: ["hello"] }));
    const originalConsoleError = console.error;
    console.error = () => undefined;
    try {
      await handlers.message?.(ws, JSON.stringify({ key: "missing", data: [] }));
    } finally {
      console.error = originalConsoleError;
    }

    expect(JSON.parse(sent[0] ?? "{}")).toEqual({ event: "message", data: ["hello"] });
    // Detailed outside a production build, and generalized inside one — `SignalFailure` owns that split.
    expect(JSON.parse(sent[1] ?? "{}").error).toBe('WebSocket route "missing" is not registered');
    // The log keeps the stack the response no longer carries, which is why generalizing the response loses nothing.
    expect(loggerErrors).toHaveLength(1);
    expect(loggerErrors[0]).toContain('WebSocket route "missing" is not registered');
  });

  test("keeps HMR websocket traffic separate from app signal routes", async () => {
    process.env.AKAN_PUBLIC_APP_NAME = "test";
    const { ApiRouter } = await import("./apiRouter");
    const sent: string[] = [];
    let attached = false;
    let detached = false;
    const ws = {
      data: { kind: "akan-hmr" },
      send: (message: string) => sent.push(message),
    } as unknown as Bun.ServerWebSocket<{ kind?: string }>;
    const handlers = ApiRouter.buildWebsocketHandlers({
      wsRoutes: {
        hmrShouldNotRun: () => {
          throw new Error("should not run");
        },
      } as WebsocketRoutes,
      registry: getDefaultInjectRegistry(),
      hmrHub: {
        attach: () => {
          attached = true;
        },
        detach: () => {
          detached = true;
        },
      } as never,
      hmrState: { state: { buildId: 7, cssAssets: {} } },
      logger: { error: () => undefined } as never,
    });

    handlers.open?.(ws);
    await handlers.message?.(ws, JSON.stringify({ key: "hmrShouldNotRun" }));
    handlers.close?.(ws, 1000, "");

    expect(attached).toBe(true);
    expect(detached).toBe(true);
    expect(JSON.parse(sent[0] ?? "{}")).toEqual({ type: "hello", buildId: 7, cssAssets: {} });
    expect(sent).toHaveLength(1);
  });
});

describe("ApiRouter websocket authentication", () => {
  test("hands the handshake credential to the upgrade instead of dropping it", async () => {
    process.env.AKAN_PUBLIC_APP_NAME = "test";
    const { ApiRouter } = await import("./apiRouter");
    const upgraded: AppWsDataType[] = [];
    const routes = ApiRouter.buildRoutes({
      prefix: "/api",
      websocketPrefix: "/ws",
      routes: {} as HttpRoutes,
      renderEnvRoutes: {},
      upgradeAppWs: (_req, data) => {
        upgraded.push(data);
        return true;
      },
    });

    const upgrade = routes["/api/ws"] as (req: Request) => Response | undefined;
    const response = upgrade(
      new Request("http://localhost/api/ws", {
        headers: { authorization: "Bearer handshake-token", cookie: "jwt=cookie-token" },
      }),
    );

    expect(response).toBeUndefined();
    expect(upgraded).toHaveLength(1);
    expect(upgraded[0]?.headers.get("authorization")).toBe("Bearer handshake-token");
    expect(upgraded[0]?.cookies.get("jwt")).toBe("cookie-token");
  });

  test("applies an auth frame before the frames queued behind it and acks the revoked rooms", async () => {
    process.env.AKAN_PUBLIC_APP_NAME = "test";
    const { ApiRouter } = await import("./apiRouter");
    const { AppWsData } = await import("./appWsData");
    const { websocketAuthContract } = await import("akanjs/common");
    const sent: string[] = [];
    const seenCredentials: (string | null)[] = [];
    const ws = {
      data: AppWsData.fromRequest(new Request("http://localhost/api/ws")),
      send: (message: string) => sent.push(message),
    } as unknown as Bun.ServerWebSocket<{ kind?: string }>;
    const handlers = ApiRouter.buildWebsocketHandlers({
      wsRoutes: {
        room: (socket: Bun.ServerWebSocket<unknown>) => {
          seenCredentials.push(AppWsData.of(socket).headers.get("authorization"));
          return { ok: true };
        },
      } as unknown as WebsocketRoutes,
      registry: getDefaultInjectRegistry(),
      hmrHub: null,
      hmrState: null,
      logger: { error: () => undefined } as never,
    });

    const auth = handlers.message?.(ws, JSON.stringify(websocketAuthContract.makeRequest("signed-in-token")));
    const subscribe = handlers.message?.(ws, JSON.stringify({ key: "room", data: [], subscribe: true }));
    await Promise.all([auth, subscribe]);

    expect(seenCredentials).toEqual(["Bearer signed-in-token"]);
    expect(JSON.parse(sent[0] ?? "{}")).toEqual({ type: "auth", revokedRooms: [] });
    expect(AppWsData.of(ws).account).toBeUndefined();
  });

  test("signing out over the socket clears the credential it was upgraded with", async () => {
    process.env.AKAN_PUBLIC_APP_NAME = "test";
    const { ApiRouter } = await import("./apiRouter");
    const { AppWsData } = await import("./appWsData");
    const { websocketAuthContract } = await import("akanjs/common");
    const ws = {
      data: AppWsData.fromRequest(new Request("http://localhost/api/ws", { headers: { cookie: "jwt=cookie-token" } })),
      send: () => undefined,
    } as unknown as Bun.ServerWebSocket<{ kind?: string }>;
    AppWsData.of(ws).account = { role: "user" };
    const handlers = ApiRouter.buildWebsocketHandlers({
      wsRoutes: {} as WebsocketRoutes,
      registry: getDefaultInjectRegistry(),
      hmrHub: null,
      hmrState: null,
      logger: { error: () => undefined } as never,
    });

    await handlers.message?.(ws, JSON.stringify(websocketAuthContract.makeRequest(null)));

    expect(AppWsData.of(ws).cookies.has("jwt")).toBe(false);
    expect(AppWsData.of(ws).account).toBeUndefined();
  });
});

describe("ApiRouter endpoint responses over a real socket", () => {
  test("compresses a signal endpoint's JSON, and leaves the decoded body identical", async () => {
    process.env.AKAN_PUBLIC_APP_NAME = "test";
    const { ApiRouter } = await import("./apiRouter");
    const payload = { rows: Array.from({ length: 200 }, (_, i) => ({ id: i, title: "repeated title" })) };
    const server = Bun.serve({
      port: 0,
      routes: ApiRouter.buildRoutes({
        prefix: "/api",
        websocketPrefix: "/ws",
        routes: { "/rows": () => Response.json(payload) } as HttpRoutes,
        renderEnvRoutes: {},
        upgradeAppWs: () => false,
      }) as never,
    });

    const compressed = await fetch(`http://localhost:${server.port}/api/rows`, {
      headers: { "accept-encoding": "br" },
    });
    const plain = await fetch(`http://localhost:${server.port}/api/rows`, {
      headers: { "accept-encoding": "identity" },
    });

    expect(compressed.headers.get("content-encoding")).toBe("br");
    expect(plain.headers.get("content-encoding")).toBeNull();
    // Bun's fetch decodes the body but keeps the header, so this is the wire size against the decoded one.
    const wireBytes = Number(compressed.headers.get("content-length"));
    expect(wireBytes).toBeLessThan(JSON.stringify(payload).length / 10);
    expect(await compressed.json()).toEqual(payload);
    expect(await plain.json()).toEqual(payload);
    server.stop(true);
  });
});
