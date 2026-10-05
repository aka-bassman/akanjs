import type { OAuthTokenParams } from "akanjs/server";

import type * as cnst from "../lib/cnst";
import type { RefreshSession } from "./refreshSession";

export interface OauthSubject {
  type: cnst.OauthSubjectType["value"];
  id: string;
}
export type OauthCodeGrantParams = Extract<OAuthTokenParams, { grantType: "authorization_code" }>;
export type OauthRefreshParams = Extract<OAuthTokenParams, { grantType: "refresh_token" }>;
/** What a token names about its grant: enough to find the lineage and to check the client presenting it owns it. */
export type OauthLineage = Pick<RefreshSession, "id" | "subject" | "subjectId" | "clientId">;
