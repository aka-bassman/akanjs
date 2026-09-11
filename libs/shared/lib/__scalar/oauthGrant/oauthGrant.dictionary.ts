import { scalarDictionary } from "akanjs/dictionary";

import type { OauthGrant } from "./oauthGrant.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) =>
    t(["OAuth Grant", "OAuth 그랜트"]).desc([
      "An issued authorization code awaiting exchange",
      "교환을 기다리는 발급된 인가 코드",
    ]),
  )
  .model<OauthGrant>((t) => ({
    codeHash: t(["Code Hash", "코드 해시"]).desc(["Hash of the authorization code", "인가 코드의 해시"]),
    requestId: t(["Request ID", "요청 ID"]).desc(["The request this code answered", "이 코드가 답한 요청"]),
    clientId: t(["Client ID", "클라이언트 ID"]).desc([
      "The client the code was issued to",
      "코드를 발급받은 클라이언트",
    ]),
    redirectUri: t(["Redirect URI", "리다이렉트 URI"]).desc([
      "The redirect URI the code was sent to",
      "코드를 보낸 리다이렉트 URI",
    ]),
    codeChallenge: t(["Code Challenge", "코드 챌린지"]).desc([
      "PKCE challenge the exchange must answer",
      "교환 때 맞춰야 하는 PKCE 챌린지",
    ]),
    resource: t(["Resource", "리소스"]).desc([
      "The MCP endpoint the token will be for",
      "토큰이 향하는 MCP 엔드포인트",
    ]),
    subjectType: t(["Subject Type", "주체 종류"]).desc([
      "Whether a user or an admin authorized",
      "사용자인지 관리자인지",
    ]),
    subjectId: t(["Subject ID", "주체 ID"]).desc(["The account that authorized", "인가한 계정"]),
    userAgent: t(["User Agent", "사용자 에이전트"]).desc([
      "Browser that approved, kept on the refresh session",
      "승인한 브라우저(refresh 세션에 기록)",
    ]),
    expiresAt: t(["Expires At", "만료 시각"]).desc([
      "When the code stops being exchangeable",
      "코드를 더 이상 교환할 수 없게 되는 시각",
    ]),
  }));
