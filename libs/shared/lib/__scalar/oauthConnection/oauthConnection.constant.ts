import { via } from "akanjs/constant";

export class OauthConnection extends via((field) => ({
  sessionId: field(String), // the grant's lineage id; what a revocation names
  clientId: field(String),
  clientName: field(String, { default: "" }),
  userAgent: field(String, { default: "" }),
  createdAt: field(Date), // a session recorded before this was kept reports the start of its current refresh window
  expiresAt: field(Date),
  isCurrent: field(Boolean, { default: false }), // the grant the call reading this list was made with
})) {}
