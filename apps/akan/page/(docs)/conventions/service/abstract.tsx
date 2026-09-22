import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="service-abstract" title="service.abstract.md">
        <Docs.Title>service.abstract.md</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Six months from now somebody will read oauth.service.ts and see that a refresh token reused within thirty seconds gets a rotation instead of a revocation. The code says it. What the code cannot say is why: a client that holds the same token twice is not a thief, and treating it as one signs the user out of an app that did nothing wrong.",
              ko: "여섯 달 뒤 누군가 oauth.service.ts를 읽다가, 30초 안에 재사용된 refresh token이 폐기가 아니라 회전으로 처리되는 것을 봅니다. 코드가 그렇게 말합니다. 코드가 말하지 못하는 것은 이유입니다. 같은 token을 두 번 들고 있는 클라이언트는 도둑이 아니고, 도둑 취급하면 아무 잘못 없는 앱에서 사용자를 로그아웃시키게 됩니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "That sentence is the whole job of the abstract. It holds the invariants the implementation obeys but cannot explain, and nothing else. The folder keeps its underscore and the file drops it: lib/_oauth/oauth.abstract.md.",
              ko: "그 한 문장이 abstract의 일 전부입니다. 구현이 지키고 있지만 설명하지는 못하는 불변식만 담고, 그 밖의 것은 담지 않습니다. folder는 underscore를 유지하고 파일명은 뗍니다. lib/_oauth/oauth.abstract.md입니다.",
            })}
          </div>
          <Docs.Alert>
            {l.trans({
              en: (
                <span>
                  Read it before changing the module, and update it when an invariant, a workflow, or public behaviour
                  changes. Do not touch it for a formatting, import, or style change — <code>akan quality scan</code>{" "}
                  warns once an abstract passes 300 lines, and the way a file gets there is one restated field at a
                  time.
                </span>
              ),
              ko: (
                <span>
                  module을 바꾸기 전에 읽고, 불변식·workflow·공개 동작이 바뀌면 갱신합니다. formatting, import, style만
                  바뀐 변경에서는 건드리지 않습니다. <code>akan quality scan</code>은 abstract가 300줄을 넘으면
                  경고하는데, 그 지경에 이르는 길은 언제나 field를 하나씩 다시 적는 것입니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="real-shape" title={l.trans({ en: "The Shape It Actually Has", ko: "실제 형태" })}>
        <Docs.Title>{l.trans({ en: "The Shape It Actually Has", ko: "실제 형태" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Four parts, and the last one is optional. Thirty-one of the thirty-three abstracts in this workspace are written this way; the two that are not have never been written at all.",
              ko: "네 부분이고 마지막 하나는 선택입니다. 이 워크스페이스의 abstract 33개 중 31개가 이렇게 쓰여 있습니다. 그렇지 않은 둘은 애초에 쓰인 적이 없는 것들입니다.",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">📛</span>
                <strong className="text-primary">{"# <service> Service Abstract"}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "One title line carrying the module name as the folder spells it, minus the underscore.",
                  ko: "제목 한 줄. folder가 쓰는 그대로의 module 이름에서 underscore만 뗀 것입니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">📝</span>
                <strong className="text-primary">
                  {l.trans({ en: "One declarative sentence", ko: "선언문 한 문장" })}
                </strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "What this module owns, stated as fact and not as a promise. No heading above it.",
                  ko: "이 module이 무엇을 소유하는지를, 약속이 아니라 사실로 적습니다. 위에 heading을 두지 않습니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">📏</span>
                <strong className="text-primary">## Rules</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Two to five bullets. Each one is an invariant a reader could not derive from the code, not a restatement of it.",
                  ko: "두 개에서 다섯 개의 항목. 각각은 코드에서 유추할 수 없는 불변식이지, 코드를 옮겨 적은 것이 아닙니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">➡️</span>
                <strong className="text-primary">{l.trans({ en: "A workflow chain", ko: "workflow 화살표" })}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Optional, and one line when present. Bare arrows, no heading: authorize -> pending -> approved | denied -> code.",
                  ko: "선택이며 있으면 한 줄입니다. heading 없이 화살표만 씁니다. authorize -> pending -> approved | denied -> code.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: "libs/shared/lib/_oauth/oauth.abstract.md is the best one in the workspace. It is reproduced below in full, unedited — seven rules and a chain, for a module whose service file is five hundred lines.",
              ko: "libs/shared/lib/_oauth/oauth.abstract.md이 이 워크스페이스에서 가장 좋은 예입니다. 아래는 손대지 않은 전문입니다. service 파일이 500줄인 module에 대해 규칙 일곱 개와 화살표 한 줄입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/_oauth/oauth.abstract.md"
            language="markdown"
            code={`# oauth Service Abstract

Issues, from the same process that serves \`/mcp\`, the OAuth 2.1 tokens that MCP endpoint accepts: authorization-server
metadata, authorization with PKCE and a consent page, client registration, token exchange and refresh.

## Rules

- Every access token is signed with the app's own secret and names the MCP endpoint as \`aud\`, so \`AccountMiddleware\`
  accepts it unchanged and \`McpAuth\` verifies it through \`option.setMcp\`. Guards stay the only authorization decision;
  no scope narrows what the token may do.
- An authorization request lives ten minutes, binds to the first signed-in account that opens it, and is decided once.
  A code lives sixty seconds and is consumed on first exchange, whether or not that exchange succeeds.
- PKCE \`S256\` is the only method. A redirect URI must be registered and match exactly, except that a loopback address
  may vary its port; a private-use scheme is accepted only when configuration names it.
- Refresh tokens rotate on use through \`refreshSession\`; a token reused within thirty seconds of its rotation is answered with
  a rotation of its own (a client that holds it twice is not a thief), one reused later revokes that grant's lineage only — never
  the account's other sessions. A refresh presented by a client other than the one it was issued to is refused.
- Registration is open (RFC 7591), rate-limited per address and public-client only; a \`client_id\` that is an HTTPS URL is
  read as a Client ID Metadata Document — resolved first and refused when it points into a private range, never fetched
  from the server's own network — unless configuration turns the feature off.
- A grant is revoked as a whole (RFC 7009 \`/oauth/revoke\` by the client, or the account's owner disconnecting it): its
  refresh lineage is closed and the lineage id is denylisted for an access token's lifetime, which is how a stateless
  token dies early. Revocation answers 200 whether or not the token was live, so it cannot be used to probe tokens.
- A token this server minted names its client and the MCP resource; a browser session names neither. That difference is
  what \`isAgentCall\` / \`Person\` read to keep an act a person may take from being taken on a model's say-so.
- None of these endpoints is published to MCP: they are the protocol and the account's own controls, not tools.

authorize -> pending -> approved | denied -> code -> token -> refresh -> revoked`}
          />
          <div>
            {l.trans({
              en: "Read the rules against the code and notice what is missing. Not one names a field, a type, a class, or a method. Every one of them is a decision somebody made that the next reader would otherwise have to reverse-engineer, and four of the seven exist to stop a plausible change from becoming a security hole.",
              ko: "규칙들을 코드와 나란히 읽으면서 무엇이 없는지 보세요. field, type, class, method를 이름으로 부르는 규칙이 하나도 없습니다. 전부 누군가 내린 결정이고, 적혀 있지 않으면 다음 읽는 사람이 역으로 추론해야 하는 것들이며, 일곱 중 넷은 그럴듯한 변경이 보안 구멍이 되는 것을 막기 위해 존재합니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="scaffold" title={l.trans({ en: "Replace The Scaffold", ko: "스캐폴드는 대체한다" })}>
        <Docs.Title>{l.trans({ en: "Replace The Scaffold", ko: "스캐폴드는 대체한다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A new service module arrives with six headings and no content. This is the file akan sync writes, and it is a prompt rather than a template — the first real edit deletes five of the six.",
              ko: "새 service module은 heading 여섯 개와 내용 없음으로 시작합니다. akan sync가 쓰는 파일이고, template이 아니라 질문지입니다. 처음 제대로 손대는 순간 여섯 중 다섯이 사라집니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="pkgs/@akanjs/cli/templates/service/__model__.abstract.md"
            language="markdown"
            code={`# Service Abstract

## Purpose // [!code --]

Describe the business workflow or integration this service owns. // [!code --]

## Domain Rules // [!code --]

- Keep durable business invariants here.
- Avoid repeating implementation details already clear in the service or signal files. // [!code --]

## Data Meaning // [!code --]

Explain important input, output, and state meanings only when the code does not make the intent obvious. // [!code --]

## Workflows // [!code --]

Describe the service workflows, background jobs, external calls, or state transitions.

## Agent Notes // [!code --]

- Read this abstract before changing the service module. // [!code --]
- Keep business behavior in service code and expose callable actions through signals. // [!code --]
- Update this file when business invariants, workflows, or public behavior change. // [!code --]

## Related Modules // [!code --]

- None yet. // [!code --]`}
          />
          <div>
            {l.trans({
              en: "Purpose becomes the one sentence under the title. Domain Rules becomes ## Rules. Workflows becomes the arrow chain, if there is one. Data Meaning belongs next to the field it describes, as a trailing comment in constant.ts. Agent Notes and Related Modules say nothing this guide does not already say to every module, so they go and nothing replaces them.",
              ko: "Purpose는 제목 아래의 문장 하나가 됩니다. Domain Rules는 ## Rules가 됩니다. Workflows는 있다면 화살표 한 줄이 됩니다. Data Meaning은 그것이 설명하는 field 옆, constant.ts의 꼬리 주석에 있어야 할 내용입니다. Agent Notes와 Related Modules는 이 가이드가 이미 모든 module에 하는 말을 반복할 뿐이므로, 지우고 아무것도 채우지 않습니다.",
            })}
          </div>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  Two files in this workspace still carry all six headings: <code>apps/akan/lib/_akan</code> and{" "}
                  <code>apps/minimal/lib/_minimal</code>. Both are empty root containers that own no behaviour, so
                  neither has an invariant to write down. Seeing the six headings in a module that does own behaviour
                  means nobody has written its abstract yet — the headings are the absence, not the content.
                </span>
              ),
              ko: (
                <span>
                  이 워크스페이스에서 heading 여섯 개를 그대로 들고 있는 파일은 둘입니다.{" "}
                  <code>apps/akan/lib/_akan</code>과 <code>apps/minimal/lib/_minimal</code>입니다. 둘 다 동작을 소유하지
                  않는 빈 루트 컨테이너라 적어 둘 불변식이 없습니다. 동작을 소유하는 module에서 이 여섯 개를 보았다면
                  아직 abstract를 아무도 쓰지 않은 것입니다. heading은 내용이 아니라 내용의 부재입니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="what-to-write" title={l.trans({ en: "What Counts As A Rule", ko: "무엇이 규칙인가" })}>
        <Docs.Title>{l.trans({ en: "What Counts As A Rule", ko: "무엇이 규칙인가" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The test is the same one the comment rule uses: does this sentence carry a fact that is nowhere in the code? A bullet that survives it is worth its line for years. One that does not goes stale the first time somebody renames a field.",
              ko: "기준은 주석 규칙과 같습니다. 이 문장은 코드 어디에도 없는 사실을 담고 있습니까? 그 기준을 통과한 항목은 몇 년치의 값어치를 합니다. 통과하지 못한 항목은 누군가 field 이름을 바꾸는 순간 낡습니다.",
            })}
          </div>
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "Worth a bullet:", ko: "적을 가치가 있는 것:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "A lifetime or a threshold and the reason for it — a code lives sixty seconds; a request lives ten minutes.",
                  ko: "유효 기간이나 임계값과 그 이유. code는 60초, request는 10분 산다는 식입니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "A refusal that looks like an oversight — revocation answers 200 whether or not the token was live, so it cannot be used to probe tokens.",
                  ko: "실수처럼 보이는 거절. 폐기는 token이 살아 있었든 아니든 200을 돌려주므로 token 존재 여부를 떠보는 데 쓸 수 없습니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "Why an obvious alternative was rejected — a client holding the same refresh token twice is not a thief.",
                  ko: "그럴듯한 대안을 왜 버렸는지. 같은 refresh token을 두 번 들고 있는 클라이언트는 도둑이 아니라는 식입니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "A scope boundary the code enforces one call at a time — a later reuse revokes that grant's lineage only, never the account's other sessions.",
                  ko: "코드가 호출 하나씩 지켜내는 범위 경계. 나중의 재사용은 그 grant의 계보만 폐기하고 계정의 다른 세션은 건드리지 않는다는 식입니다.",
                })}
              </li>
            </ul>
          </div>
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "⚠️ Not worth a bullet:", ko: "⚠️ 적을 가치가 없는 것:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "A field list, a type, or a method signature. The constant file and the signal file are shorter than the sentence describing them.",
                  ko: "field 목록, type, method 시그니처. constant 파일과 signal 파일이 그것을 설명하는 문장보다 짧습니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "Anything the root AGENTS.md already says to every module, such as keeping business behaviour in the service.",
                  ko: "루트 AGENTS.md가 이미 모든 module에 하는 말. 비즈니스 동작은 service에 둔다 같은 것입니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "A to-do, a roadmap, or a list of related modules that the import graph already shows.",
                  ko: "할 일, 로드맵, 그리고 import 그래프가 이미 보여주는 관련 module 목록.",
                })}
              </li>
            </ul>
          </div>
          <div>
            {l.trans({
              en: "Korean is normal in an abstract and common in this workspace — security, util, localFile and shared are all written in it. What is never normal is a language split inside one file.",
              ko: "abstract를 한국어로 쓰는 것은 정상이고 이 워크스페이스에서 흔합니다. security, util, localFile, shared가 전부 한국어입니다. 정상이 아닌 것은 파일 하나 안에서 언어가 갈리는 것입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
