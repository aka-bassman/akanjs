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

  test("serves a lib asset through the link akan sync makes out of the tree", async () => {
    // `akan sync` links `public/libs/<lib>` at `<workspaceRoot>/libs/<lib>/public`, so every lib asset is
    // reached through a link whose target is outside the app's public dir. Resolving the link and refusing it
    // 404s all of them under `akan start`; a built app has no link left, because the copy dereferences.
    const { root, base } = await makeTree();
    fs.mkdirSync(path.join(root, "libs", "kaiden", "public"), { recursive: true });
    await writeFile(path.join(root, "libs", "kaiden", "public", "model.glb"), "glb");
    fs.mkdirSync(path.join(base, "libs"), { recursive: true });
    await symlink(
      path.relative(path.join(base, "libs"), path.join(root, "libs", "kaiden", "public")),
      path.join(base, "libs", "kaiden"),
      "dir",
    );

    const resolved = resolveStaticPath(base, "/libs/kaiden/model.glb");
    expect(resolved).toBe(path.join(base, "libs", "kaiden", "model.glb"));
    expect(fs.readFileSync(resolved as string, "utf8")).toBe("glb");
  });

  test("the base directory itself resolves to the base", async () => {
    const { base } = await makeTree();
    expect(resolveStaticPath(base, "/")).toBe(base);
    expect(resolveStaticPath(base, "")).toBe(base);
  });
});
