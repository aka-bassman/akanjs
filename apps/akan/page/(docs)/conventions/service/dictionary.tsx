import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, type IntroItem } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const stages: IntroItem[] = [
    {
      name: ".endpoint<XEndpoint>((fn) => ({}))",
      desc: l.trans({
        en: "One entry per endpoint the signal declares, typed against the class. A label, a .desc() an agent reads to choose the tool, and a .arg() naming every argument.",
        ko: "signal이 선언한 endpoint마다 항목 하나이며, class를 기준으로 타입이 맞춰집니다. label, agent가 tool을 고를 때 읽는 .desc(), 모든 인자에 이름을 붙이는 .arg()로 이루어집니다.",
      }),
      example: 'l("oauth.signal.exchangeOAuthToken")',
    },
    {
      name: ".error({})",
      desc: l.trans({
        en: 'Every key thrown as new Err("<service>.error.<key>") from the service. Korean ends in 다.',
        ko: 'service에서 new Err("<service>.error.<key>")로 던지는 모든 key입니다. 한국어는 다.로 끝냅니다.',
      }),
      example: 'throw new Err("localFile.error.privateFilesNotServed")',
    },
    {
      name: ".translate({})",
      desc: l.trans({
        en: "Phrases that are neither an endpoint nor an error: button text, a consent-page paragraph, a status word. Read with the bare key under the module name.",
        ko: "endpoint도 error도 아닌 문구입니다. 버튼 문구, 동의 화면의 한 문단, 상태를 나타내는 단어 같은 것입니다. module 이름 아래 key만으로 읽습니다.",
      }),
      example: 'l("oauth.consentTitle")',
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="service-dictionary" title="service.dictionary.ts">
        <Docs.Title>service.dictionary.ts</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A model dictionary starts by naming fields, because a model has fields. A service module has none — so the dictionary starts one stage later, at the endpoints, and the difference shows up in the first line of the file: serviceDictionary, not modelDictionary.",
              ko: "model dictionary는 field에 이름을 붙이는 것으로 시작합니다. model에는 field가 있기 때문입니다. service module에는 없습니다. 그래서 dictionary는 한 단계 뒤인 endpoint에서 시작하고, 그 차이가 파일 첫 줄에 드러납니다. modelDictionary가 아니라 serviceDictionary입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Three stages, and every one of them is optional. Each returns the same builder, so the order is free — but the house order is endpoint, then error, then translate, which is the order a reader looks for them in.",
              ko: "단계는 세 개이고 전부 선택입니다. 각 단계가 같은 builder를 돌려주므로 순서는 자유입니다. 다만 하우스 순서는 endpoint, error, translate이며, 읽는 사람이 찾는 순서이기도 합니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Stage", ko: "단계" })} items={stages} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="endpoint-labels" title={l.trans({ en: "Naming The Endpoints", ko: "Endpoint에 이름 붙이기" })}>
        <Docs.Title>{l.trans({ en: "Naming The Endpoints", ko: "Endpoint에 이름 붙이기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The keys are typed against the endpoint class, so a renamed endpoint breaks the dictionary at compile time rather than at the first render. Pass the class as the type argument and import it as a type: a dictionary is a shared contract file and must not pull the signal's runtime graph in behind it.",
              ko: "key는 endpoint class를 기준으로 타입이 맞춰지므로, endpoint 이름을 바꾸면 첫 렌더가 아니라 컴파일 시점에 dictionary가 깨집니다. class를 type argument로 넘기되 import는 type import로 합니다. dictionary는 공유 계약 파일이라 signal의 runtime 그래프를 끌고 들어오면 안 됩니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/util/lib/_localFile/localFile.dictionary.ts"
            code={`import { serviceDictionary } from "akanjs/dictionary";

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
  });`}
          />
          <div>
            {l.trans({
              en: "That is the whole file for a module with one endpoint. Two things in it are not optional: the .desc() beside the label, and the error key that localFile.service.ts throws by name.",
              ko: "endpoint가 하나인 module의 파일 전부입니다. 그중 둘은 선택이 아닙니다. label 옆의 .desc(), 그리고 localFile.service.ts가 이름으로 던지는 error key입니다.",
            })}
          </div>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  A published endpoint with no <code>.desc()</code> is named in the boot log, because an agent picks a
                  tool by reading its description and a bare label tells it nothing. The label is what a person sees in
                  the API explorer; the description is what a model sees in the MCP catalogue. Write both, in English.
                </span>
              ),
              ko: (
                <span>
                  <code>.desc()</code>가 없는 게시된 endpoint는 부팅 로그에 이름이 남습니다. agent는 설명을 읽고 tool을
                  고르는데, label만으로는 아무것도 알 수 없기 때문입니다. label은 사람이 API explorer에서 보는 것이고,
                  설명은 모델이 MCP 카탈로그에서 보는 것입니다. 둘 다, 영어로 적습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="endpoint-args" title={l.trans({ en: "Naming Every Argument", ko: "모든 인자에 이름 붙이기" })}>
        <Docs.Title>{l.trans({ en: "Naming Every Argument", ko: "모든 인자에 이름 붙이기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Name every argument, including the ones the framework supplies. An unnamed argument reaches the API explorer, the generated admin form, the validation message and the MCP input schema as its identifier, and an agent filling that schema has nothing to go on but the spelling.",
              ko: "framework가 넣어주는 것까지 포함해서 모든 인자에 이름을 붙입니다. 이름이 없는 인자는 API explorer, 생성된 관리자 폼, 검증 메시지, MCP input schema에 식별자 그대로 나타나고, 그 schema를 채우는 agent에게는 철자 말고 참고할 것이 없습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/_oauth/oauth.dictionary.ts"
            code={`    revokeOAuthConnection: fn(["Disconnect App", "앱 연결 끊기"])
      .desc([
        "Closes one application's grant; its tokens stop working at once",
        "애플리케이션 하나의 권한을 닫는다. 그 토큰은 즉시 동작을 멈춘다",
      ])
      .arg((t) => ({
        sessionId: t(["Session ID", "세션 ID"]).desc([
          "The grant to close, from the connected-apps list",
          "닫을 그랜트(연결된 앱 목록의 세션 ID)",
        ]),
      })),`}
          />
          <div>
            {l.trans({
              en: "Read the argument description again: it does not say what a session id is, it says where the caller gets one. That sentence is worth more to an agent than the type is, and it is the difference between a tool a model can use and one it guesses at.",
              ko: "인자 설명을 다시 읽어 보세요. session id가 무엇인지가 아니라 호출자가 그것을 어디서 얻는지를 말합니다. 그 문장은 agent에게 type보다 값어치가 있고, 모델이 쓸 수 있는 tool과 찍어 맞히는 tool을 가릅니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="errors-and-phrases" title={l.trans({ en: "Errors And Phrases", ko: "에러와 문구" })}>
        <Docs.Title>{l.trans({ en: "Errors And Phrases", ko: "에러와 문구" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: 'An error key is not documentation. It is the other half of a throw: the service writes new Err("oauth.error.notSignedIn"), and this file is the only place that key becomes a sentence somebody can read. A key thrown and never registered reaches the user as the key.',
              ko: '에러 key는 문서가 아닙니다. throw의 나머지 절반입니다. service가 new Err("oauth.error.notSignedIn")를 쓰면, 그 key가 사람이 읽을 문장이 되는 곳은 이 파일뿐입니다. 던졌는데 등록하지 않은 key는 key 그대로 사용자에게 도착합니다.',
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/_oauth/oauth.dictionary.ts"
            code={`  .error({
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
  });`}
          />
          <div>
            {l.trans({
              en: "Two register conventions are visible there and both are deliberate. Korean error text ends in 다 — it is a statement of what went wrong, not an apology to the user. Korean phrase text ends in 다. only when it is also a statement; consentScope addresses the person and ends in 습니다.",
              ko: "그 안에 어투 규칙 두 가지가 보이고 둘 다 의도된 것입니다. 한국어 error 문구는 다.로 끝냅니다. 사용자에게 건네는 사과가 아니라 무엇이 잘못되었는지에 대한 서술이기 때문입니다. 한국어 문구는 그것이 서술일 때만 다.로 끝납니다. consentScope는 사람에게 말을 거는 문장이라 습니다로 끝납니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A brace pair is a slot the caller fills, as in Connected {at}. Nothing validates that the caller passes it, so keep the name obvious.",
              ko: "중괄호 한 쌍은 호출자가 채우는 자리입니다. Connected {at}이 그렇습니다. 호출자가 그 값을 넘겼는지는 아무것도 검증하지 않으므로 이름을 뻔하게 짓습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="reading-keys" title={l.trans({ en: "Reading A Key Back", ko: "Key 되읽기" })}>
        <Docs.Title>{l.trans({ en: "Reading A Key Back", ko: "Key 되읽기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every key lands under the module's own name, and the stage decides how deep. An endpoint label gets a signal segment because the endpoint namespace has to stay clear of the phrases; an error gets an error segment; a translate key gets neither.",
              ko: "모든 key는 module 자신의 이름 아래에 놓이고, 깊이는 단계가 정합니다. endpoint label에는 signal 구간이 붙습니다. endpoint namespace가 문구와 섞이지 않아야 하기 때문입니다. error에는 error 구간이 붙고, translate key에는 아무것도 붙지 않습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/page/oauth/consent/_index.tsx"
            code={`const { l } = usePage();

l("oauth.signal.approveOAuthConsent");  // endpoint label
l("oauth.error.notSignedIn");           // error key
l("oauth.consentTitle");                // translate key`}
          />
          <div>
            {l.trans({
              en: "usePage() resolves these on the server as well as the client, so a label in a server component costs no boundary. Reach for l.trans({ en, ko }) instead when the phrase is used once and belongs to the screen rather than to the module — a dictionary key that only one component reads is a key somebody has to keep in sync for nothing.",
              ko: "usePage()는 client뿐 아니라 server에서도 해석하므로, server component에서 label을 읽는 데 경계 비용이 들지 않습니다. 문구를 한 곳에서만 쓰고 그것이 module이 아니라 화면에 속한다면 l.trans({ en, ko })를 쓰세요. component 하나만 읽는 dictionary key는 아무 이유 없이 누군가 계속 맞춰 줘야 하는 key입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
