export type OAuthClientAuthMethod = "none" | "client_secret_post" | "client_secret_basic";

/** How a client came to be known: declared in the app's option, registered over RFC 7591, or read off its `client_id` URL. */
export type OAuthClientSource = "static" | "dynamic" | "metadataDocument";

export interface OAuthClientRecord {
  clientId: string;
  clientName?: string;
  redirectUris: string[];
  grantTypes: string[];
  tokenEndpointAuthMethod: OAuthClientAuthMethod;
  clientSecretHash?: string;
  source: OAuthClientSource;
}

/** The metadata a registration request carries, before the server assigns an identifier to it. */
export type OAuthClientMetadata = Pick<
  OAuthClientRecord,
  "clientName" | "redirectUris" | "grantTypes" | "tokenEndpointAuthMethod"
>;

export interface OAuthRedirectPolicy {
  /** Private-use URI schemes accepted as redirect targets besides HTTPS and loopback HTTP, e.g. `cursor`. */
  allowedSchemes?: string[];
}

export interface OAuthAuthorizeParams {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state?: string;
  resource: string;
  scope?: string;
}

export interface OAuthClientCredential {
  clientId?: string;
  clientSecret?: string;
  /** Which channel carried the credential, which decides the `WWW-Authenticate` an `invalid_client` answer needs. */
  method: "basic" | "body" | "none";
}

export type OAuthTokenParams =
  | {
      grantType: "authorization_code";
      code: string;
      codeVerifier?: string;
      redirectUri?: string;
      resource?: string;
      client: OAuthClientCredential;
    }
  | {
      grantType: "refresh_token";
      refreshToken: string;
      resource?: string;
      scope?: string;
      client: OAuthClientCredential;
    };

export type OAuthTokenErrorCode =
  | "invalid_request"
  | "invalid_client"
  | "invalid_grant"
  | "unauthorized_client"
  | "unsupported_grant_type"
  | "invalid_scope"
  | "invalid_target";

export type OAuthAuthorizeErrorCode =
  | "invalid_request"
  | "unauthorized_client"
  | "access_denied"
  | "unsupported_response_type"
  | "invalid_scope"
  | "server_error"
  | "temporarily_unavailable"
  | "invalid_target";

export type OAuthRegistrationErrorCode = "invalid_redirect_uri" | "invalid_client_metadata";
