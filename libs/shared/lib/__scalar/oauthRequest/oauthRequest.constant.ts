import { dayjs, enumOf } from "akanjs/base";
import { via } from "akanjs/constant";

export class OauthRequestStatus extends enumOf("oauthRequestStatus", ["pending", "approved", "denied"] as const) {}

export class OauthSubjectType extends enumOf("oauthSubjectType", ["user", "admin"] as const) {}

export class OauthRequest extends via((field) => ({
  requestId: field(String),
  clientId: field(String),
  clientName: field(String, { default: "" }),
  redirectUri: field(String),
  redirectHost: field(String),
  isLoopbackRedirect: field(Boolean, { default: false }),
  codeChallenge: field(String),
  state: field(String, { default: "" }),
  resource: field(String),
  scope: field(String, { default: "" }),
  subjectType: field(OauthSubjectType, { default: "user" }),
  subjectId: field(String, { default: "" }), // empty until the first signed-in account opens the request
  status: field(OauthRequestStatus, { default: "pending" }),
  createdAt: field(Date, { default: () => dayjs() }),
})) {}
