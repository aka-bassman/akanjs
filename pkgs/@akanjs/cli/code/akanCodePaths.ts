import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

/**
 * Where the shipped akan skills sit, which differs between the source tree and the bundle: the CLI's entry
 * chunks are flattened into the package root, so `skills/` is a sibling of the caller there and one level up
 * here. Same two-candidate shape the guidelines lookup uses.
 */
const builtinSkillsDir = () => {
  const candidates = [path.join(import.meta.dir, "skills"), path.join(import.meta.dir, "..", "skills")];
  return candidates.find((candidate) => existsSync(candidate));
};

/**
 * Sessions live in the workspace — they are project history, and a second checkout of the same repo is a
 * different project. Credentials live in the home directory instead: a repo directory is the one place a key
 * must never be, because it is the place that gets committed, zipped and shared.
 */
export const akanCodePaths = {
  workspaceDir: (workspaceRoot: string) => path.join(workspaceRoot, ".akan", "code"),
  sessionsDir: (workspaceRoot: string) => path.join(workspaceRoot, ".akan", "code", "sessions"),
  extensionsDir: (workspaceRoot: string) => path.join(workspaceRoot, ".akan", "code", "extensions"),
  skillsDir: (workspaceRoot: string) => path.join(workspaceRoot, ".akan", "code", "skills"),
  builtinSkillsDir,
  mcpFile: (workspaceRoot: string) => path.join(workspaceRoot, ".akan", "code", "mcp.json"),
  globalDir: () => path.join(homedir(), ".akan", "code"),
  authFile: () => path.join(homedir(), ".akan", "code", "auth.json"),
  modelsFile: () => path.join(homedir(), ".akan", "code", "models.json"),
} as const;
