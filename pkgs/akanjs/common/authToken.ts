import { getEnv } from "akanjs/base";
import { decodeJwtPayload } from "./jwtDecode";

/** The pre-scoping key. Read as a fallback, never written; drop it once deployments have rotated past it. */
export const legacyAuthTokenKey = "jwt";

// Scoped per app: cookies carry no port (RFC 6265), so every app on one host shares a jar.
export const authTokenKey = (): string => `${legacyAuthTokenKey}:${getEnv().appName}`;

/** Matches both spellings so a signout can sweep a jar written before and after the key was scoped. */
export const isAuthTokenKey = (key: string): boolean =>
  key === legacyAuthTokenKey || key.startsWith(`${legacyAuthTokenKey}:`);

const authCookiePattern = new RegExp(`(?:^|;\\s*)${legacyAuthTokenKey}(?::[^=\\s;]+)?=`);

export const cookieHeaderHasAuthToken = (cookieHeader: string | null | undefined): boolean =>
  !!cookieHeader && authCookiePattern.test(cookieHeader);

export const isOwnAuthToken = (jwt: string): boolean => {
  const { appName, environment } = getEnv();
  try {
    const account = decodeJwtPayload<{ appName?: string; environment?: string }>(jwt);
    return account.appName === appName && account.environment === environment;
  } catch {
    return false;
  }
};

// A leftover global token is adopted only when it names this app: a neighbour's would fail every guard.
export const readAuthToken = (read: (key: string) => string | null | undefined): string | undefined => {
  const scoped = read(authTokenKey());
  if (scoped) return scoped;
  const legacy = read(legacyAuthTokenKey);
  return legacy && isOwnAuthToken(legacy) ? legacy : undefined;
};
