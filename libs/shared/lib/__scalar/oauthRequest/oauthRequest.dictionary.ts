import { scalarDictionary } from "akanjs/dictionary";

import type { OauthRequest, OauthRequestStatus, OauthSubjectType } from "./oauthRequest.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) =>
    t(["OAuth Request", "OAuth 인가 요청"]).desc([
      "A pending authorization awaiting the user's decision",
      "사용자의 결정을 기다리는 인가 요청",
    ]),
  )
  .model<OauthRequest>((t) => ({
    requestId: t(["Request ID", "요청 ID"]).desc(["Identifier of the pending request", "대기 중인 요청의 식별자"]),
    clientId: t(["Client ID", "클라이언트 ID"]).desc(["The requesting client", "요청한 클라이언트"]),
    clientName: t(["Client Name", "클라이언트 이름"]).desc(["Name shown to the user", "사용자에게 표시되는 이름"]),
    redirectUri: t(["Redirect URI", "리다이렉트 URI"]).desc(["Where the code will be sent", "코드를 보낼 주소"]),
    redirectHost: t(["Redirect Host", "리다이렉트 호스트"]).desc([
      "Host of the redirect URI, shown on consent",
      "동의 화면에 표시되는 리다이렉트 호스트",
    ]),
    isLoopbackRedirect: t(["Loopback Redirect", "루프백 리다이렉트"]).desc([
      "Whether the code returns to the user's own machine",
      "코드가 사용자의 컴퓨터로 돌아가는지",
    ]),
    codeChallenge: t(["Code Challenge", "코드 챌린지"]).desc([
      "PKCE challenge the code is bound to",
      "코드에 묶인 PKCE 챌린지",
    ]),
    state: t(["State", "상태값"]).desc(["Opaque value echoed back to the client", "클라이언트에 그대로 돌려주는 값"]),
    resource: t(["Resource", "리소스"]).desc([
      "The MCP endpoint the token will be for",
      "토큰이 향하는 MCP 엔드포인트",
    ]),
    scope: t(["Scope", "스코프"]).desc([
      "Scope the client asked for, recorded only",
      "클라이언트가 요청한 스코프(기록만)",
    ]),
    subjectType: t(["Subject Type", "주체 종류"]).desc([
      "Whether a user or an admin is authorizing",
      "사용자인지 관리자인지",
    ]),
    subjectId: t(["Subject ID", "주체 ID"]).desc(["The account bound to this request", "이 요청에 묶인 계정"]),
    status: t(["Status", "상태"]).desc(["Where the request is in its life", "요청의 진행 상태"]),
    createdAt: t(["Created At", "생성 시각"]).desc(["When the request was made", "요청이 만들어진 시각"]),
  }))
  .enum<OauthRequestStatus>("oauthRequestStatus", (t) => ({
    pending: t(["Pending", "대기"]).desc(["Awaiting the user's decision", "사용자 결정 대기"]),
    approved: t(["Approved", "승인"]).desc([
      "The user allowed it and a code was issued",
      "사용자가 허용해 코드가 발급됨",
    ]),
    denied: t(["Denied", "거부"]).desc(["The user refused it", "사용자가 거부함"]),
  }))
  .enum<OauthSubjectType>("oauthSubjectType", (t) => ({
    user: t(["User", "사용자"]).desc(["A signed-in user", "로그인한 사용자"]),
    admin: t(["Admin", "관리자"]).desc(["A signed-in admin", "로그인한 관리자"]),
  }));
