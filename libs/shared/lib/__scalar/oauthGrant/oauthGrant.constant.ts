import { via } from "akanjs/constant";

import { OauthSubjectType } from "../oauthRequest/oauthRequest.constant";

export class OauthGrant extends via((field) => ({
  codeHash: field(String), // sha256 of the code; the code itself travels once, in the redirect
  requestId: field(String),
  clientId: field(String),
  redirectUri: field(String),
  codeChallenge: field(String),
  resource: field(String),
  subjectType: field(OauthSubjectType),
  subjectId: field(String),
  userAgent: field(String, { default: "" }),
  expiresAt: field(Date),
})) {}
