import { describe, expect, test } from "bun:test";
import path from "node:path";
import type { PackageJson } from "@akanjs/devkit/types";

//? A published install reads neither pi's npm-shrinkwrap.json nor our overrides, so PackageRunner re-declares pi's
//? sibling pins (a floating 0.80.x once broke every global install); this keeps them equal to the shrinkwrap.

const repoRoot = path.resolve(import.meta.dir, "../../..");
const piName = "@earendil-works/pi-coding-agent";
const piDir = `${repoRoot}/node_modules/${piName}`;
const publishedPackages = ["pkgs/@akanjs/devkit/package.json", "pkgs/@akanjs/cli/package.json"];

interface Shrinkwrap {
  packages: Record<string, { version?: string }>;
}

const readJson = async <T>(file: string) => (await Bun.file(file).json()) as T;

const shrinkwrappedPins = async () => {
  const { packages } = await readJson<Shrinkwrap>(`${piDir}/npm-shrinkwrap.json`);
  // Top-level entries only: a nested `node_modules/` key is another package's placement, not ours to pin.
  const entries = Object.entries(packages)
    .filter(([key]) => /^node_modules\/@earendil-works\/[^/]+$/.test(key))
    .map(([key, entry]) => [key.replace(/^node_modules\//, ""), entry.version ?? ""] as const);
  return Object.fromEntries(entries);
};

describe("pi dependency pins", () => {
  test("the shrinkwrap read here belongs to the coding agent we publish", async () => {
    const installed = await readJson<PackageJson>(`${piDir}/package.json`);
    for (const file of publishedPackages) {
      const { dependencies = {} } = await readJson<PackageJson>(`${repoRoot}/${file}`);
      expect({ file, [piName]: dependencies[piName] }).toEqual({ file, [piName]: installed.version });
    }
  });

  test("every sibling pi package is published at the version the coding agent shrinkwrapped", async () => {
    const pins = await shrinkwrappedPins();
    expect(Object.keys(pins).length).toBeGreaterThan(0);
    for (const file of publishedPackages) {
      const { dependencies = {} } = await readJson<PackageJson>(`${repoRoot}/${file}`);
      const declared = Object.fromEntries(Object.keys(pins).map((name) => [name, dependencies[name]]));
      expect({ file, ...declared }).toEqual({ file, ...pins });
    }
  });
});
