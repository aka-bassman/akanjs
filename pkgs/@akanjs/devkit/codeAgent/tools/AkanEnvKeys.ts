import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ModelRuntime } from "@earendil-works/pi-coding-agent";

/**
 * Loads provider keys from the workspace's `.env` into the session, without persisting them anywhere.
 *
 * Bun auto-loads `.env` from the **current directory**, so `akan code` run from a subdirectory — or embedded in
 * a process started elsewhere — sees none of the workspace's keys and fails with "No API key found" for a key
 * that is plainly there. They are applied as runtime overrides rather than stored credentials: the key belongs
 * to the repo's env file, and copying it into `~/.akan/code/auth.json` would give it a second lifetime nobody
 * asked for.
 */
export class AkanEnvKeys {
  static async apply(runtime: ModelRuntime, workspaceRoot: string) {
    const applied: string[] = [];
    for (const [name, value] of AkanEnvKeys.#entries(workspaceRoot)) {
      const provider = AkanEnvKeys.#providerOf(name);
      if (!provider || !value) continue;
      // Serially, not through `Promise.all`: the runtime queues credential operations against the same file,
      // and a key written while another is mid-write is the one that goes missing.
      await runtime.setRuntimeApiKey(provider, value);
      applied.push(provider);
    }
    return applied;
  }

  static #entries(workspaceRoot: string): [string, string][] {
    const fromProcess = Object.entries(process.env).filter(([, value]) => typeof value === "string") as [
      string,
      string,
    ][];
    const file = path.join(workspaceRoot, ".env");
    if (!existsSync(file)) return fromProcess;
    const fromFile = readFileSync(file, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line): [string, string] => {
        const index = line.indexOf("=");
        return [
          line.slice(0, index).trim(),
          line
            .slice(index + 1)
            .trim()
            .replace(/^["']|["']$/g, ""),
        ];
      });
    // The real environment wins: an operator exporting a key for one run should not be overridden by the file.
    return [...fromFile, ...fromProcess];
  }

  /** `DEEPSEEK_API_KEY` names the provider `deepseek`; the engine's provider ids are lower-kebab. */
  static #providerOf(name: string) {
    const match = /^([A-Z0-9_]+)_API_KEY$/.exec(name);
    return match?.[1]?.toLowerCase().replace(/_/g, "-");
  }
}
