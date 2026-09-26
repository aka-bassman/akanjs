import { describe, expect, test } from "bun:test";
import { getDefaultInjectRegistry, getDefaultLiveRegistry } from "akanjs/service";
import { MCP_LEGACY_PRIOR_VERSION, MCP_LEGACY_VERSION, MCP_MODERN_VERSION } from "../../signal/mcp";
import { McpRouter } from "./McpRouter";

// `getEnv()` has to resolve: the advertised server name is the runtime identity, not a server option.
process.env.AKAN_PUBLIC_APP_NAME = "probe";
process.env.AKAN_PUBLIC_REPO_NAME = "akan";
process.env.AKAN_PUBLIC_SERVE_DOMAIN = "example.com";
process.env.AKAN_PUBLIC_ENV = "local";
process.env.AKAN_PUBLIC_OPERATION_MODE = "local";

type Routes = Record<string, Record<string, (req: Request) => Promise<Response> | Response>>;
type RouterProps = Partial<ConstructorParameters<typeof McpRouter>[0]>;

const routes = (props: RouterProps = {}) =>
  new McpRouter({
    registry: getDefaultInjectRegistry(),
    live: getDefaultLiveRegistry(),
    middleware: new Map(),
    env: {},
    instructions: "Domain tools.",
    ...props,
  }).createRoutes() as Routes;

const post = async (body: object, init: RequestInit = {}, handlers: Routes[string] = routes()["/mcp"]) => {
  const req = new Request("http://127.0.0.1:8080/mcp", {
    method: "POST",
    body: JSON.stringify(body),
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const res = await handlers.POST(req);
  // A transport-level refusal answers in plain text, before any JSON-RPC envelope exists.
  const text = await res.text();
  let json: { result?: any; error?: { code: number; message: string; data?: any }; raw?: string };
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { res, json };
};

const meta = {
  "io.modelcontextprotocol/protocolVersion": MCP_MODERN_VERSION,
  "io.modelcontextprotocol/clientCapabilities": {},
};

const mirrored = (method: string, name?: string) => ({
  "MCP-Protocol-Version": MCP_MODERN_VERSION,
  "Mcp-Method": method,
  ...(name ? { "Mcp-Name": name } : {}),
});

describe("McpRouter transport", () => {
  test("refuses the verbs neither era uses", async () => {
    const handlers = routes()["/mcp"];
    for (const verb of ["GET", "DELETE"] as const) {
      const res = await handlers[verb](new Request("http://127.0.0.1:8080/mcp"));
      expect(res.status).toBe(405);
      expect(res.headers.get("Allow")).toBe("POST");
    }
  });

  test("answers a notification with 202 and no body", async () => {
    const handlers = routes()["/mcp"];
    const res = await handlers.POST(
      new Request("http://127.0.0.1:8080/mcp", {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      }),
    );
    expect(res.status).toBe(202);
  });

  test("rejects a cross-origin post but allows a client that sends none", async () => {
    const { res } = await post(
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      { headers: { Origin: "http://evil.test" } },
    );
    expect(res.status).toBe(403);
    const matching = await post(
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      { headers: { Origin: "http://127.0.0.1:8080" } },
    );
    expect(matching.res.status).toBe(200);
    const absent = await post({ jsonrpc: "2.0", id: 1, method: "tools/list" });
    expect(absent.res.status).toBe(200);
  });

  test("judges a browser's origin against the configured resource, not a header the caller wrote", async () => {
    const pinned = routes({ auth: { resource: "https://public.example.com/mcp" } })["/mcp"];
    const list = { jsonrpc: "2.0", id: 1, method: "tools/list" };
    const ours = await post(list, { headers: { Origin: "https://public.example.com" } }, pinned);
    expect(ours.res.status).toBe(200);
    const forwarded = await post(
      list,
      { headers: { Origin: "https://evil.example.net", "x-forwarded-host": "evil.example.net" } },
      pinned,
    );
    expect(forwarded.res.status).toBe(403);
  });

  test("reports a broken body as a parse error rather than crashing", async () => {
    const handlers = routes()["/mcp"];
    const res = await handlers.POST(new Request("http://127.0.0.1:8080/mcp", { method: "POST", body: "{not json" }));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: { code: number } }).error.code).toBe(-32700);
  });
});

describe("McpRouter eras", () => {
  test("serves the legacy handshake without issuing a session", async () => {
    const { res, json } = await post({
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: { protocolVersion: MCP_LEGACY_VERSION, capabilities: {} },
    });
    expect(res.headers.get("Mcp-Session-Id")).toBeNull();
    expect(json.result.protocolVersion).toBe(MCP_LEGACY_VERSION);
    expect(json.result.capabilities).toEqual({});
    expect(json.result.resultType).toBeUndefined();
  });

  test("answers a legacy revision it speaks with that same revision", async () => {
    const { json } = await post({
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: { protocolVersion: MCP_LEGACY_PRIOR_VERSION, capabilities: {} },
    });
    expect(json.result.protocolVersion).toBe(MCP_LEGACY_PRIOR_VERSION);
  });

  test("meets an unknown proposal at whichever end of its list is closer", async () => {
    const older = await post({
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: { protocolVersion: "1999-01-01" },
    });
    expect(older.json.result.protocolVersion).toBe(MCP_LEGACY_PRIOR_VERSION);
    const newer = await post({
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: { protocolVersion: "2099-01-01" },
    });
    expect(newer.json.result.protocolVersion).toBe(MCP_MODERN_VERSION);
  });

  test("serves modern discovery with resultType and serverInfo", async () => {
    const { json } = await post(
      { jsonrpc: "2.0", id: 1, method: "server/discover", params: { _meta: meta } },
      { headers: mirrored("server/discover") },
    );
    expect(json.result.resultType).toBe("complete");
    expect(json.result.supportedVersions).toEqual([MCP_MODERN_VERSION, MCP_LEGACY_VERSION, MCP_LEGACY_PRIOR_VERSION]);
    expect(json.result._meta["io.modelcontextprotocol/serverInfo"]).toEqual({ name: "probe-mcp", version: "0.0.0" });
  });

  test("treats a legacy _meta as legacy instead of demanding modern fields", async () => {
    const { res, json } = await post({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: { _meta: { progressToken: "abc" } },
    });
    expect(res.status).toBe(200);
    expect(json.result.tools).toEqual([]);
    expect(json.result.resultType).toBeUndefined();
  });

  test("requires the modern _meta fields once a modern request declares itself", async () => {
    const { res, json } = await post({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: { _meta: { "io.modelcontextprotocol/protocolVersion": MCP_MODERN_VERSION } },
    });
    expect(res.status).toBe(400);
    expect(json.error?.code).toBe(-32602);
  });

  test("names the versions it speaks when asked for one it does not", async () => {
    const { res, json } = await post({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: { _meta: { ...meta, "io.modelcontextprotocol/protocolVersion": "2030-01-01" } },
    });
    expect(res.status).toBe(400);
    expect(json.error?.code).toBe(-32022);
    expect(json.error?.data).toEqual({
      requested: "2030-01-01",
      supported: [MCP_MODERN_VERSION, MCP_LEGACY_VERSION, MCP_LEGACY_PRIOR_VERSION],
    });
  });
});

describe("McpRouter header mirroring", () => {
  test("rejects a header that contradicts the body", async () => {
    const { res, json } = await post(
      { jsonrpc: "2.0", id: 1, method: "tools/list", params: { _meta: meta } },
      { headers: { "Mcp-Method": "tools/call" } },
    );
    expect(res.status).toBe(400);
    expect(json.error?.code).toBe(-32020);
  });

  test("accepts a matching header and refuses one that was left out", async () => {
    const matched = await post(
      { jsonrpc: "2.0", id: 1, method: "tools/list", params: { _meta: meta } },
      { headers: mirrored("tools/list") },
    );
    expect(matched.res.status).toBe(200);
    const absent = await post({ jsonrpc: "2.0", id: 1, method: "tools/list", params: { _meta: meta } });
    expect(absent.res.status).toBe(400);
    expect(absent.json.error?.code).toBe(-32020);
    expect(absent.json.error?.message).toContain("mcp-protocol-version");
  });

  test("compares a base64 sentinel by its decoded value", async () => {
    const encoded = `=?base64?${Buffer.from("한글도구", "utf8").toString("base64")}?=`;
    const { res, json } = await post(
      { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "한글도구", _meta: meta } },
      { headers: mirrored("tools/call", encoded) },
    );
    // Past the header check, so the failure is the unknown tool rather than a mismatch.
    expect(res.status).toBe(200);
    expect(json.error?.code).toBe(-32602);
    expect(json.error?.message).toContain("Unknown tool");
  });
});

describe("McpRouter methods", () => {
  test("returns empty catalogues when nothing opted in", async () => {
    for (const [method, key] of [
      ["tools/list", "tools"],
      ["resources/list", "resources"],
      ["resources/templates/list", "resourceTemplates"],
      ["prompts/list", "prompts"],
    ] as const) {
      const { json } = await post({ jsonrpc: "2.0", id: 1, method });
      expect(json.result[key]).toEqual([]);
    }
  });

  test("answers an unimplemented method with 404 for a modern client and 200 for a legacy one", async () => {
    const modern = await post(
      { jsonrpc: "2.0", id: 1, method: "sampling/createMessage", params: { _meta: meta } },
      { headers: mirrored("sampling/createMessage") },
    );
    expect(modern.res.status).toBe(404);
    expect(modern.json.error?.code).toBe(-32601);
    const legacy = await post({ jsonrpc: "2.0", id: 1, method: "sampling/createMessage" });
    expect(legacy.res.status).toBe(200);
    expect(legacy.json.error?.code).toBe(-32601);
    expect(legacy.json.error?.message).toContain(MCP_MODERN_VERSION);
  });

  test("keeps a tool-level failure at HTTP 200 inside the JSON-RPC error", async () => {
    const { res, json } = await post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "nope" } });
    expect(res.status).toBe(200);
    expect(json.error?.code).toBe(-32602);
  });

  test("refuses an unadvertised resource uri", async () => {
    const { json } = await post({ jsonrpc: "2.0", id: 1, method: "resources/read", params: { uri: "akan://user/1" } });
    expect(json.error?.code).toBe(-32602);
  });
});

describe("McpRouter rate limit", () => {
  const call = (id: number) => ({
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: { name: "nothing", arguments: {} },
  });

  test("answers the call past the budget with 429, a JSON-RPC error and Retry-After, per caller", async () => {
    const handlers = routes({ rateLimit: { calls: 2, windowMs: 60_000 } })["/mcp"];
    const bearer = (sid: string) => ({
      headers: {
        Authorization: `Bearer x.${Buffer.from(JSON.stringify({ sid })).toString("base64url")}.y`,
      },
    });
    for (const id of [1, 2]) {
      const { res, json } = await post(call(id), bearer("a"), handlers);
      expect(res.status).toBe(200);
      expect(json.error?.message).toContain("Unknown tool");
    }
    const third = await post(call(3), bearer("a"), handlers);
    expect(third.res.status).toBe(429);
    expect(third.res.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(third.json.error?.code).toBe(-32010);
    expect(third.json.error?.message).toContain("2 calls per 60s");
    expect((await post(call(4), bearer("b"), handlers)).res.status).toBe(200);
    expect((await post({ jsonrpc: "2.0", id: 5, method: "tools/list" }, bearer("a"), handlers)).res.status).toBe(200);
  });

  test("is on by default and can be turned off", async () => {
    const off = routes({ rateLimit: false })["/mcp"];
    for (let id = 0; id < 130; id += 1) expect((await post(call(id), {}, off)).res.status).toBe(200);
    const on = routes()["/mcp"];
    let limited = 0;
    for (let id = 0; id < 130; id += 1) if ((await post(call(id), {}, on)).res.status === 429) limited += 1;
    expect(limited).toBe(10);
  });
});
