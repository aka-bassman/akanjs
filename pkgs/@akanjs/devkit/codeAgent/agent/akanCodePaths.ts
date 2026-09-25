import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

/**
 * Where the shipped akan skills sit, which differs between the source tree and the bundle: the CLI's entry
 * chunks are flattened into the package root, so `skills/` is a sibling of the caller there and one level up
 * here, beside this folder. Same two-candidate shape the guidelines lookup uses.
 */
const builtinSkillsDir = () => {
  const candidates = [path.join(import.meta.dir, "skills"), path.join(import.meta.dir, "..", "skills")];
  return candidates.find((candidate) => existsSync(candidate));
};

/**
 * Where `akan code` keeps what belongs to the person rather than to the repo.
 *
 * `AKAN_CODE_HOME` moves the whole set. A container that mounts no home directory, a CI job that must not
 * write to one, and a second checkout that wants its own credentials all need the same thing, and moving the
 * files apart would let a `models.json` and the `auth.json` it names drift into different directories.
 */
const globalDir = () => process.env.AKAN_CODE_HOME ?? path.join(homedir(), ".akan", "code");

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
  mailDir: (workspaceRoot: string) => path.join(workspaceRoot, ".akan", "code", "mail"),
  builtinSkillsDir,
  mcpFile: (workspaceRoot: string) => path.join(workspaceRoot, ".akan", "code", "mcp.json"),
  /**
   * The MCP servers that belong to the person rather than to one checkout.
   *
   * A server is an integration with an account — the credential for it is already global, in `mcpAuth.json` —
   * so declaring it per repo means declaring it again in every repo and signing in again in each. The
   * workspace file stays, for a server that is genuinely this repo's, and wins on a name they share.
   */
  globalMcpFile: () => path.join(globalDir(), "mcp.json"),
  globalSkillsDir: () => path.join(globalDir(), "skills"),
  globalDir,
  authFile: () => path.join(globalDir(), "auth.json"),
  /** MCP bearer tokens, beside the provider keys and for the same reason: never in a directory that is shared. */
  mcpAuthFile: () => path.join(globalDir(), "mcpAuth.json"),
  modelsFile: () => path.join(globalDir(), "models.json"),
} as const;
