import { describe, expect, test } from "bun:test";
import { AkanResponse } from "./akanResponse";
import type { WebProxyReturn } from "./types";
import { WebProxyRunner } from "./webProxyRunner";

describe("WebProxyRunner", () => {
  test("matches default document requests and applies next header mutations", async () => {
    class AddHeaderProxy {
      static refName = "addHeader";
      use(request: Bun.BunRequest) {
        return AkanResponse.next({ request: { headers: { ...Object.fromEntries(request.headers), "x-proxy": "1" } } });
      }
    }
    const request = new Request("http://localhost/dashboard") as Request & { params?: Record<string, string> };
    request.params = { lang: "ko" };
    const result = await new WebProxyRunner([AddHeaderProxy]).run(request);

    expect(result.response).toBeUndefined();
    expect(result.request.headers.get("x-proxy")).toBe("1");
    expect((result.request as Request & { params?: Record<string, string> }).params).toEqual({ lang: "ko" });
  });

  test("skips static/internal paths by default and supports matcher rewrites", async () => {
    const calls: string[] = [];
    class DefaultProxy {
      static refName = "defaultProxy";
      use() {
        calls.push("default");
        return AkanResponse.next();
      }
    }
    class RewriteProxy {
      static refName = "rewriteProxy";
      use() {
        calls.push("rewrite");
        return AkanResponse.rewrite("http://localhost/rewritten");
      }
    }
    const runner = new WebProxyRunner([DefaultProxy, { proxy: RewriteProxy, matcher: /^\/api\// }]);

    const staticResult = await runner.run(new Request("http://localhost/favicon.ico"));
    const apiResult = await runner.run(new Request("http://localhost/api/users"));

    expect(staticResult.request.url).toBe("http://localhost/favicon.ico");
    expect(apiResult.request.url).toBe("http://localhost/rewritten");
    expect(calls).toEqual(["default", "rewrite"]);
  });

  test("short-circuits when a proxy returns a response", async () => {
    class StopProxy {
      static refName = "stopProxy";
      use() {
        return new Response("blocked", { status: 401 });
      }
    }
    class NeverProxy {
      static refName = "neverProxy";
      use(): WebProxyReturn {
        throw new Error("should not run");
      }
    }

    const result = await new WebProxyRunner([StopProxy, NeverProxy]).run(new Request("http://localhost/private"));

    expect(result.response?.status).toBe(401);
    expect(await result.response?.text()).toBe("blocked");
  });
});
