import { describe, expect, test } from "bun:test";
import { createDefaultRobotsTxt } from "./robots";

describe("createDefaultRobotsTxt", () => {
  test("allows public paths to every crawler, AI crawlers included, while blocking internal paths", () => {
    const robots = createDefaultRobotsTxt();

    expect(robots).toContain("User-agent: *\nAllow: /");
    for (const path of ["/api", "/_akan", "/admin", "/manager", "/private"]) {
      expect(robots).toContain(`Disallow: ${path}`);
    }
    expect(robots.match(/^User-agent: .*$/gm)).toEqual(["User-agent: *"]);
    expect(robots).not.toContain("Disallow: /\n");
  });

  test("blocks the configured api prefix rather than a literal /api", () => {
    process.env.AKAN_API_PREFIX = "/backend";
    try {
      const robots = createDefaultRobotsTxt();
      expect(robots).toContain("Disallow: /backend");
      expect(robots).not.toContain("Disallow: /api");
    } finally {
      delete process.env.AKAN_API_PREFIX;
    }
  });
});
