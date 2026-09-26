import path from "node:path";
import type { CodeAgentProfile } from "akanjs/common";
import { stringArg } from "./stringArg";

const writeTools = new Set(["write", "edit"]);
const commandTools = new Set(["bash"]);

export interface GateVerdict {
  /** `undefined` means the call may run without asking. */
  block?: string;
  approval?: string;
}

// Gated here, not in the engine's file-ops port: a throw there reads to the model as a tool bug, and it retries.
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
    const target = stringArg(args, "path");
    if (target) {
      const denied = this.#deniedReason(target);
      if (denied) return { block: denied };
    }
    const command = stringArg(args, "command");
    if (command) {
      const denied = this.#deniedCommandReason(command);
      if (denied) return { block: denied };
    }
    if (!this.#needsApproval(toolName)) return {};
    return { approval: CodeAgentGate.#summarize(toolName, args) };
  }

  // A speed bump, not a boundary: a shell reaches any path; the real boundary is the `pod` profile's container.
  // It stops the obvious accident (`cat .env`) from persisting a live key into the transcript.
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

  // A glob cannot match a shell line, so a deny pattern is reduced to a literal; a mid-pattern wildcard is dropped.
  static #fragmentOf(pattern: string) {
    const trimmed = pattern
      .replace(/^\*\*\//, "")
      .replace(/\/\*\*$/, "/")
      .replace(/^\*+/, "");
    return trimmed.includes("*") ? "" : trimmed;
  }

  static #summarize(toolName: string, args: unknown) {
    const record = (args ?? {}) as Record<string, unknown>;
    if (toolName === "bash") return `run: ${String(record.command ?? "").slice(0, 200)}`;
    const target = stringArg(args, "path");
    return target ? `${toolName} ${target}` : toolName;
  }
}
