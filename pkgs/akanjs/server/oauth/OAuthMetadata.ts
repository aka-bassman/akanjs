export interface OAuthMetadataProps {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint?: string;
  revocationEndpoint?: string;
  scopesSupported?: string[];
  /** Whether a `client_id` that is an HTTPS URL is read as a metadata document. Advertised as true unless a deployment turned it off. */
  clientIdMetadataDocumentSupported?: boolean;
}

export class OAuthMetadata {
  static readonly wellKnownSuffix = "/.well-known/oauth-authorization-server";

  /**
   * The RFC 8414 document. Three fixed fields are load-bearing for MCP clients: `code_challenge_methods_supported`
   * (a client MUST refuse to proceed without it), `client_id_metadata_document_supported` (the registration path the
   * spec prefers), and `authorization_response_iss_parameter_supported` (which is what obliges the client to check
   * `iss` on the way back).
   */
  static document({
    issuer,
    authorizationEndpoint,
    tokenEndpoint,
    registrationEndpoint,
    revocationEndpoint,
    scopesSupported,
    clientIdMetadataDocumentSupported = true,
  }: OAuthMetadataProps) {
    return {
      issuer,
      authorization_endpoint: authorizationEndpoint,
      token_endpoint: tokenEndpoint,
      ...(registrationEndpoint ? { registration_endpoint: registrationEndpoint } : {}),
      ...(revocationEndpoint ? { revocation_endpoint: revocationEndpoint } : {}),
      response_types_supported: ["code"],
      response_modes_supported: ["query"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
      client_id_metadata_document_supported: clientIdMetadataDocumentSupported,
      authorization_response_iss_parameter_supported: true,
      ...(scopesSupported?.length ? { scopes_supported: scopesSupported } : {}),
    };
  }

  static response(props: OAuthMetadataProps) {
    return Response.json(OAuthMetadata.document(props), {
      // Public metadata a browser-hosted client reads cross-origin before it holds any credential.
      headers: { "cache-control": "public, max-age=3600", "access-control-allow-origin": "*" },
    });
  }

  /** RFC 8414 §3.1: the issuer's path, when it has one, is inserted after the well-known suffix. */
  static wellKnownPath(issuer: string): string {
    const { pathname } = new URL(issuer);
    return `${OAuthMetadata.wellKnownSuffix}${pathname === "/" ? "" : pathname.replace(/\/$/, "")}`;
  }
}
