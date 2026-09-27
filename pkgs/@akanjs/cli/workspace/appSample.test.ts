import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import type { SysExecutor } from "@akanjs/devkit/executors";
import { Glob } from "bun";
import facetIndex from "../templates/facetIndex/index";

const sampleRoot = path.join(import.meta.dir, "../templates/appSample");
const facets = ["ui", "webkit", "srvkit", "common", "plugin"].filter((facet) =>
  existsSync(path.join(sampleRoot, facet)),
);

const sampleFilenames = async (facet: string) => {
  const templates = [...new Glob("*.{ts,tsx}").scanSync({ cwd: path.join(sampleRoot, facet) })];
  return await Promise.all(
    templates.map(async (template) => {
      const { default: getContent } = await import(path.join(sampleRoot, facet, template));
      return (await getContent(null, { appName: "myapp" })).filename as string;
    }),
  );
};

describe("appSample", () => {
  test("the generated barrel of each facet exports every file the sample writes into it", async () => {
    for (const facet of facets) {
      const filenames = await sampleFilenames(facet);
      if (!filenames.length) continue;
      const exec = { exists: async () => true, getFilesAndDirs: async () => ({ files: filenames, dirs: [] }) };
      const barrel = await facetIndex(null, {}, { exec: exec as unknown as SysExecutor, facet });
      for (const filename of filenames)
        expect(barrel?.content ?? "").toContain(`export * from "./${filename.replace(/\.tsx?$/, "")}";`);
    }
  });
});
