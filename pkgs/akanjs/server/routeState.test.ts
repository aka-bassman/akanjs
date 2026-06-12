import { describe, expect, test } from "bun:test";
import type { PathRoute } from "akanjs/client";
import {
  appendAkanRouterStateRequestHeaders,
  createAkanRouterState,
  decodeAkanRouterState,
  encodeAkanRouterState,
  readAkanRouterStateRequest,
  resolveAkanRscPartialDecision,
} from "./routeState";

function makeRoute(path: string, pathSegments: string[], rootLayouts = 1, layouts = 0): PathRoute {
  return {
    path,
    pathSegments,
    renderPage: (() => null) as never,
    pageState: {} as never,
    renderRootLayouts: Array.from({ length: rootLayouts }, () => ({ render: () => null })),
    renderLayouts: Array.from({ length: layouts }, () => ({ render: () => null })),
  };
}

describe("RSC route state helpers", () => {
  test("creates stable segment keys from the route render stack", () => {
    const state = createAkanRouterState({
      pathRoute: makeRoute("/:lang/docs/:slug", ["/", "/:lang", "/docs", "/:slug"], 2, 1),
      href: "https://example.test/en/docs/intro",
      buildId: 7,
    });

    expect(state).toMatchObject({
      version: 1,
      buildId: 7,
      href: "https://example.test/en/docs/intro",
      routeId: "/:lang/docs/:slug",
    });
    expect(state.segments).toEqual([
      { kind: "root-layout", path: "/", key: "root:/:0" },
      { kind: "root-layout", path: "/:lang", key: "root:/:lang:1" },
      { kind: "layout", path: "/docs", key: "layout:/docs:2" },
      { kind: "page", path: "/:lang/docs/:slug", key: "page:/:lang/docs/:slug:3" },
    ]);
  });

  test("round-trips route state through base64url headers", () => {
    const state = createAkanRouterState({
      pathRoute: makeRoute("/docs", ["/", "/docs"]),
      href: "https://example.test/docs",
    });
    const encoded = encodeAkanRouterState(state);

    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(decodeAkanRouterState(encoded)).toEqual(state);

    const headers = new Headers();
    appendAkanRouterStateRequestHeaders(headers, state);
    expect(readAkanRouterStateRequest(headers)).toEqual({ state, currentRoute: "/docs" });
  });

  test("falls back quietly for malformed request state headers", () => {
    expect(readAkanRouterStateRequest(new Headers()).reason).toBe("missing-state");

    const wrongVersion = new Headers({
      "X-Akan-Rsc-State-Version": "2",
      "X-Akan-Rsc-Current-State": "bad",
    });
    expect(readAkanRouterStateRequest(wrongVersion)).toEqual({ state: null, reason: "version-mismatch" });

    const malformed = new Headers({
      "X-Akan-Rsc-State-Version": "1",
      "X-Akan-Rsc-Current-State": "bad",
    });
    expect(readAkanRouterStateRequest(malformed)).toEqual({ state: null, reason: "invalid-state" });
  });

  test("treats searchParams-only changes as partial candidates", () => {
    const pathRoute = makeRoute("/docs", ["/", "/docs"], 1, 1);
    const current = createAkanRouterState({
      pathRoute,
      href: "https://example.test/docs?page=1",
      buildId: 3,
    });
    const target = createAkanRouterState({
      pathRoute,
      href: "https://example.test/docs?page=2",
      buildId: 3,
    });

    expect(
      resolveAkanRscPartialDecision({ currentState: current, currentRoute: "/docs", targetState: target }),
    ).toEqual({
      status: "candidate",
      reason: "common-prefix",
      commonPrefixLength: 3,
    });
  });

  test("treats sibling pages under the same layout chain as partial candidates", () => {
    const current = createAkanRouterState({
      pathRoute: makeRoute("/docs/intro", ["/", "/docs", "/intro"], 1, 1),
      href: "https://example.test/docs/intro",
      buildId: 3,
    });
    const target = createAkanRouterState({
      pathRoute: makeRoute("/docs/api", ["/", "/docs", "/api"], 1, 1),
      href: "https://example.test/docs/api",
      buildId: 3,
    });

    expect(
      resolveAkanRscPartialDecision({ currentState: current, currentRoute: "/docs/intro", targetState: target }),
    ).toMatchObject({
      status: "candidate",
      reason: "common-prefix",
      commonPrefixLength: 2,
    });
  });

  test("keeps invalid or incompatible states on the full fallback path", () => {
    const current = createAkanRouterState({
      pathRoute: makeRoute("/docs", ["/", "/docs"]),
      href: "https://example.test/docs",
      buildId: 1,
    });
    const target = createAkanRouterState({
      pathRoute: makeRoute("/blog", ["/blog"]),
      href: "https://example.test/blog",
      buildId: 1,
    });

    expect(resolveAkanRscPartialDecision({ currentState: null, targetState: target })).toMatchObject({
      status: "full",
      reason: "missing-state",
    });
    expect(
      resolveAkanRscPartialDecision({ currentState: current, currentRoute: "/other", targetState: target }),
    ).toMatchObject({
      status: "fallback",
      reason: "current-route-mismatch",
    });
    expect(
      resolveAkanRscPartialDecision({
        currentState: { ...current, buildId: 1 },
        targetState: { ...target, buildId: 2 },
      }),
    ).toMatchObject({ status: "fallback", reason: "build-mismatch" });
    expect(resolveAkanRscPartialDecision({ currentState: current, targetState: target })).toMatchObject({
      status: "full",
      reason: "root-mismatch",
    });
  });
});
