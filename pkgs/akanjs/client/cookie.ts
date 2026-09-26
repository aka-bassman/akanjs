import { getEnv } from "akanjs/base";
import {
  authTokenKey,
  decodeJwtPayload,
  isOwnAuthToken,
  Logger,
  legacyAuthTokenKey,
  readAuthToken,
} from "akanjs/common";
import type { Account } from "akanjs/fetch";
import { parseCookieHeader, cookies as serverCookies, headers as serverHeaders } from "akanjs/fetch";
import { loadCapacitorCore } from "./capacitor";
import { storage } from "./storage";
import { fetch } from "./useClient";

interface CookieOptions {
  path?: string;
  sameSite?: "strict" | "lax" | "none";
  secure?: boolean;
}

export const cookies = (): Map<string, { name: string; value: string }> => {
  if (getEnv().side === "server") return serverCookies();
  return parseCookieHeader(document.cookie);
};

export const setCookie = (
  key: string,
  value: string,
  options: CookieOptions = { path: "/", sameSite: "none", secure: true },
) => {
  const env = getEnv();
  if (env.side === "server") return;
  const encoded = `${key}=${value}`;
  const path = options.path ? `; path=${options.path}` : "";
  const sameSite = options.sameSite ? `; SameSite=${options.sameSite}` : "";
  const secure = options.secure ? "; Secure" : "";
  // biome-ignore lint/suspicious/noDocumentCookie: Akan auth helpers intentionally manage browser cookies.
  document.cookie = `${encoded}${path}${sameSite}${secure}`;
  if (env.renderMode !== "csr") return;
  void loadCapacitorCore()
    .then(({ CapacitorCookies }) => CapacitorCookies.setCookie({ key, value, path: options.path }))
    .catch(() => undefined);
};

/** Reads through `cookies()` on both sides: a hand-rolled `split("=")` cuts base64 padding and skips the `j:` form. */
export const getCookie = (key: string): string | undefined => cookies().get(key)?.value;

export const removeCookie = (key: string, options: { path: string } = { path: "/" }) => {
  // Nothing to do on the server: the response is what carries a Set-Cookie, and this helper has no hold on it.
  if (getEnv().side === "server") return;
  // biome-ignore lint/suspicious/noDocumentCookie: Akan auth helpers intentionally manage browser cookies.
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${options.path};`;
};
export const headers = (): Map<string, string> => {
  if (getEnv().side !== "server") return new Map();
  return serverHeaders();
};

export const getHeader = (key: string): string | undefined => {
  return headers().get(key);
};

export { authTokenKey };

/** The auth token this app holds in the cookie jar, under the app-scoped key or a legacy global one. */
export const getAuthToken = (): string | undefined => readAuthToken(getCookie);

/** The auth token this app holds in client storage — localStorage under SSR, Capacitor Preferences on CSR. */
export const getStoredAuthToken = async (): Promise<string | undefined> => {
  const scoped = await storage.getItem(authTokenKey());
  if (scoped) return scoped;
  const legacy = await storage.getItem(legacyAuthTokenKey);
  return legacy && isOwnAuthToken(legacy) ? legacy : undefined;
};

/** The current JWT's account when minted for this app and environment. Reads only the two credentials the server
 * honours — the app-scoped auth cookie and `Authorization: Bearer` — so the two never disagree on who is signed in. */
export const getAccount = <AddData = unknown>(): Account<AddData> => {
  const jwt = getAuthToken() ?? getHeader("authorization")?.replace(/^Bearer\s+/i, "");
  const defaultAccount = { appName: getEnv().appName, environment: getEnv().environment } as Account<AddData>;
  if (!jwt) return defaultAccount;
  const account = decodeJwtPayload<Account<AddData>>(jwt);
  if (account.appName !== getEnv().appName || account.environment !== getEnv().environment) return defaultAccount;
  return account;
};
export interface GetOption {
  unauthorize: string;
}
interface SetAuthOption {
  jwt: string;
}
/** Sets the active auth token on fetch, cookie storage, and client storage. */
export const setAuth = ({ jwt }: SetAuthOption) => {
  fetch.setJwt(jwt);
  setCookie(authTokenKey(), jwt);
  void storage.setItem(authTokenKey(), jwt);
  // The global key is shared by every app on this host; ours would keep feeding the migration fallback a stale token.
  removeCookie(legacyAuthTokenKey);
  void storage.removeItem(legacyAuthTokenKey);
};

interface InitAuthOption {
  jwt?: string;
}
export const initAuth = ({ jwt }: InitAuthOption = {}) => {
  const stored = getAuthToken();
  const token = jwt ?? stored;
  if (token && !isOwnAuthToken(token)) {
    // A neighbouring app's token decodes fine and fails every guard: adopting it would trade our credential for a 401.
    Logger.warn("JWT ignored: it was minted for another app or environment");
    if (token === stored) resetAuth();
    return;
  }
  if (token) setAuth({ jwt: token });
  // Whether, never which: a record at this level reaches the rotating log file and every live subscriber.
  Logger.verbose(`JWT ${token ? "restored from cookie" : "not found in cookie"}`);
};

export const resetAuth = () => {
  fetch.setJwt(null);
  removeCookie(authTokenKey());
  removeCookie(legacyAuthTokenKey);
  void storage.removeItem(authTokenKey());
  void storage.removeItem(legacyAuthTokenKey);
};
