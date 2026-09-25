import { getEnv } from "akanjs/base";
import { decodeJwtPayload } from "./jwtDecode";

/** The pre-scoping key. Read as a fallback, never written; drop it once deployments have rotated past it. */
export const legacyAuthTokenKey = "jwt";

/**
 * Cookies carry no port (RFC 6265), so every app served from one host shares a jar — which on localhost is
 * every app in the workspace at once. Under a global `jwt` key each signin overwrites the neighbour's
 * session, and the JWT's own `appName` check only turns the stolen cookie into a failing credential.
 */
export const authTokenKey = (): string => `${legacyAuthTokenKey}:${getEnv().appName}`;

/** Matches both spellings so a signout can sweep a jar written before and after the key was scoped. */
export const isAuthTokenKey = (key: string): boolean =>
  key === legacyAuthTokenKey || key.startsWith(`${legacyAuthTokenKey}:`);

const authCookiePattern = new RegExp(`(?:^|;\\s*)${legacyAuthTokenKey}(?::[^=\\s;]+)?=`);

/** Whether a raw `cookie` header carries an auth token under either spelling. */
export const cookieHeaderHasAuthToken = (cookieHeader: string | null | undefined): boolean =>
  !!cookieHeader && authCookiePattern.test(cookieHeader);

/** Whether a token was minted for this app and environment — the same pair the server's account check makes. */
export const isOwnAuthToken = (jwt: string): boolean => {
  const { appName, environment } = getEnv();
  try {
    const account = decodeJwtPayload<{ appName?: string; environment?: string }>(jwt);
    return account.appName === appName && account.environment === environment;
  } catch {
    return false;
  }
};

/**
 * Reads the app-scoped token, falling back to a leftover global one only when its payload names this app —
 * a neighbour's token would decode fine here and fail every guard, so adopting it is worse than none.
 */
export const readAuthToken = (read: (key: string) => string | null | undefined): string | undefined => {
  const scoped = read(authTokenKey());
  if (scoped) return scoped;
  const legacy = read(legacyAuthTokenKey);
  return legacy && isOwnAuthToken(legacy) ? legacy : undefined;
};
