import { describe, expect, test } from "bun:test";
import { OAuthMetadata } from "./OAuthMetadata";

const props = {
  issuer: "https://app.example.com",
  authorizationEndpoint: "https://app.example.com/oauth/authorize",
  tokenEndpoint: "https://app.example.com/oauth/token",
  registrationEndpoint: "https://app.example.com/oauth/register",
};

describe("OAuthMetadata", () => {
  test("publishes what an MCP client checks before it proceeds", () => {
    const doc = OAuthMetadata.document(props);
    expect(doc.issuer).toBe(props.issuer);
    expect(doc.code_challenge_methods_supported).toEqual(["S256"]);
    expect(doc.client_id_metadata_document_supported).toBe(true);
    expect(doc.authorization_response_iss_parameter_supported).toBe(true);
    expect(doc.registration_endpoint).toBe(props.registrationEndpoint);
    expect(doc.grant_types_supported).toEqual(["authorization_code", "refresh_token"]);
    expect("scopes_supported" in doc).toBe(false);
  });

  test("omits a registration endpoint a deployment turned off", () => {
    const { registrationEndpoint: _registrationEndpoint, ...noRegistration } = props;
    expect("registration_endpoint" in OAuthMetadata.document(noRegistration)).toBe(false);
  });

  test("advertises revocation and stops advertising metadata documents when a deployment turned them off", () => {
    const doc = OAuthMetadata.document({
      ...props,
      revocationEndpoint: "https://app.example.com/oauth/revoke",
      clientIdMetadataDocumentSupported: false,
    });
    expect(doc.revocation_endpoint).toBe("https://app.example.com/oauth/revoke");
    expect(doc.client_id_metadata_document_supported).toBe(false);
  });

  test("answers as a public, cacheable document", async () => {
    const res = OAuthMetadata.response(props);
    expect(res.headers.get("cache-control")).toContain("public");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(((await res.json()) as { token_endpoint: string }).token_endpoint).toBe(props.tokenEndpoint);
  });

  test("inserts an issuer's path after the well-known suffix, as RFC 8414 §3.1 says", () => {
    expect(OAuthMetadata.wellKnownPath("https://app.example.com")).toBe("/.well-known/oauth-authorization-server");
    expect(OAuthMetadata.wellKnownPath("https://app.example.com/")).toBe("/.well-known/oauth-authorization-server");
    expect(OAuthMetadata.wellKnownPath("https://auth.example.com/tenant1")).toBe(
      "/.well-known/oauth-authorization-server/tenant1",
    );
  });
});
