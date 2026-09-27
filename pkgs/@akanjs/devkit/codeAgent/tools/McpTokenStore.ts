import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { akanCodePaths } from "../agent/akanCodePaths";

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

// Home directory only, mode 0600: `.akan/code/mcp.json` is shared with the editors and routinely committed.
export class McpTokenStore {
  static file() {
    return akanCodePaths.mcpAuthFile();
  }

  static lockFile() {
    return `${McpTokenStore.file()}.lock`;
  }

  static read(name: string): McpStoredAuth | undefined {
    return McpTokenStore.#all()[name];
  }

  static names() {
    return Object.keys(McpTokenStore.#all());
  }

  /** Re-reads right before writing, or two concurrent sign-ins each drop the other's token. */
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
