import { describe, expect, test } from "bun:test";
import { CodeTuiFiles } from "./CodeTuiFiles";

const repoRoot = `${import.meta.dir}/../../../..`;

describe("CodeTuiFiles", () => {
  test("matches a file by any part of its path, shortest first", async () => {
    const files = new CodeTuiFiles(repoRoot);
    await files.load();
    expect(files.ready).toBe(true);
    const hits = files.match("CodeTuiFiles");
    expect(hits).toContain("pkgs/@akanjs/cli/code/CodeTuiFiles.ts");
    // The name itself beats a longer path that merely contains it.
    expect(hits[0]).toBe("pkgs/@akanjs/cli/code/CodeTuiFiles.ts");
  });

  /** The paths a mention inserts are the ones the agent's own read tool takes, which are relative to its root. */
  test("paths are relative to the root the agent was given", async () => {
    const files = new CodeTuiFiles(`${import.meta.dir}/..`);
    await files.load();
    expect(files.match("CodeTuiFiles")).toContain("code/CodeTuiFiles.ts");
  });

  test("an untracked directory lists nothing rather than walking the disk", async () => {
    const files = new CodeTuiFiles("/");
    await files.load();
    expect(files.match("a")).toEqual([]);
  });
});
