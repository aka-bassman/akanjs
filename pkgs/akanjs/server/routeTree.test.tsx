import type { ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server.browser";
import { RouteElementComposer } from "./routeElementComposer";
import { RouteTreeBuilder } from "./routeTreeBuilder";

async function renderToText(node: ReactNode): Promise<string> {
  return new Response(await renderToReadableStream(node)).text();
}

describe("RouteTreeBuilder implicit locale", () => {
  test("matches locale-prefixed routes while keeping special routes at root", () => {
    const routes = new RouteTreeBuilder({
      "./__root_layout.tsx": async () => ({ default: ({ children }: { children: ReactNode }) => children }),
      "./foo.tsx": async () => ({ default: () => null }),
      "./robots.txt.tsx": async () => ({ default: () => null }),
    }).build();

    const matched = RouteTreeBuilder.match("/ko/foo", routes);
    expect(matched?.params).toEqual({ lang: "ko" });
    expect(matched?.pathRoute.path).toBe("/:lang/foo");
    expect(matched?.pathRoute.renderRootLayouts).toHaveLength(1);

    const robots = RouteTreeBuilder.match("/robots.txt", routes);
    expect(robots?.params).toEqual({});
    expect(robots?.pathRoute.isSpecialRoute).toBe(true);
    expect(robots?.pathRoute.renderRootLayouts).toHaveLength(0);
  });

  test("uses the nearest route head without merging parents", async () => {
    const prevBasePaths = process.env.AKAN_PUBLIC_BASE_PATHS;
    process.env.AKAN_PUBLIC_BASE_PATHS = "foo";
    try {
      const routes = new RouteTreeBuilder({
        "./__root_layout.tsx": async () => ({
          default: ({ children }: { children: ReactNode }) => children,
          head: "root",
        }),
        "./foo/__root_layout.tsx": async () => ({
          default: ({ children }: { children: ReactNode }) => children,
          head: "foo-root",
        }),
        "./foo/bar.tsx": async () => ({ default: () => null }),
        "./foo/baz.tsx": async () => ({ default: () => null, head: "baz-page" }),
      }).build();

      const bar = RouteTreeBuilder.match("/ko/foo/bar", routes);
      const baz = RouteTreeBuilder.match("/ko/foo/baz", routes);
      expect(
        bar &&
          (await RouteElementComposer.resolveHead({ pathRoute: bar.pathRoute, params: bar.params, searchParams: {} })),
      ).toBe("foo-root");
      expect(
        baz &&
          (await RouteElementComposer.resolveHead({ pathRoute: baz.pathRoute, params: baz.params, searchParams: {} })),
      ).toBe("baz-page");
    } finally {
      process.env.AKAN_PUBLIC_BASE_PATHS = prevBasePaths;
    }
  });

  test("allows wsConnect export on internal root layouts", async () => {
    const routes = new RouteTreeBuilder({
      "./__root_layout.tsx": async () => ({
        default: ({ children }: { children: ReactNode }) => children,
        head: "root",
        wsConnect: false,
      }),
      "./foo.tsx": async () => ({ default: () => null }),
    }).build();
    const matched = RouteTreeBuilder.match("/ko/foo", routes);

    expect(
      matched &&
        (await RouteElementComposer.resolveHead({
          pathRoute: matched.pathRoute,
          params: matched.params,
          searchParams: {},
        })),
    ).toBe("root");
  });

  test("supports route groups, repeated search params, and cached lazy modules", async () => {
    let loadCount = 0;
    const routes = new RouteTreeBuilder({
      "./__root_layout.tsx": async () => ({ default: ({ children }: { children: ReactNode }) => children }),
      "./(marketing)/about.tsx": async () => {
        loadCount += 1;
        return { default: () => null, head: "about" };
      },
    }).build();
    const matched = RouteTreeBuilder.match("/ko/about", routes);

    expect(matched?.pathRoute.path).toBe("/:lang/about");
    expect(RouteTreeBuilder.parseSearchParams("?tag=a&tag=b&sort=latest")).toEqual({
      tag: ["a", "b"],
      sort: "latest",
    });

    expect(
      matched &&
        (await RouteElementComposer.resolveHead({
          pathRoute: matched.pathRoute,
          params: matched.params,
          searchParams: {},
        })),
    ).toBe("about");
    expect(
      matched &&
        (await RouteElementComposer.resolveHead({
          pathRoute: matched.pathRoute,
          params: matched.params,
          searchParams: {},
        })),
    ).toBe("about");
    expect(loadCount).toBe(1);
    expect(RouteTreeBuilder.getCacheStats()).toMatchObject({
      moduleCount: 2,
      loadedModuleCount: 1,
      cacheHits: 1,
      cacheMisses: 1,
    });
  });

  test("rejects duplicate route patterns and unsupported page exports", () => {
    expect(() =>
      new RouteTreeBuilder({
        "./users/[id].tsx": async () => ({ default: () => null }),
        "./users/:id.tsx": async () => ({ default: () => null }),
      }).build(),
    ).toThrow();

    const routes = new RouteTreeBuilder({
      "./bad.tsx": async () => ({ default: () => null, loader: () => null }) as never,
    }).build();
    const matched = RouteTreeBuilder.match("/ko/bad", routes);

    expect(
      matched &&
        RouteElementComposer.resolveHead({ pathRoute: matched.pathRoute, params: matched.params, searchParams: {} }),
    ).rejects.toThrow('[route-convention] unsupported export "loader"');

    const routesWithBadFallback = new RouteTreeBuilder({
      "./bad-fallback.tsx": async () => ({ default: () => null, NotFound: () => null }) as never,
    }).build();
    const badFallback = RouteTreeBuilder.match("/ko/bad-fallback", routesWithBadFallback);
    expect(
      badFallback &&
        RouteElementComposer.resolveHead({
          pathRoute: badFallback.pathRoute,
          params: badFallback.params,
          searchParams: {},
        }),
    ).rejects.toThrow('[route-convention] unsupported export "NotFound"');
  });

  test("composes nearest layout NotFound and Error fallbacks", async () => {
    const builder = new RouteTreeBuilder({
      "./__root_layout.tsx": async () => ({
        default: ({ children }: { children: ReactNode }) => <main>root:{children}</main>,
        NotFound: ({ pathname }: { pathname: string }) => <p>root missing {pathname}</p>,
      }),
      "./docs/_layout.tsx": async () => ({
        default: ({ children }: { children: ReactNode }) => <section>docs:{children}</section>,
        NotFound: ({ pathname, params }: { pathname: string; params: Record<string, string> }) => (
          <p>
            docs missing {params.lang}:{pathname}
          </p>
        ),
        Error: ({ error }: { error?: unknown }) => (
          <p>docs error {error instanceof Error ? error.message : "unknown"}</p>
        ),
      }),
      "./docs/guide.tsx": async () => ({ default: () => <article>guide</article> }),
    });
    const routes = builder.build();
    const matched = RouteTreeBuilder.match("/ko/docs/guide", routes);
    if (!matched) throw new Error("route did not match");

    const notFound = await RouteElementComposer.composeFallback({
      kind: "not-found",
      route: matched.pathRoute,
      params: matched.params,
      searchParams: {},
      pathname: "/ko/docs/guide",
    });
    const error = await RouteElementComposer.composeFallback({
      kind: "error",
      route: matched.pathRoute,
      params: matched.params,
      searchParams: {},
      pathname: "/ko/docs/guide",
      error: new Error("boom"),
    });

    const notFoundHtml = await renderToText(notFound);
    const errorHtml = await renderToText(error);
    expect(notFoundHtml).toContain("root:");
    expect(notFoundHtml).toContain("docs:");
    expect(notFoundHtml).toContain("docs missing");
    expect(notFoundHtml).toContain("/ko/docs/guide");
    expect(errorHtml).toContain("docs error");
    expect(errorHtml).toContain("boom");

    const unmatched = RouteTreeBuilder.matchFallback("/ko/docs/missing/path", builder.getFallbackRoutes());
    expect(unmatched?.fallbackRoute.path).toBe("/:lang/docs");
    const unmatchedNotFound =
      unmatched &&
      (await RouteElementComposer.composeFallback({
        kind: "not-found",
        route: unmatched.fallbackRoute,
        params: unmatched.params,
        searchParams: {},
        pathname: "/ko/docs/missing/path",
      }));
    const unmatchedHtml = await renderToText(unmatchedNotFound);
    expect(unmatchedHtml).toContain("docs missing");
    expect(unmatchedHtml).toContain("/ko/docs/missing/path");
  });
});
