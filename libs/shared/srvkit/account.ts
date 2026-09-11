import { type Environment, getEnv } from "akanjs/base";

/**
 * What an access token the OAuth authorization server minted carries on top of a browser session's claims. A
 * browser session has none of them, which is what makes `client_id`/`aud` the marker `isAgentToken` reads.
 */
export interface OAuthTokenClaims {
  iss?: string;
  aud?: string | string[];
  client_id?: string;
  sub?: string;
}

export type SerAccount<AddData = unknown> = {
  appName: string;
  environment: Environment;
} & OAuthTokenClaims &
  AddData;
export const getDefaultAccount = (): SerAccount => {
  const env = getEnv();
  return { appName: env.appName, environment: env.environment };
};

export type AuthTokenMeta = { exp?: number; iat?: number; jti?: string; sid?: string; tokenType?: string };
