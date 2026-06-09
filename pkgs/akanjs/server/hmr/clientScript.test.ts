import { describe, expect, test } from "bun:test";
import { HMR_CLIENT_SCRIPT } from "./clientScript";

describe("HMR_CLIENT_SCRIPT", () => {
  test("routes incremental refresh messages without forcing a document reload", () => {
    expect(HMR_CLIENT_SCRIPT).toContain('if (msg.type === "rsc-refresh") {\n        refreshRsc(msg);');
    expect(HMR_CLIENT_SCRIPT).toContain('if (msg.type === "client-refresh") {\n        refreshClient(msg);');
    expect(HMR_CLIENT_SCRIPT).not.toContain("function reloadForHmr");
  });
});
