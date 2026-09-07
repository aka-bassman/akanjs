import { describe, expect, test } from "bun:test";
import { createDefaultRobotsTxt } from "./robots";

describe("createDefaultRobotsTxt", () => {
  test("allows public paths while blocking internal paths and AI crawlers", () => {
    const robots = createDefaultRobotsTxt();

    expect(robots).toContain("User-agent: *\nAllow: /");
    for (const path of ["/api", "/_akan", "/admin", "/manager", "/private"]) {
      expect(robots).toContain(`Disallow: ${path}`);
    }
    for (const crawler of ["GPTBot", "PerplexityBot", "CCBot", "ClaudeBot", "Google-Extended"]) {
      expect(robots).toContain(`User-agent: ${crawler}\nDisallow: /`);
    }
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
