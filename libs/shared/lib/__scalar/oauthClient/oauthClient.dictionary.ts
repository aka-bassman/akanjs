import { scalarDictionary } from "akanjs/dictionary";

import type { OauthClient, OauthClientAuthMethod, OauthClientSource } from "./oauthClient.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) =>
    t(["OAuth Client", "OAuth 클라이언트"]).desc([
      "An application registered to obtain tokens",
      "토큰을 발급받도록 등록된 애플리케이션",
    ]),
  )
  .model<OauthClient>((t) => ({
    clientId: t(["Client ID", "클라이언트 ID"]).desc([
      "Identifier the client presents",
      "클라이언트가 제시하는 식별자",
    ]),
    clientName: t(["Client Name", "클라이언트 이름"]).desc([
      "Name shown on the consent page",
      "동의 화면에 표시되는 이름",
    ]),
    redirectUris: t(["Redirect URIs", "리다이렉트 URI"]).desc([
      "Where an authorization code may be sent",
      "인가 코드를 보낼 수 있는 주소",
    ]),
    grantTypes: t(["Grant Types", "그랜트 종류"]).desc(["Grants the client may use", "클라이언트가 쓸 수 있는 그랜트"]),
    tokenEndpointAuthMethod: t(["Token Endpoint Auth", "토큰 엔드포인트 인증"]).desc([
      "How the client authenticates at the token endpoint",
      "토큰 엔드포인트에서 클라이언트가 인증하는 방식",
    ]),
    clientSecretHash: t(["Client Secret Hash", "클라이언트 시크릿 해시"]).desc([
      "Hash of the client secret",
      "클라이언트 시크릿의 해시",
    ]),
    source: t(["Source", "출처"]).desc(["How the client was registered", "클라이언트가 등록된 경로"]),
  }))
  .enum<OauthClientSource>("oauthClientSource", (t) => ({
    static: t(["Static", "정적"]).desc(["Declared in the app's configuration", "앱 설정에 선언됨"]),
    dynamic: t(["Dynamic", "동적"]).desc(["Registered over RFC 7591", "RFC 7591 로 등록됨"]),
    metadataDocument: t(["Metadata Document", "메타데이터 문서"]).desc([
      "Read from the client's own HTTPS metadata document",
      "클라이언트의 HTTPS 메타데이터 문서에서 읽음",
    ]),
  }))
  .enum<OauthClientAuthMethod>("oauthClientAuthMethod", (t) => ({
    none: t(["None", "없음"]).desc(["Public client with no secret", "시크릿 없는 공개 클라이언트"]),
    client_secret_post: t(["Secret In Body", "본문 시크릿"]).desc([
      "Secret sent in the request body",
      "요청 본문으로 시크릿 전송",
    ]),
    client_secret_basic: t(["Secret In Basic Header", "Basic 헤더 시크릿"]).desc([
      "Secret sent in an HTTP Basic header",
      "HTTP Basic 헤더로 시크릿 전송",
    ]),
  }));
