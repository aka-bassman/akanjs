import { describe, expect, test } from "bun:test";
import path from "node:path";
import { getTargetCommandNames, getTargetMetas } from "@akanjs/devkit/commandDecorators";
import { CommandManifest } from "./commandManifest";
import { type CommandModuleId, commandModuleIds, commandModules } from "./commandModules";

const CLI_DIR = import.meta.dir;

/**
 * `akan start` holds its process for the whole dev session, so these guard the two properties that
 * keep it cheap: the entry resolves a command to exactly one module, and the bundled entry pulls no
 * heavy dependency eagerly. Both regress silently — a single barrel import is enough (measured: the
 * `commandDecorators` → root-barrel cycle alone cost 236MB).
 */
describe("CommandManifest", () => {
  test("covers every command name declared by every command module", async () => {
    const manifest = await CommandManifest.generate();
    for (const id of commandModuleIds) {
      const command = await commandModules[id]();
      for (const targetMeta of getTargetMetas(command)) {
        for (const name of getTargetCommandNames(targetMeta)) {
          expect(manifest.byCommand[name]).toBeDefined();
        }
      }
    }
    // Sanity-check the hot path specifically: `start`/`s` must resolve, and to the app module.
    expect(manifest.byCommand.start).toBe("application" satisfies CommandModuleId);
    expect(manifest.byCommand.s).toBe("application" satisfies CommandModuleId);
  });

  test("falls back to loading every module when it cannot narrow argv", async () => {
    const manifest = await CommandManifest.generate();
    // Global help and unknown commands must load everything so commander can render full help and
    // its did-you-mean suggestions.
    expect(CommandManifest.resolve(manifest, ["bun", "akan"])).toBeNull();
    expect(CommandManifest.resolve(manifest, ["bun", "akan", "--help"])).toBeNull();
    expect(CommandManifest.resolve(manifest, ["bun", "akan", "no-such-command"])).toBeNull();
    expect(CommandManifest.resolve(null, ["bun", "akan", "start"])).toBeNull();
    expect(CommandManifest.resolve(manifest, ["bun", "akan", "start"])).toEqual(["application"]);
  });
});

describe("cli entry module graph", () => {
  // Each of these is loaded by some command, and each costs 15-76MB resident on import. None may be
  // reachable from the entry without going through a dynamic import.
  const forbidden = [
    "typescript",
    "ink",
    "ssh2",
    "@trapezedev/project",
    "@langchain/core",
    "@langchain/openai",
    "@tailwindcss/node",
    "tailwindcss",
    "fonteditor-core",
    "subset-font",
    "@inquirer/prompts",
    "@kubernetes/client-node",
    "puppeteer",
  ];

  test("loads no heavy dependency eagerly", async () => {
    const packageJson = (await Bun.file(path.join(CLI_DIR, "package.json")).json()) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const result = await Bun.build({
      entrypoints: [path.join(CLI_DIR, "index.ts")],
      // Must match `build.ts`: with splitting off, Bun inlines dynamically imported modules into the
      // entry and hoists their external imports to the top, making every lazy import eager again.
      splitting: true,
      target: "bun",
      external: Object.keys({ ...packageJson.dependencies, ...packageJson.peerDependencies }).filter(
        (name) => name !== "@akanjs/devkit",
      ),
    });
    expect(result.success).toBe(true);

    const entry = result.outputs.find((output) => output.kind === "entry-point");
    if (!entry) throw new Error("cli build produced no entry-point output");
    const entryCode = await entry.text();
    const eager = forbidden.filter((dep) => new RegExp(`from\\s*"${dep.replace("/", "\\/")}"`).test(entryCode));
    expect(eager).toEqual([]);
  });
});
