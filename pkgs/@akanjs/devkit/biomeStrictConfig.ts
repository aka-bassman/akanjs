import { rm } from "node:fs/promises";
import path from "node:path";
import { biomeBaseConfig, biomeDomainsConfig } from "./biomeBase";

/**
 * The editor and the batch runs want different `linter.domains`, and Biome has no per-invocation switch for them:
 * `--only` / `--skip` pick which rules run, not whether the type and module graphs are built, and `--only=<domain>`
 * additionally force-enables every rule of that domain, including the ones the shared config deliberately leaves
 * off. So the domains are a configuration difference, and this class is the batch half of it — a throwaway config
 * that re-applies `biome.domains.json` over the workspace's own, used by `akan lint` and the pre-commit hook.
 *
 * Two details fix its shape. It has to sit in the workspace root, because Biome resolves `plugins` paths from the
 * entry configuration's own directory — a config under `.husky/` loads none of the grit rules and reports only
 * "Cannot read file". And it has to name `biome.base.json` itself rather than lean on the workspace config's own
 * `extends`, because `extends` is one level deep: a config extending `./biome.json` inherits `biome.json`'s own
 * keys and nothing that `biome.json` in turn extends. Listing the base first keeps `overrides` in the order a
 * plain run has them, workspace entries after the framework's.
 */
export class BiomeStrictConfig {
  static readonly configFileNames = ["biome.json", "biome.jsonc"] as const;

  /** `biome.json` first, mirroring Biome's own precedence; `biome.jsonc` is the one that may carry comments. */
  static async resolveConfigName(workspaceRoot: string): Promise<string | null> {
    for (const fileName of BiomeStrictConfig.configFileNames) {
      if (await Bun.file(path.join(workspaceRoot, fileName)).exists()) return fileName;
    }
    return null;
  }

  readonly #filePath: string;
  readonly #workspaceRoot: string;

  constructor(workspaceRoot: string, { id = process.pid }: { id?: number | string } = {}) {
    this.#workspaceRoot = workspaceRoot;
    this.#filePath = path.join(workspaceRoot, `.biome.strict.${id}.json`);
  }

  get filePath() {
    return this.#filePath;
  }

  async write(): Promise<string | null> {
    const configName = await BiomeStrictConfig.resolveConfigName(this.#workspaceRoot);
    if (!configName) return null;
    const config = { extends: [biomeBaseConfig, `./${configName}`, biomeDomainsConfig] };
    await Bun.write(this.#filePath, `${JSON.stringify(config, null, 2)}\n`);
    return this.#filePath;
  }

  async remove() {
    await rm(this.#filePath, { force: true });
  }
}

if (import.meta.main) {
  const filePath = await new BiomeStrictConfig(process.cwd()).write();
  if (filePath) process.stdout.write(path.relative(process.cwd(), filePath));
}
