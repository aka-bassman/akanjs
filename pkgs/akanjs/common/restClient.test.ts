import { describe, expect, test } from "bun:test";

import { RestClient } from ".";

type FetchCall = {
  url: string | URL | Request;
  init?: RequestInit;
};

const withMockFetch = async <T>(
  handler: (url: string | URL | Request, init?: RequestInit) => Response | Promise<Response>,
  run: () => Promise<T>,
) => {
  const previousFetch = globalThis.fetch;
  const calls: FetchCall[] = [];

  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url, init });
    return await handler(url, init);
  }) as typeof fetch;

  try {
    return { result: await run(), calls };
  } finally {
    globalThis.fetch = previousFetch;
  }
};

describe("RestClient", () => {
  test("builds base URLs, merges headers, and parses JSON responses", async () => {
    const client = new RestClient({
      baseUrl: "https://api.example.com/",
      headers: { Authorization: "Bearer token" },
    });

    const { result, calls } = await withMockFetch(
      async () =>
        Response.json({
          ok: true,
        }),
      () => client.post<{ ok: boolean }>("/users", { name: "Akan" }, { headers: { "X-Request-Id": "req-1" } }),
    );

    expect(result).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.example.com/users");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.body).toBe(JSON.stringify({ name: "Akan" }));
    expect(new Headers(calls[0]?.init?.headers).get("authorization")).toBe("Bearer token");
    expect(new Headers(calls[0]?.init?.headers).get("x-request-id")).toBe("req-1");
    expect(new Headers(calls[0]?.init?.headers).get("content-type")).toBe("application/json");
  });

  test("returns text, undefined for 204, and throws response body on failures", async () => {
    const textClient = new RestClient("https://api.example.com");
    const textResult = await withMockFetch(
      async () => new Response("plain text", { headers: { "content-type": "text/plain" } }),
      () => textClient.get<string>("health"),
    );

    expect(textResult.result).toBe("plain text");
    expect(textResult.calls[0]?.url).toBe("https://api.example.com/health");

    const emptyResult = await withMockFetch(
      async () => new Response(null, { status: 204 }),
      () => textClient.delete<undefined>("/users/1"),
    );
    expect(emptyResult.result).toBeUndefined();

    await expect(
      withMockFetch(
        async () => new Response("failed", { status: 500 }),
        () => textClient.get("/broken"),
      ),
    ).rejects.toThrow("failed");
  });

  test("passes through body types that should not be JSON encoded", async () => {
    const client = new RestClient();
    const params = new URLSearchParams({ q: "akan" });

    const { calls } = await withMockFetch(
      async () => Response.json({ ok: true }),
      () => client.put("/search", params),
    );

    expect(calls[0]?.url).toBe("/search");
    expect(calls[0]?.init?.body).toBe(params);
    expect(new Headers(calls[0]?.init?.headers).get("content-type")).toBeNull();
  });
});
