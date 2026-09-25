import { describe, expect, test } from "bun:test";
import path from "node:path";
import type { PackageJson } from "@akanjs/devkit/types";

// Guards the published dependency closure of the code agent, which the monorepo cannot exercise on its own.
//
// `@earendil-works/pi-coding-agent` asks for `^0.80.6` of its three sibling packages and ships an
// `npm-shrinkwrap.json` pinning them to the exact version it was built against. Bun reads neither that file nor
// this workspace's `overrides` when somebody installs the published CLI, so `^0.80.6` resolved to the newest
// 0.80.x — 0.80.10, which dropped `getOAuthApiKey` from `pi-ai/oauth` while the pinned coding agent still
// imports it. A global install died on its first import:
//
//   Export named 'getOAuthApiKey' not found in module '.../@earendil-works/pi-ai/dist/oauth.js'.
//
// `PackageRunner` therefore re-declares pi's own pins as dependencies of what we publish; this keeps the two
// equal, so bumping the coding agent without moving the pins fails here rather than at a user's first run.

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
  // Top-level entries only: a key with a second `node_modules/` in it is a *nested placement* of some other
  // package's dependency, which a consumer's resolver reaches on its own and we have no business pinning.
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
