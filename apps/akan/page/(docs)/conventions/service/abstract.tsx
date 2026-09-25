import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const partRows = [
    {
      name: "# <service> Service Abstract",
      desc: l.trans({
        en: "One title line: the module name as the folder spells it, minus the underscore.",
        ko: "제목 한 줄입니다. 폴더 이름에서 underscore만 뗀 module 이름을 씁니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "One sentence", ko: "선언문 한 문장" })}</span>,
      desc: l.trans({
        en: "What the module owns, stated as fact rather than a promise. No heading above it.",
        ko: "module이 무엇을 소유하는지 약속이 아니라 사실로 적습니다. 위에 heading을 두지 않습니다.",
      }),
    },
    {
      name: "## Rules",
      desc: l.trans({
        en: "Two to five bullets, each an invariant a reader could not derive from the code.",
        ko: "항목 2~5개입니다. 각각 코드에서 유추할 수 없는 불변식이지, 코드를 옮겨 적은 것이 아닙니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "Workflow chain", ko: "workflow 화살표" })}</span>,
      desc: l.trans({
        en: "Optional. One line with no heading: bare arrows between states.",
        ko: "선택입니다. 있으면 heading 없이, 상태 사이를 화살표로 이은 한 줄입니다.",
      }),
      example: "authorize -> pending -> approved | denied -> code",
    },
  ];

  const scaffoldRows = [
    {
      name: "# payment Service Abstract",
      desc: l.trans({
        en: "Written for you from the folder name, minus the underscore. Keep it.",
        ko: "폴더 이름에서 underscore를 뗀 이름으로 미리 적혀 있습니다. 그대로 둡니다.",
      }),
    },
    {
      name: "<One sentence …>",
      desc: l.trans({
        en: "Replaced by what the module owns, stated as fact.",
        ko: "module이 무엇을 소유하는지 사실로 적은 문장으로 바꿉니다.",
      }),
    },
    {
      name: "## Rules",
      desc: l.trans({
        en: "Stays. Both placeholder bullets become the module's real invariants, two to five in all.",
        ko: "그대로 둡니다. 자리표시 항목 두 개를 module의 실제 불변식 2~5개로 바꿉니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "Workflow chain", ko: "workflow 화살표" })}</span>,
      desc: l.trans({
        en: "Not in the scaffold. Add one last line of arrows if the service moves something through states.",
        ko: "스캐폴드에는 없습니다. service가 무언가를 상태 사이로 옮긴다면 마지막에 화살표 한 줄을 더합니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "A field's meaning", ko: "field의 의미" })}</span>,
      desc: l.trans({
        en: "Not here: a trailing comment beside the field, in the constant.ts that declares it.",
        ko: "여기가 아니라, 그 field를 선언한 constant.ts에서 field 옆 꼬리 주석으로 씁니다.",
      }),
    },
  ];

  const worthRows = [
    {
      name: (
        <span className="font-sans">
          {l.trans({ en: "A lifetime or threshold, and its reason", ko: "유효 기간·임계값과 그 이유" })}
        </span>
      ),
      desc: l.trans({
        en: "A code lives sixty seconds; an authorization request lives ten minutes.",
        ko: "code는 60초, 인가 요청은 10분 동안 유효합니다.",
      }),
    },
    {
      name: (
        <span className="font-sans">
          {l.trans({ en: "A refusal that looks like an oversight", ko: "실수처럼 보이는 거절" })}
        </span>
      ),
      desc: l.trans({
        en: "Revocation answers 200 whether or not the token was live, so it cannot probe tokens.",
        ko: "폐기는 token이 살아 있었든 아니든 200을 돌려줍니다. 그래서 token을 떠보는 데 쓸 수 없습니다.",
      }),
    },
    {
      name: (
        <span className="font-sans">
          {l.trans({ en: "Why an obvious alternative was rejected", ko: "그럴듯한 대안을 버린 이유" })}
        </span>
      ),
      desc: l.trans({
        en: "A client holding the same refresh token twice is not a thief.",
        ko: "같은 refresh token을 두 번 든 클라이언트는 도둑이 아닙니다.",
      }),
    },
    {
      name: (
        <span className="font-sans">
          {l.trans({ en: "A scope boundary enforced call by call", ko: "코드가 호출마다 지키는 범위 경계" })}
        </span>
      ),
      desc: l.trans({
        en: "A late reuse revokes that grant's lineage only, never the account's other sessions.",
        ko: "늦은 재사용은 그 grant의 계보만 폐기하고, 계정의 다른 세션은 건드리지 않습니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="service-abstract" title="service.abstract.md">
        <Docs.Title>service.abstract.md</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A short markdown file beside a service module. It holds the invariants — rules that must always hold — which the code obeys but cannot explain, and nothing else.",
              ko: "service module 옆에 두는 짧은 markdown 파일입니다. 코드가 지키고 있지만 설명하지는 못하는 불변식(항상 참이어야 하는 규칙)만 적고, 그 밖의 것은 적지 않습니다.",
            })}
          </div>
          <div className="mt-3">
            {l.trans({
              en: "One rule from the oauth module shows the difference:",
              ko: "oauth module의 규칙 하나를 보면 차이가 보입니다:",
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">
                {l.trans({ en: "What the Code Says", ko: "코드가 말하는 것" })}
              </div>
              <code className="mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs">
                refreshRotationGraceMs = 30_000
              </code>
              <div className="mt-2 text-foreground/70 text-sm">
                {l.trans({
                  en: (
                    <span>
                      <code>oauth.service.ts</code> hands this window to <code>refreshSession</code>: a refresh token
                      reused within 30 seconds of its rotation is rotated again, not revoked.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>oauth.service.ts</code>는 이 값을 <code>refreshSession</code>에 넘깁니다. 회전 후 30초 안에
                      재사용된 refresh token은 폐기되지 않고 한 번 더 회전됩니다.
                    </span>
                  ),
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">
                {l.trans({ en: "What the Abstract Adds", ko: "abstract가 더하는 것" })}
              </div>
              <div className="mt-2 text-foreground/70 text-sm">
                {l.trans({
                  en: "Why. A client that holds the same token twice is not a thief, and treating it as one signs the user out of an app that did nothing wrong.",
                  ko: "이유입니다. 같은 token을 두 번 든 클라이언트는 도둑이 아닙니다. 도둑으로 취급하면 아무 잘못 없는 앱에서 사용자를 로그아웃시킵니다.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  The second card is the abstract's whole job. The file sits in the module folder; the folder keeps its
                  underscore and the file name drops it: <code>lib/_oauth/oauth.abstract.md</code>.
                </span>
              ),
              ko: (
                <span>
                  두 번째 카드가 abstract가 하는 일의 전부입니다. 파일은 module 폴더 안에 두고, 폴더는 underscore를
                  유지하되 파일 이름에서는 뗍니다: <code>lib/_oauth/oauth.abstract.md</code>.
                </span>
              ),
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "When to touch it", ko: "언제 손대나" })}</Docs.SubSubTitle>
          <ul className="my-4 list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Before you change the module,</strong> read it first.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>module을 바꾸기 전에</strong> 먼저 읽습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>When an invariant, a workflow or public behaviour changes,</strong> update it.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>불변식, workflow, 공개 동작이 바뀌면</strong> 갱신합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>When only formatting, imports or style change,</strong> leave it alone.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>formatting, import, style만 바뀌었다면</strong> 건드리지 않습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="real-shape" title={l.trans({ en: "The Four Parts", ko: "네 부분" })}>
        <Docs.Title>{l.trans({ en: "The Four Parts", ko: "네 부분" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  An abstract has four parts, and the last is optional. All thirty-three abstracts in this workspace
                  open with a title, one sentence and <code>## Rules</code>, and so does the scaffold a new service
                  module starts from.
                </span>
              ),
              ko: (
                <span>
                  abstract는 네 부분으로 되어 있고 마지막은 선택입니다. 이 워크스페이스의 abstract 33개가 모두 제목, 한
                  문장, <code>## Rules</code> 순서로 시작하고, 새 service module이 받는 스캐폴드도 같은 모양입니다.
                </span>
              ),
            })}
          </div>
          <div className="mt-3">{l.trans({ en: "The whole skeleton:", ko: "뼈대 전체입니다:" })}</div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/_payment/payment.abstract.md"
            language="markdown"
            code={`# payment Service Abstract

<One sentence: what this module owns, stated as fact.>

## Rules

- <An invariant the code obeys but cannot explain.>
- <Two to five of them.>

<state> -> <state> -> <state>`}
          />
          <Docs.IntroTable type={l.trans({ en: "Part", ko: "부분" })} items={partRows} />

          <Docs.SubSubTitle>{l.trans({ en: "A real one: oauth", ko: "실제 예: oauth" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  <code className="wrap-anywhere">libs/shared/lib/_oauth/oauth.abstract.md</code> is the best one in the
                  workspace. Here it is in full, unedited:
                </span>
              ),
              ko: (
                <span>
                  <code className="wrap-anywhere">libs/shared/lib/_oauth/oauth.abstract.md</code>가 이 워크스페이스에서
                  가장 좋은 예입니다. 손대지 않은 전문입니다:
                </span>
              ),
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
          <ul className="my-4 list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Eight rules and one chain.</strong> The service file runs to about five hundred lines, so it
                    carries more than the usual two to five.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>규칙 여덟 개와 화살표 한 줄.</strong> service 파일이 500줄 남짓이라 보통의 2~5개보다
                    많습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>No field lists, types or signatures.</strong> A name such as <code>AccountMiddleware</code>{" "}
                    or <code>refreshSession</code> appears only to say who enforces the decision.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>field 목록, type, 시그니처가 없습니다.</strong> <code>AccountMiddleware</code>나{" "}
                    <code>refreshSession</code> 같은 이름은 그 결정을 누가 집행하는지 가리킬 때만 나옵니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Every rule is a decision.</strong> Left unwritten, the next reader would have to
                    reverse-engineer it from the code.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>규칙마다 누군가 내린 결정입니다.</strong> 적혀 있지 않으면 다음 사람이 코드에서 거꾸로
                    추론해야 합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>More than half guard security.</strong> They stop a plausible change to PKCE, redirect
                    matching, token reuse or revocation from opening a hole.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>절반 이상은 보안을 지킵니다.</strong> PKCE, redirect 일치, token 재사용, 폐기를 그럴듯하게
                    바꾼 변경이 보안 구멍이 되는 것을 막습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="scaffold" title={l.trans({ en: "Fill In The Scaffold", ko: "스캐폴드 채우기" })}>
        <Docs.Title>{l.trans({ en: "Fill In The Scaffold", ko: "스캐폴드 채우기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A new service module starts with an abstract already in this shape: its title, a placeholder sentence and two placeholder rules. Every line in angle brackets is a prompt, and none of them survives the first real edit.",
              ko: "새 service module의 abstract는 처음부터 이 모양입니다. 제목, 자리표시 문장 하나, 자리표시 규칙 두 개가 들어 있습니다. 꺾쇠괄호로 된 줄은 모두 질문이라서, 처음 제대로 쓰는 순간 하나도 남지 않습니다.",
            })}
          </div>
          <div className="mt-3">
            {l.trans({
              en: (
                <span>
                  What <code>akan create-service payment</code> writes:
                </span>
              ),
              ko: (
                <span>
                  <code>akan create-service payment</code>가 만드는 파일입니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/_payment/payment.abstract.md"
            language="markdown"
            code={`# payment Service Abstract

<One sentence: the workflow or integration this service owns, stated as fact.>

## Rules

- <An invariant the code obeys but cannot explain: a lifetime, a refusal, an ordering, and its reason.>
- <Two to five of them. If the service moves something through states, end the file with one arrow line.>`}
          />
          <div>{l.trans({ en: "What each line becomes:", ko: "줄마다 바뀌는 모습입니다:" })}</div>
          <Docs.IntroTable
            type={l.trans({ en: "Scaffold", ko: "스캐폴드" })}
            descLabel={l.trans({ en: "Becomes", ko: "바뀌는 모습" })}
            items={scaffoldRows}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>A line still in angle brackets means nobody has written the abstract yet.</strong> The next
                  reader — a person or an agent — opens this file before changing the module, and a placeholder tells
                  them nothing true about it. Write the sentence and the rules in the same change that adds the first
                  endpoint.
                </span>
              ),
              ko: (
                <span>
                  <strong>꺾쇠괄호 줄이 남아 있다면 아직 아무도 abstract를 쓰지 않은 것입니다.</strong> 사람이든
                  에이전트든 다음 사람은 module을 고치기 전에 이 파일부터 열어 보는데, 자리표시 문구는 그 module에 대해
                  아무것도 알려 주지 않습니다. 첫 endpoint를 추가하는 변경에서 문장과 규칙도 함께 씁니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="what-to-write" title={l.trans({ en: "What Counts As A Rule", ko: "무엇을 규칙으로 적나" })}>
        <Docs.Title>{l.trans({ en: "What Counts As A Rule", ko: "무엇을 규칙으로 적나" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Use the same test as for code comments: does this sentence carry a fact that is nowhere in the code? A bullet that passes stays true for years; one that fails goes stale the first time a field is renamed.",
              ko: "코드 주석과 같은 기준을 씁니다. 이 문장이 코드 어디에도 없는 사실을 담고 있나요? 통과한 항목은 몇 년을 버티고, 통과하지 못한 항목은 field 이름 하나만 바뀌어도 낡습니다.",
            })}
          </div>

          <Docs.SubSubTitle>{l.trans({ en: "Worth a bullet", ko: "적을 것" })}</Docs.SubSubTitle>
          <Docs.IntroTable
            type={l.trans({ en: "Kind", ko: "종류" })}
            descLabel={l.trans({ en: "Example from oauth", ko: "oauth의 예" })}
            items={worthRows}
          />

          <Docs.SubSubTitle>{l.trans({ en: "Not worth a bullet", ko: "적지 않을 것" })}</Docs.SubSubTitle>
          <ul className="my-4 list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Field lists, types and method signatures.</strong> The constant and signal files are shorter
                    than a sentence describing them.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>field 목록, type, method 시그니처.</strong> constant 파일과 signal 파일이 그것을 설명하는
                    문장보다 짧습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>What the root AGENTS.md already tells every module,</strong> such as keeping business
                    behaviour in the service.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>루트 AGENTS.md가 모든 module에 이미 하는 말.</strong> “비즈니스 동작은 service에 둔다” 같은
                    것입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>To-dos, roadmaps and related-module lists.</strong> The import graph already shows which
                    modules are related.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>할 일, 로드맵, 관련 module 목록.</strong> 어떤 module이 이어져 있는지는 import 그래프가 이미
                    보여 줍니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Language", ko: "언어" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  Korean is normal in an abstract and common here: <code>security</code>, <code>util</code>,{" "}
                  <code>localFile</code> and <code>shared</code> are all written in it. What is never normal is a
                  language split inside one file.
                </span>
              ),
              ko: (
                <span>
                  abstract를 한국어로 쓰는 것은 정상이고 이 워크스페이스에서도 흔합니다. <code>security</code>,{" "}
                  <code>util</code>, <code>localFile</code>, <code>shared</code>가 모두 한국어입니다. 정상이 아닌 것은
                  파일 하나 안에서 언어가 갈리는 것입니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
