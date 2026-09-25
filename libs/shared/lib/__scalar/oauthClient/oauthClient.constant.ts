import { enumOf } from "akanjs/base";
import { via } from "akanjs/constant";

export class OauthClientSource extends enumOf("oauthClientSource", [
  "static",
  "dynamic",
  "metadataDocument",
] as const) {}

export class OauthClientAuthMethod extends enumOf("oauthClientAuthMethod", [
  "none",
  "client_secret_post",
  "client_secret_basic",
] as const) {}

export class OauthClient extends via((field) => ({
  clientId: field(String),
  clientName: field(String, { default: "" }),
  redirectUris: field([String]),
  grantTypes: field([String], { default: ["authorization_code"] }),
  tokenEndpointAuthMethod: field(OauthClientAuthMethod, { default: "none" }),
  clientSecretHash: field(String, { default: "" }), // sha256 of the secret; the secret itself is shown once at registration
  source: field(OauthClientSource, { default: "dynamic" }),
})) {}
