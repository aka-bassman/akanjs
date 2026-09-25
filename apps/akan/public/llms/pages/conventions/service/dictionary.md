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

The name a person reads, one entry per language: `fn(["Disconnect App", "앱 연결 끊기"])`.

A longer sentence beside a label. An AI agent picks a tool by reading it.

The dotted path code reads a text by, such as `oauth.consentTitle`.

language tuple

One string per language, in the order `serviceDictionary(["en", "ko"])` lists them.

One entry per signal endpoint: a label, a `.desc()`, and an `.arg()` for every argument.

Every key the service throws as `new Err("<service>.error.<key>")`. Korean ends in `다.`

Every other phrase, neither an endpoint nor an error. It is read by the bare key under the module.

API explorer

Endpoint

The API explorer heading, the OpenAPI `summary` and the MCP tool `title`.

The description an agent picks a tool by. The API explorer shows it under the label.

Argument, in .arg()

Shown beside the identifier in the API explorer, and nowhere else.

The argument's description in the MCP input schema and on OpenAPI path and query parameters.

Korean ends in `다.`: a statement of what went wrong, not an apology.

Plain `다.` only for a bare statement; a line addressed to the user ends in `습니다` (`consentScope`).

English in Title Case, Korean as the plain domain term.

The endpoint label from `.endpoint()`. Read it with `l()`.

Its `.desc()`. Read it with `l()`, adding `.desc` to the label's key.

An argument label from `.arg()`. Read it with `l()`.

An error from `.error()`. `new Err()` throws it on the server; `msg.error()` shows it on the client.

A phrase from `.translate()`. Read it with `l()`.

Instead of

Write

`import type`. A value import pulls the signal's runtime graph into the dictionary.

An endpoint label with no `.desc()`

Write one. An agent picks a tool by its description.

An argument description that repeats the name: "The session ID"

Say where the caller gets the value: "from the connected-apps list".

A `.translate()` key only one component reads

`l.trans({ en, ko })` inside that component.

The full stage chain a database module writes.

The endpoints and arguments this file labels.

Where the `Err` keys are thrown.

Actions whose failures become error toasts.

Words used on this page

Term

Three stages

Stage

What it holds

Naming The Endpoints

Who reads which text

People read the label; a model reads the description. Each piece shows up in these places:

Text

Shown there

Not used

Naming Every Argument

Errors And Phrases

Tone of voice

The ending follows who the sentence speaks to. Both conventions in the file above are deliberate:

How it is written

Reading A Key Back

Where it comes from and how to read it

The OAuth consent page reads its phrases this way, on the server. Markup is trimmed here:

Common mistakes

Read next

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
    disabled: [
      "OAuth is disabled on this server",
      "이 서버에서 OAuth 가 꺼져 있다.",
    ],
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

```tsx
import { fetch, usePage } from "@libs/shared/client";
import { page } from "akanjs/client";

export default page()
  .search("request", String, { desc: "The request of this screen." })
  .render(async ({ request: requestId }) => {
    const { l } = usePage();
    const request = requestId
      ? await fetch.viewOAuthAuthorizationRequest(requestId).catch(() => null)
      : null;
    return (
      <main>
        <h1>{l("oauth.consentTitle")}</h1>
        {request ? (
          <p>{l("oauth.consentScope")}</p>
        ) : (
          <p>{l("oauth.consentUnavailable")}</p>
        )}
      </main>
    );
  });
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

