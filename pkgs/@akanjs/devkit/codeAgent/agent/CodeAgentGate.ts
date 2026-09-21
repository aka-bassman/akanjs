import path from "node:path";
import type { CodeAgentProfile } from "akanjs/common";

const writeTools = new Set(["write", "edit"]);
const commandTools = new Set(["bash"]);

export interface GateVerdict {
  /** `undefined` means the call may run without asking. */
  block?: string;
  approval?: string;
}

/**
 * Decides, per tool call, whether the profile lets it through, needs a human, or is refused outright.
 *
 * Paths are checked here rather than inside a replacement for the engine's file operations because a refusal
 * has to reach the model as a reason it can act on. An operations port that throws produces a stack trace the
 * model reads as a bug in the tool, and it retries.
 */
export class CodeAgentGate {
  readonly #profile: CodeAgentProfile;
  readonly #deny: Bun.Glob[];
  readonly #allow: Bun.Glob[];
  readonly #deniedFragments: string[];

  constructor(profile: CodeAgentProfile) {
    this.#profile = profile;
    this.#deny = (profile.paths.deny ?? []).map((pattern) => new Bun.Glob(pattern));
    this.#allow = (profile.paths.allow ?? []).map((pattern) => new Bun.Glob(pattern));
    this.#deniedFragments = [...new Set((profile.paths.deny ?? []).map(CodeAgentGate.#fragmentOf).filter(Boolean))];
  }

  verdict(toolName: string, args: unknown): GateVerdict {
    const target = CodeAgentGate.#pathOf(args);
    if (target) {
      const denied = this.#deniedReason(target);
      if (denied) return { block: denied };
    }
    const command = CodeAgentGate.#commandOf(args);
    if (command) {
      const denied = this.#deniedCommandReason(command);
      if (denied) return { block: denied };
    }
    if (!this.#needsApproval(toolName)) return {};
    return { approval: CodeAgentGate.#summarize(toolName, args) };
  }

  /**
   * A shell command naming a denied file is refused on the literal text.
   *
   * ⚠️ **This is a speed bump, not a boundary.** A shell can reach any path the process can — through a
   * variable, a glob, a subshell, `base64`, anything — and gating it properly would mean interpreting the
   * command. The real boundary is the container the `pod` profile runs in. What this does buy is that the
   * obvious accident, `cat .env`, does not put a live key into a transcript that is then persisted and
   * replayed on every later turn.
   */
  #deniedCommandReason(command: string) {
    const hit = this.#deniedFragments.find((fragment) => command.includes(fragment));
    if (!hit) return undefined;
    return `The command names "${hit}", which the profile's deny list covers. Ask the user for the value instead of reading the file.`;
  }

  #deniedReason(target: string) {
    const absolute = path.isAbsolute(target) ? target : path.resolve(this.#profile.paths.root, target);
    const relative = path.relative(this.#profile.paths.root, absolute);
    if (relative.startsWith("..") || path.isAbsolute(relative))
      return `Path is outside the agent root (${this.#profile.paths.root}).`;
    if (this.#deny.some((glob) => glob.match(absolute) || glob.match(relative)))
      return "Path is on the profile's deny list (secrets and environment files are never readable).";
    if (this.#allow.length && !this.#allow.some((glob) => glob.match(absolute) || glob.match(relative)))
      return "Path is outside the profile's allow list.";
    return undefined;
  }

  #needsApproval(toolName: string) {
    switch (this.#profile.approval) {
      case "never":
        return false;
      case "writes":
        return writeTools.has(toolName);
      case "commands":
        return commandTools.has(toolName);
      case "all":
        return true;
      default:
        return false;
    }
  }

  // A recursive secrets glob is only useful as the literal `secrets/`; a glob cannot be matched against a shell
  // line. A pattern with a wildcard left in the middle yields nothing matchable, so it is dropped rather than
  // guessed at.
  static #fragmentOf(pattern: string) {
    const trimmed = pattern
      .replace(/^\*\*\//, "")
      .replace(/\/\*\*$/, "/")
      .replace(/^\*+/, "");
    return trimmed.includes("*") ? "" : trimmed;
  }

  static #commandOf(args: unknown) {
    if (!args || typeof args !== "object") return undefined;
    const value = (args as { command?: unknown }).command;
    return typeof value === "string" && value ? value : undefined;
  }

  static #pathOf(args: unknown) {
    if (!args || typeof args !== "object") return undefined;
    const value = (args as { path?: unknown }).path;
    return typeof value === "string" && value ? value : undefined;
  }

  static #summarize(toolName: string, args: unknown) {
    const record = (args ?? {}) as Record<string, unknown>;
    if (toolName === "bash") return `run: ${String(record.command ?? "").slice(0, 200)}`;
    const target = CodeAgentGate.#pathOf(args);
    return target ? `${toolName} ${target}` : toolName;
  }
}
