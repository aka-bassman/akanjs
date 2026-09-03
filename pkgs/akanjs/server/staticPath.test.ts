import { afterAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import { mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { resolveStaticPath } from "./staticPath";

const roots: string[] = [];
afterAll(() => {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
});

const makeTree = async () => {
  const root = await mkdtemp(path.join(tmpdir(), "akan-static-"));
  roots.push(root);
  const base = path.join(root, "public");
  fs.mkdirSync(path.join(base, "img"), { recursive: true });
  await writeFile(path.join(base, "img", "logo.png"), "png");
  await writeFile(path.join(root, "secret.txt"), "not yours");
  // A sibling whose name starts with the base directory's, which is what the separator in the check is for.
  fs.mkdirSync(`${base}-secrets`, { recursive: true });
  await writeFile(path.join(`${base}-secrets`, "keys.txt"), "not yours either");
  return { root, base };
};

describe("resolveStaticPath", () => {
  test("resolves a file inside the tree", async () => {
    const { base } = await makeTree();
    expect(resolveStaticPath(base, "/img/logo.png")).toBe(path.join(base, "img", "logo.png"));
    // A path that does not exist still resolves: the caller's existence check is what 404s it.
    expect(resolveStaticPath(base, "/img/missing.png")).toBe(path.join(base, "img", "missing.png"));
  });

  test("refuses traversal, encoded traversal, and a NUL byte", async () => {
    const { base } = await makeTree();
    expect(resolveStaticPath(base, "/../secret.txt")).toBeNull();
    expect(resolveStaticPath(base, "/%2e%2e/secret.txt")).toBeNull();
    expect(resolveStaticPath(base, "/img/../../secret.txt")).toBeNull();
    expect(resolveStaticPath(base, "/img/logo.png\0.txt")).toBeNull();
    // A malformed escape makes `decodeURIComponent` throw rather than return the raw text.
    expect(resolveStaticPath(base, "/%")).toBeNull();
  });

  test("refuses a sibling directory whose name only starts with the base's", async () => {
    const { base } = await makeTree();
    expect(resolveStaticPath(base, "/../public-secrets/keys.txt")).toBeNull();
  });

  test("refuses a symlink that leads out of the tree, and keeps one that stays inside", async () => {
    const { root, base } = await makeTree();
    await symlink(path.join(root, "secret.txt"), path.join(base, "escape.txt"));
    await symlink(path.join(base, "img", "logo.png"), path.join(base, "inside.png"));

    // `path.resolve` collapses `..` in a string; it never follows a link, so this is the one case the string
    // check cannot see.
    expect(resolveStaticPath(base, "/escape.txt")).toBeNull();
    expect(resolveStaticPath(base, "/inside.png")).toBe(path.join(base, "inside.png"));
  });

  test("the base directory itself resolves to the base", async () => {
    const { base } = await makeTree();
    expect(resolveStaticPath(base, "/")).toBe(base);
    expect(resolveStaticPath(base, "")).toBe(base);
  });
});
