import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { akanCodePaths } from "../agent/akanCodePaths";

/** One server's credential, and the client registration it was issued against. */
export interface McpStoredAuth {
  /** The authorization server that minted it, so a server that moves issuer invalidates rather than misuses it. */
  issuer: string;
  /** Kept with the token so a refresh at connect costs no discovery round trip before the first tool call. */
  tokenEndpoint: string;
  /** RFC 8707: what the token was minted for, which a refresh has to restate. */
  resource: string;
  clientId: string;
  clientSecret?: string;
  /** Registered with the client, so a later sign-in binds the same loopback port or registers again. */
  redirectUri: string;
  accessToken: string;
  refreshToken?: string;
  /** Epoch ms. Absent when the server issued no lifetime, which the spec allows and means "until refused". */
  expiresAt?: number;
  scope?: string;
}

/**
 * The MCP bearer tokens, in the home directory and readable only by their owner.
 *
 * Never in the workspace: `.akan/code/mcp.json` is shared with the editors and routinely committed, and a
 * refresh token there is a credential in the repo. The file is written whole through a rename so a crash
 * mid-write cannot leave a truncated one, and a read that cannot parse it costs the sign-ins rather than the
 * session — a corrupt file re-authenticates, which is recoverable, where a thrown error is not.
 */
export class McpTokenStore {
  static file() {
    return akanCodePaths.mcpAuthFile();
  }

  static read(name: string): McpStoredAuth | undefined {
    return McpTokenStore.#all()[name];
  }

  static names() {
    return Object.keys(McpTokenStore.#all());
  }

  /**
   * Writes one entry, re-reading immediately before the write.
   *
   * Two sessions signing in to different servers at the same moment would otherwise each write the map they
   * read at the start of their own flow — minutes earlier, across a browser round trip — and the second would
   * drop the first's token.
   */
  static write(name: string, auth: McpStoredAuth) {
    McpTokenStore.#save({ ...McpTokenStore.#all(), [name]: auth });
  }

  static clear(name: string) {
    const all = McpTokenStore.#all();
    if (!(name in all)) return false;
    delete all[name];
    McpTokenStore.#save(all);
    return true;
  }

  /** Expired, or close enough that a call started now would land after it — see {@link skewMs}. */
  static isExpired(auth: McpStoredAuth) {
    return auth.expiresAt !== undefined && auth.expiresAt <= Date.now() + McpTokenStore.skewMs;
  }

  /** A token is treated as spent this long before it actually is, so a call never races its own expiry. */
  static readonly skewMs = 60_000;

  static #all(): Record<string, McpStoredAuth> {
    const file = McpTokenStore.file();
    if (!existsSync(file)) return {};
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8")) as { servers?: Record<string, McpStoredAuth> };
      return parsed.servers ?? {};
    } catch {
      return {};
    }
  }

  static #save(servers: Record<string, McpStoredAuth>) {
    const file = McpTokenStore.file();
    mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    const temp = `${file}.${process.pid}.tmp`;
    writeFileSync(temp, `${JSON.stringify({ servers }, null, 2)}\n`, { mode: 0o600 });
    renameSync(temp, file);
    // `rename` keeps the temp file's mode, but an existing target written by an older build may be looser.
    chmodSync(file, 0o600);
  }
}
