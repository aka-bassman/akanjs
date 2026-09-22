# service.dictionary.ts

- Source: /conventions/service/dictionary
- Mirror: /llms/pages/conventions/service/dictionary.md
- Section: conventions
- Category: Service
- Priority: P1

## Headings

- service.dictionary.ts (#service-dictionary)
- Naming The Endpoints (#endpoint-labels)
- Naming Every Argument (#endpoint-args)
- Errors And Phrases (#errors-and-phrases)
- Reading A Key Back (#reading-keys)

## Content

service.dictionary.ts

One entry per endpoint the signal declares, typed against the class. A label, a .desc() an agent reads to choose the tool, and a .arg() naming every argument.

Every key thrown as new Err("<service>.error.<key>") from the service. Korean ends in 다.

Phrases that are neither an endpoint nor an error: button text, a consent-page paragraph, a status word. Read with the bare key under the module name.

A model dictionary starts by naming fields, because a model has fields. A service module has none — so the dictionary starts one stage later, at the endpoints, and the difference shows up in the first line of the file: serviceDictionary, not modelDictionary.

Three stages, and every one of them is optional. Each returns the same builder, so the order is free — but the house order is endpoint, then error, then translate, which is the order a reader looks for them in.

Stage

Naming The Endpoints

The keys are typed against the endpoint class, so a renamed endpoint breaks the dictionary at compile time rather than at the first render. Pass the class as the type argument and import it as a type: a dictionary is a shared contract file and must not pull the signal's runtime graph in behind it.

That is the whole file for a module with one endpoint. Two things in it are not optional: the .desc() beside the label, and the error key that localFile.service.ts throws by name.

Naming Every Argument

Name every argument, including the ones the framework supplies. An unnamed argument reaches the API explorer, the generated admin form, the validation message and the MCP input schema as its identifier, and an agent filling that schema has nothing to go on but the spelling.

Read the argument description again: it does not say what a session id is, it says where the caller gets one. That sentence is worth more to an agent than the type is, and it is the difference between a tool a model can use and one it guesses at.

Errors And Phrases

An error key is not documentation. It is the other half of a throw: the service writes new Err("oauth.error.notSignedIn"), and this file is the only place that key becomes a sentence somebody can read. A key thrown and never registered reaches the user as the key.

Two register conventions are visible there and both are deliberate. Korean error text ends in 다 — it is a statement of what went wrong, not an apology to the user. Korean phrase text ends in 다. only when it is also a statement; consentScope addresses the person and ends in 습니다.

A brace pair is a slot the caller fills, as in Connected {at}. Nothing validates that the caller passes it, so keep the name obvious.

Reading A Key Back

Every key lands under the module's own name, and the stage decides how deep. An endpoint label gets a signal segment because the endpoint namespace has to stay clear of the phrases; an error gets an error segment; a translate key gets neither.

usePage() resolves these on the server as well as the client, so a label in a server component costs no boundary. Reach for l.trans({ en, ko }) instead when the phrase is used once and belongs to the screen rather than to the module — a dictionary key that only one component reads is a key somebody has to keep in sync for nothing.

## Code Examples

### libs/util/lib/_localFile/localFile.dictionary.ts

```ts
import { serviceDictionary } from "akanjs/dictionary";

import type { LocalFileEndpoint } from "./localFile.signal";

export const dictionary = serviceDictionary(["en", "ko"])
  .endpoint<LocalFileEndpoint>((fn) => ({
    getBlob: fn(["Get Blob", "Blob 가져오기"]).desc([
      "Get blob data from local file",
      "로컬 파일에서 Blob 데이터 가져오기",
    ]),
  }))
  .error({
    privateFilesNotServed: [
      "Private files are not served through localFile",
      "비공개 파일은 localFile을 통해 제공되지 않습니다",
    ],
  });
```

### libs/shared/lib/_oauth/oauth.dictionary.ts

```ts
revokeOAuthConnection: fn(["Disconnect App", "앱 연결 끊기"])
      .desc([
        "Closes one application's grant; its tokens stop working at once",
        "애플리케이션 하나의 권한을 닫는다. 그 토큰은 즉시 동작을 멈춘다",
      ])
      .arg((t) => ({
        sessionId: t(["Session ID", "세션 ID"]).desc([
          "The grant to close, from the connected-apps list",
          "닫을 그랜트(연결된 앱 목록의 세션 ID)",
        ]),
      })),
```

### libs/shared/lib/_oauth/oauth.dictionary.ts

```ts
.error({
    requestNotFound: [
      "The authorization request is unknown, expired or already decided",
      "인가 요청이 없거나 만료되었거나 이미 처리되었다.",
    ],
    requestBoundToAnotherAccount: [
      "This authorization request was started by another account",
      "이 인가 요청은 다른 계정이 시작했다.",
    ],
    notSignedIn: ["Sign in to continue", "계속하려면 로그인해야 한다."],
    disabled: ["OAuth is disabled on this server", "이 서버에서 OAuth 가 꺼져 있다."],
  })
  .translate({
    consentTitle: ["Authorize access", "접근 허용"],
    consentScope: [
      "It will be able to do everything your account can do until you sign it out.",
      "로그아웃시키기 전까지 내 계정이 할 수 있는 모든 일을 할 수 있습니다.",
    ],
    disconnect: ["Disconnect", "연결 끊기"],
    connectedAt: ["Connected {at}", "{at} 연결"],
  });
```

### libs/shared/page/oauth/consent/_index.tsx

```ts
const { l } = usePage();

l("oauth.signal.approveOAuthConsent");  // endpoint label
l("oauth.error.notSignedIn");           // error key
l("oauth.consentTitle");                // translate key
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

