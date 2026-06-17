import { describe, expect, test } from "bun:test";
import { isAkanRuntimeMetadataFile, manifestClientEntriesForFiles } from "./devHmrController";

describe("DevHmrController runtime metadata detection", () => {
  test("detects generated app client runtime metadata files", () => {
    expect(isAkanRuntimeMetadataFile("/repo/apps/demo/lib/useClient.ts")).toBe(true);
    expect(isAkanRuntimeMetadataFile("/repo/apps/demo/lib/dict.ts")).toBe(true);
    expect(isAkanRuntimeMetadataFile("/repo/apps/demo/lib/sig.ts")).toBe(true);
  });

  test("detects app and library dictionary/signal module files", () => {
    expect(isAkanRuntimeMetadataFile("/repo/apps/demo/lib/_akan/akan.dictionary.ts")).toBe(true);
    expect(isAkanRuntimeMetadataFile("/repo/apps/demo/lib/_akan/akan.signal.ts")).toBe(true);
    expect(isAkanRuntimeMetadataFile("/repo/libs/shared/lib/admin/admin.dictionary.ts")).toBe(true);
    expect(isAkanRuntimeMetadataFile("/repo/libs/shared/lib/admin/admin.signal.ts")).toBe(true);
  });

  test("ignores unrelated source files", () => {
    expect(isAkanRuntimeMetadataFile("/repo/apps/demo/page/_index.tsx")).toBe(false);
    expect(isAkanRuntimeMetadataFile("/repo/apps/demo/lib/task/task.service.ts")).toBe(false);
    expect(isAkanRuntimeMetadataFile("/repo/apps/demo/lib/task/dictionary.ts")).toBe(false);
    expect(isAkanRuntimeMetadataFile("/repo/apps/demo/page/example.signal.ts")).toBe(false);
  });
});

describe("DevHmrController client manifest entry detection", () => {
  test("detects changed client entries from relative manifest keys", () => {
    const workspaceRoot = "/repo";
    const changed = manifestClientEntriesForFiles(
      ["/repo/apps/demo/ui/Header.tsx"],
      {
        "apps/demo/ui/Header.tsx#Header": {
          id: "/_akan/client/header.js",
          chunks: ["/_akan/client/header.js"],
          name: "Header",
          async: true,
        },
        "apps/demo/ui/Footer.tsx#Footer": {
          id: "/_akan/client/footer.js",
          chunks: ["/_akan/client/footer.js"],
          name: "Footer",
          async: true,
        },
      },
      workspaceRoot,
    );

    expect(changed).toEqual(new Set(["/repo/apps/demo/ui/Header.tsx"]));
  });
});
