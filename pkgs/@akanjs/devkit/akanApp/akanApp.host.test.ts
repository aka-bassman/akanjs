import { describe, expect, test } from "bun:test";
import { AkanAppHost } from "./akanApp.host";

describe("readProcessRssBytes", () => {
  test("reads this process's own rss", async () => {
    const rssBytes = await AkanAppHost.readProcessRssBytes(process.pid);
    if (rssBytes === null) throw new Error("expected to read this process's own rss");
    expect(rssBytes).toBeGreaterThan(1024 * 1024);
    expect(rssBytes).toBeLessThan(64 * 1024 * 1024 * 1024);
  });

  // A 0 would read as "settled below the ceiling" and cancel a recycle that should happen.
  test("returns null for a pid that does not exist", async () => {
    expect(await AkanAppHost.readProcessRssBytes(2_147_483_646)).toBeNull();
  });
});
