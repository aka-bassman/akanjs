import { describe, expect, test } from "bun:test";
import { createDefaultSitemapUrls, createSitemapXml, getSitemapBasePath } from "./sitemap";

describe("sitemap fallback helpers", () => {
  const i18n = { defaultLocale: "en", locales: ["en", "ko"] };

  test("creates escaped XML with unique sorted URLs", () => {
    const xml = createSitemapXml(["https://example.com/b?x=1&y=2", "https://example.com/a", "https://example.com/a"]);

    expect(xml).toContain("<loc>https://example.com/a</loc>");
    expect(xml).toContain("<loc>https://example.com/b?x=1&amp;y=2</loc>");
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });

  test("expands only static locale routes", () => {
    const urls = createDefaultSitemapUrls({
      origin: "https://example.com",
      entries: [
        { routeId: "/:lang", pattern: "/:lang", seeds: [] },
        { routeId: "/:lang/about", pattern: "/:lang/about", seeds: [] },
        { routeId: "/:lang/post/:postId", pattern: "/:lang/post/:postId", seeds: [] },
        { routeId: "/robots.txt", pattern: "/robots.txt", seeds: [] },
      ],
      i18n,
    });

    expect(urls).toEqual([
      "https://example.com/en",
      "https://example.com/ko",
      "https://example.com/en/about",
      "https://example.com/ko/about",
    ]);
  });

  test("uses base path only for filtering subroute sitemap entries", () => {
    const urls = createDefaultSitemapUrls({
      origin: "https://example.com/",
      basePath: "akanjs",
      entries: [
        { routeId: "/:lang/akanjs", pattern: "/:lang/akanjs", seeds: [] },
        { routeId: "/:lang/akanjs/about", pattern: "/:lang/akanjs/about", seeds: [] },
        { routeId: "/:lang/thin/about", pattern: "/:lang/thin/about", seeds: [] },
        { routeId: "/:lang/akanjs/post/:postId", pattern: "/:lang/akanjs/post/:postId", seeds: [] },
      ],
      i18n,
    });

    expect(urls).toEqual([
      "https://example.com/en",
      "https://example.com/ko",
      "https://example.com/en/about",
      "https://example.com/ko/about",
    ]);
  });

  test("recognizes root and subroute sitemap paths", () => {
    expect(getSitemapBasePath("/sitemap.xml", [])).toBeNull();
    expect(getSitemapBasePath("/sitemap.xml", ["akanjs"])).toBeUndefined();
    expect(getSitemapBasePath("/sitemap.xml", ["akanjs"], "akanjs")).toBe("akanjs");
    expect(getSitemapBasePath("/akanjs/sitemap.xml", ["akanjs"], "akanjs")).toBeUndefined();
  });
});
