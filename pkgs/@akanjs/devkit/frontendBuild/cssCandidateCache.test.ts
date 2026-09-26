import { describe, expect, test } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { CssCandidateCache } from "./cssCandidateCache";

const scan = async (source: string) => {
  const dir = await mkdtemp(path.join(tmpdir(), "css-candidate-"));
  const file = path.join(dir, "probe.tsx");
  await writeFile(file, source);
  return await new CssCandidateCache(path.join(dir, "cache.json")).load().then((c) => c.candidatesFor(file));
};

describe("CssCandidateCache token extraction", () => {
  test("keeps plain utilities, variants and arbitrary values whole", async () => {
    const candidates = await scan(`const c = "w-full hover:bg-muted md:w-1/2 text-[#fff]";`);
    expect(candidates).toEqual(expect.arrayContaining(["w-full", "hover:bg-muted", "md:w-1/2", "text-[#fff]"]));
  });

  test("keeps an arbitrary variant that starts with a bracket", async () => {
    const candidates = await scan(`const c = "[&_td]:px-3 [&>*]:gap-2 [&_tbody_tr]:border-t";`);
    expect(candidates).toEqual(expect.arrayContaining(["[&_td]:px-3", "[&>*]:gap-2", "[&_tbody_tr]:border-t"]));
    expect(candidates).not.toContain("_td");
  });

  test("ignores a labelled tuple type that only looks like an arbitrary property", async () => {
    const candidates = await scan(
      `type A = [key: string, make: () => unknown][];\ntype B = [setQueryArgs: (a: Args) => Args, options?: Policy];`,
    );
    expect(candidates.filter((candidate) => candidate.startsWith("["))).toEqual([]);
  });
});
