import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { CodeAgentMcpServerRef } from "akanjs/common";
import { McpOAuth } from "./McpOAuth";
import { McpSignIn } from "./McpSignIn";
import { McpTokenStore } from "./McpTokenStore";
import { McpToolPack } from "./McpToolPack";

// A real server, not stubbed fetches: the wire contract (challenge header, well-known paths, PKCE) is under test.
class FakeProvider {
  readonly server: ReturnType<typeof Bun.serve>;
  readonly issued: string[] = [];
  readonly registrations: { redirect_uris?: string[] }[] = [];
  readonly #codes = new Map<string, { challenge: string; resource: string | null }>();
  #next = 0;
  methods: string[] = ["S256"];
  registerable = true;
  refreshable = true;
  refreshExpiresIn: number | undefined = 3600;

  constructor() {
    this.server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: (request) => this.#route(request) });
  }

  get origin() {
    return `http://127.0.0.1:${this.server.port}`;
  }

  get mcpUrl() {
    return `${this.origin}/mcp`;
  }

  close() {
    this.server.stop(true);
  }

  async #route(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/mcp") return await this.#mcp(request);
    if (url.pathname === "/.well-known/oauth-protected-resource/mcp")
      return Response.json({ resource: this.mcpUrl, authorization_servers: [this.origin], scopes_supported: ["read"] });
    if (url.pathname === "/.well-known/oauth-authorization-server")
      return Response.json({
        issuer: this.origin,
        authorization_endpoint: `${this.origin}/authorize`,
        token_endpoint: `${this.origin}/token`,
        ...(this.registerable ? { registration_endpoint: `${this.origin}/register` } : {}),
        code_challenge_methods_supported: this.methods,
      });
    if (url.pathname === "/register") return await this.#register(request);
    if (url.pathname === "/authorize") return this.#authorize(url);
    if (url.pathname === "/token") return await this.#token(request);
    return new Response("not found", { status: 404 });
  }

  async #mcp(request: Request) {
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token || !this.issued.includes(token))
      return Response.json(
        { error_description: "Authentication is required to use this MCP server." },
        {
          status: 401,
          headers: {
            "WWW-Authenticate": `Bearer resource_metadata="${this.origin}/.well-known/oauth-protected-resource/mcp"`,
          },
        },
      );
    const body = (await request.json()) as { id?: number; method?: string };
    if (body.method === "initialize")
      return Response.json({ jsonrpc: "2.0", id: body.id, result: { protocolVersion: "2025-06-18" } });
    if (body.method === "tools/list")
      return Response.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          tools: [{ name: "search", description: "search it", inputSchema: { type: "object", properties: {} } }],
        },
      });
    return Response.json({ jsonrpc: "2.0", id: body.id, result: {} });
  }

  async #register(request: Request) {
    const body = (await request.json()) as { redirect_uris?: string[] };
    this.registrations.push(body);
    this.#next += 1;
    return Response.json({ client_id: `client-${this.#next}`, redirect_uris: body.redirect_uris });
  }

  #authorize(url: URL) {
    const redirect = url.searchParams.get("redirect_uri") ?? "";
    const challenge = url.searchParams.get("code_challenge") ?? "";
    const code = `code-${this.#codes.size + 1}`;
    this.#codes.set(code, { challenge, resource: url.searchParams.get("resource") });
    const back = new URL(redirect);
    back.searchParams.set("code", code);
    back.searchParams.set("state", url.searchParams.get("state") ?? "");
    back.searchParams.set("iss", this.origin);
    return Response.redirect(back.href, 302);
  }

  async #token(request: Request) {
    const form = new URLSearchParams(await request.text());
    if (form.get("grant_type") === "refresh_token") {
      if (!this.refreshable) return Response.json({ error: "invalid_grant" }, { status: 400 });
      const access = `access-refreshed-${this.issued.length + 1}`;
      this.issued.push(access);
      return Response.json({ access_token: access, refresh_token: "refresh-2", expires_in: this.refreshExpiresIn });
    }
    const issued = this.#codes.get(form.get("code") ?? "");
    if (!issued) return Response.json({ error: "invalid_grant" }, { status: 400 });
    const verifier = form.get("code_verifier") ?? "";
    if (createHash("sha256").update(verifier).digest("base64url") !== issued.challenge)
      return Response.json({ error: "invalid_grant" }, { status: 400 });
    const access = `access-${this.issued.length + 1}`;
    this.issued.push(access);
    return Response.json({ access_token: access, refresh_token: "refresh-1", expires_in: 3600, scope: "read" });
  }
}

let provider: FakeProvider;
let home: string;
let realHome: string | undefined;

const refOf = (patch: Partial<CodeAgentMcpServerRef> = {}): CodeAgentMcpServerRef => ({
  name: "fake",
  transport: "http",
  url: provider.mcpUrl,
  ...patch,
});

const browser = (url: string) => void fetch(url).catch(() => undefined);

// AKAN_CODE_HOME, not HOME: Bun caches os.homedir(), so a late HOME write would land tokens in the real ~/.akan/code.
beforeAll(() => {
  realHome = process.env.AKAN_CODE_HOME;
  home = mkdtempSync(path.join(tmpdir(), "akan-mcpauth-"));
  process.env.AKAN_CODE_HOME = home;
  expect(McpTokenStore.file().startsWith(home)).toBe(true);
});

afterAll(() => {
  if (realHome === undefined) delete process.env.AKAN_CODE_HOME;
  else process.env.AKAN_CODE_HOME = realHome;
  rmSync(home, { recursive: true, force: true });
});

beforeEach(() => {
  provider = new FakeProvider();
  rmSync(McpTokenStore.file(), { force: true });
});

afterEach(() => {
  provider.close();
});

describe("MCP OAuth discovery", () => {
  test("the challenge names the metadata, and it is preferred over any url we could derive", () => {
    expect(
      McpOAuth.resourceMetadataUrls("https://x.dev/mcp", 'Bearer resource_metadata="https://x.dev/custom"'),
    ).toEqual(["https://x.dev/custom"]);
  });

  test("with no challenge, both spellings of the well-known url are tried", () => {
    expect(McpOAuth.resourceMetadataUrls("https://x.dev/mcp")).toEqual([
      "https://x.dev/.well-known/oauth-protected-resource/mcp",
      "https://x.dev/.well-known/oauth-protected-resource",
    ]);
  });

  test("the issuer's path is inserted after the suffix, as RFC 8414 requires", () => {
    expect(McpOAuth.serverMetadataUrls("https://x.dev/tenant/a")).toEqual([
      "https://x.dev/.well-known/oauth-authorization-server/tenant/a",
      "https://x.dev/tenant/a/.well-known/openid-configuration",
      "https://x.dev/.well-known/oauth-authorization-server",
    ]);
  });

  test("everything the flow needs is found from the server url alone", async () => {
    const server = await McpOAuth.discover(provider.mcpUrl, await McpSignIn.challenge(refOf()));
    expect(server).toMatchObject({
      issuer: provider.origin,
      authorizationEndpoint: `${provider.origin}/authorize`,
      tokenEndpoint: `${provider.origin}/token`,
      registrationEndpoint: `${provider.origin}/register`,
      resource: provider.mcpUrl,
      resourceScopes: ["read"],
    });
  });

  test("a server that will not do S256 is refused rather than downgraded", async () => {
    provider.methods = ["plain"];
    await expect(McpOAuth.discover(provider.mcpUrl)).rejects.toThrow(/S256/);
  });

  test("a server that wants no credential answers no challenge", async () => {
    const open = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: () => Response.json({ jsonrpc: "2.0", id: 0 }) });
    try {
      expect(await McpSignIn.challenge(refOf({ url: `http://127.0.0.1:${open.port}/mcp` }))).toBeNull();
    } finally {
      open.stop(true);
    }
  });
});

describe("MCP sign-in", () => {
  test("a browser round trip ends with a token this session can connect with", async () => {
    const auth = await McpSignIn.run(refOf(), { open: browser });
    expect(auth.accessToken).toBe("access-1");
    expect(auth.issuer).toBe(provider.origin);
    expect(auth.resource).toBe(provider.mcpUrl);
    expect(provider.registrations).toHaveLength(1);
    expect(provider.registrations[0]?.redirect_uris?.[0]).toBe(auth.redirectUri);
    expect(McpTokenStore.read("fake")?.accessToken).toBe("access-1");
  });

  test("the token is what makes the server publish its tools", async () => {
    const before = await McpToolPack.connect({
      workspaceRoot: home,
      profile: { name: "t", tools: { mcp: [refOf()] } } as never,
    });
    expect(before?.status[0]).toMatchObject({ auth: "required", tools: [] });
    await McpSignIn.run(refOf(), { open: browser });
    const after = await McpToolPack.connect({
      workspaceRoot: home,
      profile: { name: "t", tools: { mcp: [refOf()] } } as never,
    });
    try {
      expect(after?.status[0]).toMatchObject({ auth: "authorized" });
      expect(after?.toolNames).toEqual(["mcp__fake__search"]);
    } finally {
      after?.close();
      before?.close();
    }
  });

  test("a second sign-in reuses the client it already registered", async () => {
    await McpSignIn.run(refOf(), { open: browser });
    await McpSignIn.run(refOf(), { open: browser });
    expect(provider.registrations).toHaveLength(1);
  });

  test("an expired token is refreshed without anybody being asked", async () => {
    const auth = await McpSignIn.run(refOf(), { open: browser });
    McpTokenStore.write("fake", { ...auth, expiresAt: Date.now() - 1 });
    expect(await McpSignIn.token(refOf())).toBe("access-refreshed-2");
    expect(McpTokenStore.read("fake")?.refreshToken).toBe("refresh-2");
  });

  test("a refreshed token the server gave no lifetime is kept until refused, not refreshed on every connect", async () => {
    const auth = await McpSignIn.run(refOf(), { open: browser });
    McpTokenStore.write("fake", { ...auth, expiresAt: Date.now() - 1 });
    provider.refreshExpiresIn = undefined;
    expect(await McpSignIn.token(refOf())).toBe("access-refreshed-2");
    expect(await McpSignIn.token(refOf())).toBe("access-refreshed-2");
    expect(McpTokenStore.read("fake")?.expiresAt).toBeUndefined();
  });

  test("a refresh the server refuses reports no token rather than throwing", async () => {
    const auth = await McpSignIn.run(refOf(), { open: browser });
    McpTokenStore.write("fake", { ...auth, expiresAt: Date.now() - 1 });
    provider.refreshable = false;
    const notices: string[] = [];
    expect(await McpSignIn.token(refOf(), (message) => notices.push(message))).toBeUndefined();
    expect(notices.join(" ")).toContain("fake");
  });

  test("a provider that registers no clients says what to declare instead", async () => {
    provider.registerable = false;
    await expect(McpSignIn.run(refOf(), { open: browser })).rejects.toThrow(/clientId/);
  });

  test("a declared client id is used instead of registering one", async () => {
    const auth = await McpSignIn.run(refOf({ oauth: { clientId: "mine" } }), { open: browser });
    expect(auth.clientId).toBe("mine");
    expect(provider.registrations).toHaveLength(0);
  });

  test("a stdio server is told its credential goes in env", async () => {
    await expect(McpSignIn.run({ name: "s", transport: "stdio", command: "x" }, { open: browser })).rejects.toThrow(
      /env/,
    );
  });

  test("signing out forgets the token and leaves nothing behind", async () => {
    await McpSignIn.run(refOf(), { open: browser });
    expect(McpTokenStore.clear("fake")).toBe(true);
    expect(McpTokenStore.read("fake")).toBeUndefined();
    expect(McpTokenStore.clear("fake")).toBe(false);
  });
});

describe("the token file", () => {
  test("it lives outside the workspace", async () => {
    await McpSignIn.run(refOf(), { open: browser });
    const file = McpTokenStore.file();
    expect(file.startsWith(home)).toBe(true);
    expect(await Bun.file(file).exists()).toBe(true);
  });

  test.skipIf(process.platform === "win32")("it is readable only by its owner", async () => {
    await McpSignIn.run(refOf(), { open: browser });
    expect(statSync(McpTokenStore.file()).mode & 0o777).toBe(0o600);
  });

  test("a corrupt file costs the sign-ins and not the session", async () => {
    await McpSignIn.run(refOf(), { open: browser });
    await Bun.write(McpTokenStore.file(), "{ not json");
    expect(McpTokenStore.read("fake")).toBeUndefined();
    expect(McpTokenStore.names()).toEqual([]);
  });
});
