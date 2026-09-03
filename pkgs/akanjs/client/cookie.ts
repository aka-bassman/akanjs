import { getEnv } from "akanjs/base";
import { decodeJwtPayload, Logger } from "akanjs/common";
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

/**
 * Reads through `cookies()` on both sides, which is the only way the two agree: a hand-rolled
 * `split("=")[1]` truncates a value at its first `=` (base64 padding) and never decodes the `j:` form the
 * server branch does. Capacitor's own docs say to read `document.cookie`, and `cookies()` does.
 */
export const getCookie = (key: string): string | undefined => cookies().get(key)?.value;

export const removeCookie = (key: string, options: { path: string } = { path: "/" }) => {
  // Nothing to do on the server: the response is what carries a Set-Cookie, and this helper has no hold on it.
  // Deleting from `cookies()` mutated a Map built one line earlier and thrown away, which read as a removal.
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
/**
 * Decodes the current JWT into account data when it belongs to this app/environment.
 *
 * The two credentials read here are exactly the two the server honours — the `jwt` cookie and
 * `Authorization: Bearer` (`AccountMiddleware`). It used to fall back to a bare `jwt` *header*, which nothing
 * sends and no guard accepts, so a request carrying one read as signed in here and anonymous at the endpoint.
 */
export const getAccount = <AddData = unknown>(): Account<AddData> => {
  const jwt = getCookie("jwt") ?? getHeader("authorization")?.replace(/^Bearer\s+/i, "");
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
  setCookie("jwt", jwt);
  void storage.setItem("jwt", jwt);
};

interface InitAuthOption {
  jwt?: string;
}
export const initAuth = ({ jwt }: InitAuthOption = {}) => {
  const token = jwt ?? cookies().get("jwt")?.value;
  if (token) setAuth({ jwt: token });
  // Whether, never which: a record at this level reaches the rotating log file and every live subscriber.
  Logger.verbose(`JWT ${token ? "restored from cookie" : "not found in cookie"}`);
};

export const resetAuth = () => {
  fetch.setJwt(null);
  removeCookie("jwt");
  void storage.removeItem("jwt");
};
