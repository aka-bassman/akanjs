import { describe, expect, test } from "bun:test";
import path from "node:path";
import { DevChangePlanner, type GeneratedIndexSyncResult } from "../frontendBuild";
import { prepareDevWatchBatch } from "./devWatchBatch";

const prepare = (root: string, generation: number, file: string, indexSync: GeneratedIndexSyncResult) =>
  prepareDevWatchBatch({
    generation,
    batch: { files: [file], kinds: new Set(["code"]) },
    indexSync,
    changePlanner: new DevChangePlanner({ workspaceRoot: root }),
  });

describe("prepareDevWatchBatch", () => {
  test("includes generated indexes in the same invalidate generation", () => {
    const root = path.resolve("/repo");
    const changedFile = path.join(root, "libs/shared/common/foo.ts");
    const generatedIndex = path.join(root, "libs/shared/common/index.ts");
    const prepared = prepare(root, 12, changedFile, { changedFiles: [generatedIndex], errors: [] });

    expect(prepared.hasSyncErrors).toBe(false);
    expect(prepared.files).toEqual([changedFile, generatedIndex]);
    expect(prepared.event.generation).toBe(12);
    expect(prepared.event.files).toEqual(prepared.files);
    expect(prepared.event.devPlan?.generatedFiles).toEqual([generatedIndex]);
    expect(prepared.event.devPlan?.files).toEqual(prepared.files);
  });

  test.each(["common", "srvkit", "ui", "webkit"])(
    "keeps %s facet add/delete generated index in the same generation",
    (facet) => {
      const root = path.resolve("/repo");
      const changedFile = path.join(root, "libs/shared", facet, "tmpExample.ts");
      const generatedIndex = path.join(root, "libs/shared", facet, "index.ts");
      const prepared = prepare(root, 20, changedFile, { changedFiles: [generatedIndex], errors: [] });

      expect(new Set(prepared.files)).toEqual(new Set([changedFile, generatedIndex]));
      expect(prepared.event.devPlan?.generatedFiles).toEqual([generatedIndex]);
      expect(prepared.event.devPlan?.roles).toContain("barrel");
      expect(prepared.event.devPlan?.actions).toContain("sync-generated");
    },
  );

  test("marks failed generated index sync as an error generation", () => {
    const root = "/repo";
    const prepared = prepare(root, 13, `${root}/libs/shared/common/foo.ts`, {
      changedFiles: [],
      errors: ["sync failed"],
    });

    expect(prepared.hasSyncErrors).toBe(true);
    expect(prepared.event.devPlan?.actions).toContain("report-error");
  });
});
