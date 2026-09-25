import { scalarDictionary } from "akanjs/dictionary";

import type { OauthConnection } from "./oauthConnection.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) =>
    t(["Connected App", "연결된 앱"]).desc([
      "An application holding a live grant to act as this account",
      "이 계정으로 동작할 수 있는 유효한 권한을 가진 애플리케이션",
    ]),
  )
  .model<OauthConnection>((t) => ({
    sessionId: t(["Session ID", "세션 ID"]).desc([
      "The grant to name when disconnecting",
      "연결을 끊을 때 지정하는 그랜트",
    ]),
    clientId: t(["Client ID", "클라이언트 ID"]).desc(["The application's identifier", "애플리케이션 식별자"]),
    clientName: t(["Application", "애플리케이션"]).desc([
      "The name the application registered under",
      "애플리케이션이 등록한 이름",
    ]),
    userAgent: t(["Browser", "브라우저"]).desc(["The browser that approved the connection", "연결을 승인한 브라우저"]),
    createdAt: t(["Connected At", "연결 시각"]).desc(["When the connection was approved", "연결이 승인된 시각"]),
    expiresAt: t(["Expires At", "만료 시각"]).desc([
      "When the connection lapses unless the application refreshes it",
      "애플리케이션이 갱신하지 않으면 연결이 끝나는 시각",
    ]),
    isCurrent: t(["Current", "현재 연결"]).desc([
      "Whether this is the connection making the request",
      "이 요청을 보내고 있는 연결인지",
    ]),
  }));
