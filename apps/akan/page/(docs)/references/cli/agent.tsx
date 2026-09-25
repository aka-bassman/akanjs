import { usePage } from "@apps/akan/client";
import {
  type CommandReferenceItem,
  CommandReferenceSlide,
  cardGridRecipe,
  Divider,
  Docs,
  DocsToc,
  type IntroItem,
  type MatrixGroup,
  panelRecipe,
} from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const termRows: IntroItem[] = [
    {
      name: <span className="font-sans">{l.trans({ en: "agent guide", ko: "에이전트 가이드" })}</span>,
      desc: l.trans({
        en: "The workspace's `AGENTS.md`, the one file holding the conventions every coding agent follows.",
        ko: "워크스페이스의 `AGENTS.md`입니다. 모든 코딩 에이전트가 따르는 규칙을 이 파일 하나에 담습니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "pointer", ko: "포인터" })}</span>,
      desc: l.trans({
        en: "A short file that only tells one tool to read `AGENTS.md`, such as `CLAUDE.md`.",
        ko: "도구 하나에게 `AGENTS.md`를 읽으라고만 알려 주는 짧은 파일입니다. `CLAUDE.md`가 그 예입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "managed block", ko: "관리 블록" })}</span>,
      desc: l.trans({
        en: "The part of `AGENTS.md` between the `akan:agent` markers. The command rewrites only this part.",
        ko: "`AGENTS.md`에서 `akan:agent` 마커 사이 부분입니다. 명령은 이 부분만 다시 씁니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "scoped guide", ko: "앱·라이브러리 가이드" })}</span>,
      desc: l.trans({
        en: "`apps/<app>/AGENTS.md` or `libs/<lib>/AGENTS.md`: the UI recipes that scope can import.",
        ko: "`apps/<app>/AGENTS.md`, `libs/<lib>/AGENTS.md`입니다. 그 앱이나 라이브러리가 import할 수 있는 UI 레시피를 적습니다.",
      }),
    },
  ];

  const targetGroups: MatrixGroup[] = [
    {
      label: l.trans({
        en: "Guide · only the block is rewritten, so `--force` is never needed",
        ko: "가이드 · 블록만 다시 쓰므로 `--force`가 필요 없음",
      }),
      rows: [
        {
          name: "agents-md",
          desc: l.trans({
            en: "Rebuilds the managed block, then writes every app and library guide.",
            ko: "관리 블록을 다시 만들고, 앱·라이브러리 가이드도 모두 씁니다.",
          }),
          marks: { guide: true, scoped: true },
        },
      ],
    },
    {
      label: l.trans({
        en: "Pointers · written whole, so an existing file needs `--force`",
        ko: "포인터 · 파일을 통째로 쓰므로 이미 있으면 `--force` 필요",
      }),
      rows: [
        {
          name: "claude",
          desc: l.trans({
            en: "Claude Code imports the guide through `@AGENTS.md`.",
            ko: "Claude Code가 `@AGENTS.md`로 가이드를 불러옵니다.",
          }),
          marks: { claude: true },
        },
        {
          name: "cursor",
          desc: l.trans({
            en: "An always-on Cursor rule that points at the guide.",
            ko: "가이드를 가리키는, 항상 적용되는 Cursor 규칙입니다.",
          }),
          marks: { cursor: true },
        },
      ],
    },
    {
      label: l.trans({ en: "Default", ko: "기본값" }),
      rows: [
        {
          name: "all",
          desc: l.trans({
            en: "All three, in the order `cursor`, `agents-md`, `claude`.",
            ko: "셋 모두를 `cursor`, `agents-md`, `claude` 순서로 씁니다.",
          }),
          marks: { guide: true, scoped: true, claude: true, cursor: true },
        },
      ],
    },
  ];

  const whenRules = [
    l.trans({
      en: (
        <>
          <strong>A new workspace already has them.</strong> <code>create-workspace</code> runs{" "}
          <code>akan agent install all --force</code> unless you pass <code>--agent-install false</code>.
        </>
      ),
      ko: (
        <>
          <strong>새 워크스페이스에는 이미 있습니다.</strong> <code>create-workspace</code>가{" "}
          <code>akan agent install all --force</code>를 실행합니다. <code>--agent-install false</code>를 주면
          건너뜁니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>After upgrading Akan.</strong> <code>bun update</code> leaves the guide as it was, so run{" "}
          <code>akan agent install agents-md</code>. A bare <code>akan agent install</code> stops at the existing Cursor
          rule and writes nothing.
        </>
      ),
      ko: (
        <>
          <strong>Akan 버전을 올린 뒤.</strong> <code>bun update</code>는 가이드를 그대로 두므로{" "}
          <code>akan agent install agents-md</code>를 실행합니다. 대상 없이 <code>akan agent install</code>만 실행하면
          이미 있는 Cursor 규칙에서 멈추고 아무것도 쓰지 않습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            When <code>akan doctor</code> warns.
          </strong>{" "}
          <code>agent-guide-stale</code> means a release other than the installed one wrote the guide, and{" "}
          <code>agent-guide-unstamped</code> means it has no version stamp. <code>akan agent install agents-md</code>{" "}
          fixes both.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>akan doctor</code>가 경고할 때.
          </strong>{" "}
          <code>agent-guide-stale</code>은 지금 설치된 것과 다른 릴리스가 가이드를 썼다는 뜻이고,{" "}
          <code>agent-guide-unstamped</code>는 버전 표시가 없다는 뜻입니다. 둘 다{" "}
          <code>akan agent install agents-md</code>로 고칩니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>To add one pointer.</strong> Pass <code>claude</code> or <code>cursor</code> as the target. Codex and
          other agents that read <code>AGENTS.md</code> by themselves need none.
        </>
      ),
      ko: (
        <>
          <strong>포인터를 하나만 추가할 때.</strong> 대상으로 <code>claude</code>나 <code>cursor</code>만 지정합니다.{" "}
          <code>AGENTS.md</code>를 스스로 읽는 Codex 같은 에이전트는 포인터가 필요 없습니다.
        </>
      ),
    }),
  ];

  const guideSections: IntroItem[] = [
    {
      name: <span className="font-sans">{l.trans({ en: "Workspace", ko: "워크스페이스" })}</span>,
      desc: l.trans({
        en: "The repo name, and the apps, libraries and packages in it.",
        ko: "저장소 이름과 그 안의 앱, 라이브러리, 패키지 목록입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "Conventions", ko: "컨벤션" })}</span>,
      desc: l.trans({
        en: "The coding rules, including the lint rules that break the build.",
        ko: "코딩 규칙입니다. 빌드를 깨뜨리는 린트 규칙도 여기에 있습니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "Onboarding", ko: "온보딩" })}</span>,
      desc: l.trans({
        en: "The workspace layout, everyday commands, where each kind of code goes, and common pitfalls.",
        ko: "워크스페이스 구조, 자주 쓰는 명령, 코드 종류별로 둘 곳, 자주 틀리는 부분입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "Start clean", ko: "샘플 정리" })}</span>,
      desc: l.trans({
        en: "Present only while samples from `create-workspace` remain, and lists which ones to delete.",
        ko: "`create-workspace`가 만든 샘플이 남아 있을 때만 들어가며, 지울 샘플을 알려 줍니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "Module abstracts", ko: "모듈 abstract" })}</span>,
      desc: l.trans({
        en: "Read a module's `*.abstract.md` first, and update it when the module's behavior changes.",
        ko: "모듈의 `*.abstract.md`를 먼저 읽고, 모듈 동작이 바뀌면 갱신하라는 규칙입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "Generated files", ko: "생성 파일" })}</span>,
      desc: l.trans({
        en: "Which generated files never to hand-edit, and the commands that regenerate them.",
        ko: "직접 고치면 안 되는 생성 파일과, 그 파일을 다시 만드는 명령입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "Recipes", ko: "레시피" })}</span>,
      desc: l.trans({
        en: "The `akanjs/ui` recipes. App and library recipes are in the scoped guides.",
        ko: "`akanjs/ui` 레시피 목록입니다. 앱·라이브러리 레시피는 각자의 가이드에 있습니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "MCP workflow policy", ko: "MCP 워크플로 정책" })}</span>,
      desc: l.trans({
        en: "Prefer an Akan workflow to a direct edit, run through MCP or the CLI.",
        ko: "직접 고치기보다 Akan 워크플로를 먼저 쓰라는 규칙입니다. MCP나 CLI로 실행합니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "Validation", ko: "검증 명령" })}</span>,
      desc: l.trans({
        en: "The `sync`, `lint`, `typecheck`, `test`, `build`, `doctor` and `quality` commands.",
        ko: "작업을 확인할 `sync`, `lint`, `typecheck`, `test`, `build`, `doctor`, `quality` 명령입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "Framework guide", ko: "프레임워크 가이드" })}</span>,
      desc: l.trans({
        en: "Where each kind of code belongs, the module flow, and how to theme and re-skin the UI.",
        ko: "코드 종류별로 둘 곳, 모듈 흐름, 테마와 UI를 바꾸는 방법입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "Before you finish", ko: "마무리 점검" })}</span>,
      desc: l.trans({
        en: "A checklist before handing work back: lint, typecheck, sync, SSR share, comments and abstracts.",
        ko: "작업을 넘기기 전 점검 목록입니다. 린트, 타입 검사, sync, SSR 비율, 주석, abstract를 확인합니다.",
      }),
    },
  ];

  const splitCards = [
    {
      title: l.trans({ en: "Rule Files", ko: "규칙 파일" }),
      desc: l.trans({
        en: "Standing instructions an agent carries into every session: how code is written here.",
        ko: "에이전트가 모든 세션에 늘 지니고 가는 지침입니다. 이 저장소에서 코드를 쓰는 방법을 알려 줍니다.",
      }),
      chip: "akan agent install",
    },
    {
      title: l.trans({ en: "MCP Server", ko: "MCP 서버" }),
      desc: l.trans({
        en: "Answers live questions, and in apply mode runs the workflows the rules point at.",
        ko: "그때그때 질문에 답하고, apply 모드에서는 규칙이 가리키는 워크플로까지 실행합니다.",
      }),
      chip: "akan mcp-install",
    },
  ];

  const commands: CommandReferenceItem[] = [
    {
      name: "agent",
      signature: "akan agent install [target] [--force]",
      desc: l.trans({
        en: "Write the agent guide and its pointers into the workspace.\nRun it again after upgrading Akan: only the managed block of `AGENTS.md` is rewritten, so your own text stays.",
        ko: "에이전트 가이드와 포인터 파일을 워크스페이스에 씁니다.\nAkan 버전을 올린 뒤 다시 실행하세요. `AGENTS.md`는 관리 블록만 다시 쓰므로 직접 쓴 내용은 그대로 남습니다.",
      }),
      args: [
        {
          name: "action",
          type: "String",
          required: "yes",
          desc: l.trans({
            en: "Always `install`, the only action. Left out, the CLI asks for it; any other value is an error.",
            ko: "항상 `install`입니다. 생략하면 CLI가 입력을 묻고, 다른 값을 주면 오류를 내고 멈춥니다.",
          }),
        },
        {
          name: "target",
          type: "String",
          defaultValue: "all",
          enumOrFlag: "cursor | agents-md | claude | all",
          desc: l.trans({
            en: "Which file to write. Left out, it writes all three.",
            ko: "쓸 파일을 고릅니다. 생략하면 셋 다 씁니다.",
          }),
        },
      ],
      options: [
        {
          name: "--force",
          type: "Boolean",
          defaultValue: "false",
          enumOrFlag: "-f",
          desc: l.trans({
            en: "Overwrite an existing `CLAUDE.md` or `.cursor/rules/akan.mdc`. `AGENTS.md` never needs it.",
            ko: "이미 있는 `CLAUDE.md`나 `.cursor/rules/akan.mdc`를 덮어씁니다. `AGENTS.md`에는 필요 없습니다.",
          }),
        },
      ],
      notes: [
        {
          name: "agents-md",
          desc: l.trans({
            en: "Writes `AGENTS.md`, then each `apps/<app>/AGENTS.md` and `libs/<lib>/AGENTS.md`.",
            ko: "`AGENTS.md`를 쓰고, 이어서 각 `apps/<app>/AGENTS.md`와 `libs/<lib>/AGENTS.md`를 씁니다.",
          }),
        },
        {
          name: "cursor",
          desc: l.trans({
            en: "Writes `.cursor/rules/akan.mdc`, an `alwaysApply` rule that points at `AGENTS.md`.",
            ko: "`AGENTS.md`를 가리키는 `alwaysApply` 규칙 `.cursor/rules/akan.mdc`를 씁니다.",
          }),
        },
        {
          name: "claude",
          desc: l.trans({
            en: "Writes `CLAUDE.md`: an `@AGENTS.md` import plus the comment rule, restated.",
            ko: "`CLAUDE.md`를 씁니다. `@AGENTS.md` import 한 줄과, 한 번 더 적은 주석 규칙이 들어갑니다.",
          }),
        },
        {
          name: l.trans({ en: "existing AGENTS.md", ko: "기존 AGENTS.md" }),
          desc: l.trans({
            en: "Only the block between the markers is replaced. A file with no markers gets the block appended.",
            ko: "마커 사이 블록만 바꿉니다. 마커가 없는 파일이면 블록을 끝에 덧붙입니다.",
          }),
        },
        {
          name: l.trans({ en: "existing pointer", ko: "기존 포인터" }),
          desc: l.trans({
            en: "Without `--force`, the command stops there with an error and skips the files after it.",
            ko: "`--force`가 없으면 그 파일에서 오류를 내고 멈추며, 뒤에 남은 파일은 쓰지 않습니다.",
          }),
        },
        {
          name: l.trans({ en: "scoped guides", ko: "앱·라이브러리 가이드" }),
          desc: l.trans({
            en: "`akan sync <name>` keeps them current, and `akan lint` fails while one is stale.",
            ko: "`akan sync <name>`이 최신으로 유지하고, 오래된 가이드가 있으면 `akan lint`가 실패합니다.",
          }),
        },
        {
          name: l.trans({ en: "skipped scope", ko: "건너뛴 앱·라이브러리" }),
          desc: l.trans({
            en: "One whose config cannot load yet is skipped; `akan sync <name>` writes it later.",
            ko: "설정을 아직 불러올 수 없는 앱·라이브러리는 건너뜁니다. 나중에 `akan sync <name>`이 씁니다.",
          }),
        },
        {
          name: l.trans({ en: "scoped CLAUDE.md", ko: "앱·라이브러리 CLAUDE.md" }),
          desc: l.trans({
            en: "Each app and library also gets a `CLAUDE.md` pointer, but only when it has none.",
            ko: "앱과 라이브러리마다 `CLAUDE.md` 포인터도 만듭니다. 이미 있으면 건드리지 않습니다.",
          }),
        },
        {
          name: l.trans({ en: "staleness", ko: "최신 여부" }),
          desc: l.trans({
            en: "`bun update` never rewrites the block; `akan agent install agents-md` refreshes it.",
            ko: "`bun update`는 블록을 다시 쓰지 않습니다. `akan agent install agents-md`로 새로 고칩니다.",
          }),
        },
        {
          name: l.trans({ en: "version stamp", ko: "버전 표시" }),
          desc: l.trans({
            en: "The block records the release that wrote it, and `akan doctor` compares it with yours.",
            ko: "블록에는 그것을 쓴 릴리스가 적히고, `akan doctor`가 지금 설치된 버전과 비교합니다.",
          }),
        },
        {
          name: l.trans({ en: "flag position", ko: "플래그 위치" }),
          desc: l.trans({
            en: "Put `--force` last: `--force claude` reads `claude` as its value, so all three run unforced.",
            ko: "`--force`는 맨 뒤에 씁니다. `--force claude`는 `claude`를 플래그 값으로 읽어, `--force` 없이 셋 다 씁니다.",
          }),
        },
      ],
      examples: `akan agent install
akan agent install agents-md
akan agent install claude
akan agent install cursor
akan agent install all --force`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="agent-cli" title={l.trans({ en: "Agent CLI", ko: "에이전트 CLI" })}>
        <Docs.Title>{l.trans({ en: "Agent CLI", ko: "에이전트 CLI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>akan agent install</code> writes the rule files a coding agent reads before it touches your
                  code: one <code>AGENTS.md</code> for every agent, plus pointers for Claude Code and Cursor. A
                  convention is written once, and every agent reads the same copy.
                </span>
              ),
              ko: (
                <span>
                  <code>akan agent install</code>은 코딩 에이전트가 코드를 고치기 전에 읽는 규칙 파일을 씁니다. 모든
                  에이전트가 읽는 <code>AGENTS.md</code> 하나와, Claude Code·Cursor용 포인터 파일입니다. 규칙은 한 번만
                  쓰고 모든 에이전트가 같은 사본을 읽습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>

        <Docs.SubSubTitle>{l.trans({ en: "Words Used on This Page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
        <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />

        <Docs.SubSubTitle>{l.trans({ en: "What Each Target Writes", ko: "대상별로 쓰는 파일" })}</Docs.SubSubTitle>
        <div>
          {l.trans({
            en: "Name a target, or leave it out to write all three. The guide is refreshed in place; a pointer is written whole.",
            ko: "대상을 하나 고르거나, 생략해서 셋 다 씁니다. 가이드는 블록만 새로 쓰고, 포인터는 파일을 통째로 씁니다.",
          })}
        </div>
        <Docs.Matrix
          type={l.trans({ en: "Target", ko: "대상" })}
          columns={[
            { key: "guide", label: "AGENTS.md", code: true },
            {
              key: "scoped",
              label: l.trans({
                en: (
                  <>
                    App/lib
                    <br />
                    guides
                  </>
                ),
                ko: (
                  <>
                    앱·라이브러리
                    <br />
                    가이드
                  </>
                ),
              }),
            },
            { key: "claude", label: "CLAUDE.md", code: true },
            { key: "cursor", label: "Cursor" },
          ]}
          groups={targetGroups}
          markLabel={l.trans({ en: "Writes", ko: "씀" })}
          emptyLabel={l.trans({ en: "Does not", ko: "안 씀" })}
        />
        <Docs.Alert type="warning">
          {l.trans({
            en: (
              <>
                <strong>
                  <code>--force</code> replaces <code>CLAUDE.md</code> and the Cursor rule whole.
                </strong>{" "}
                Anything you added there is lost, so keep your own instructions in <code>AGENTS.md</code>, outside the{" "}
                <code>akan:agent</code> markers.
              </>
            ),
            ko: (
              <>
                <strong>
                  <code>--force</code>는 <code>CLAUDE.md</code>와 Cursor 규칙을 통째로 덮어씁니다.
                </strong>{" "}
                거기에 직접 적은 내용은 사라지므로, 직접 쓰는 지침은 <code>AGENTS.md</code>의 <code>akan:agent</code>{" "}
                마커 바깥에 두세요.
              </>
            ),
          })}
        </Docs.Alert>

        <Docs.SubSubTitle>{l.trans({ en: "When to Run It", ko: "언제 실행하나요" })}</Docs.SubSubTitle>
        <ul className="my-4 list-disc space-y-2 pl-5">
          {whenRules.map((rule, idx) => (
            <li key={idx}>{rule}</li>
          ))}
        </ul>

        <Docs.SubSubTitle>{l.trans({ en: "What the Guide Holds", ko: "가이드에 담기는 내용" })}</Docs.SubSubTitle>
        <div>
          {l.trans({
            en: "The managed block is rebuilt from the installed Akan release and your workspace. Top to bottom, it holds:",
            ko: "관리 블록은 설치된 Akan 릴리스와 지금 워크스페이스를 바탕으로 새로 만들어집니다. 위에서부터 이런 내용이 들어갑니다.",
          })}
        </div>
        <Docs.IntroTable type={l.trans({ en: "Section", ko: "섹션" })} items={guideSections} />

        <Docs.SubSubTitle>{l.trans({ en: "Rules and MCP", ko: "규칙과 MCP" })}</Docs.SubSubTitle>
        <div>
          {l.trans({
            en: (
              <span>
                Rules and the MCP server are kept apart on purpose. <code>create-workspace</code> installs both.
              </span>
            ),
            ko: (
              <span>
                규칙과 MCP 서버는 일부러 나눠 두었습니다. <code>create-workspace</code>는 둘 다 설치합니다.
              </span>
            ),
          })}
        </div>
        <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
          {splitCards.map(({ title, desc, chip }) => (
            <div key={chip} className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="mb-1 font-semibold text-primary">{title}</div>
              <div className="text-foreground/70 text-sm">{desc}</div>
              <code className="mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs">
                {chip}
              </code>
            </div>
          ))}
        </div>

        <Docs.SubSubTitle>{l.trans({ en: "Related Pages", ko: "관련 페이지" })}</Docs.SubSubTitle>
        <Docs.LinkGrid
          items={[
            {
              href: "/references/cli/workspace#create-workspace",
              title: "create-workspace",
              desc: l.trans({
                en: "`--agent-install` writes these files while it creates the workspace.",
                ko: "`--agent-install`이 워크스페이스를 만들면서 이 파일들을 씁니다.",
              }),
            },
            {
              href: "/references/cli/context#mcp-install",
              title: "mcp-install",
              desc: l.trans({
                en: "Registers the Akan MCP server for Cursor, Claude Code and Codex.",
                ko: "Cursor, Claude Code, Codex에 Akan MCP 서버를 등록합니다.",
              }),
            },
            {
              href: "/references/cli/context#doctor-checks",
              title: l.trans({ en: "doctor checks", ko: "doctor 점검 항목" }),
              desc: l.trans({
                en: "What `agent-guide-stale` and `agent-guide-unstamped` mean.",
                ko: "`agent-guide-stale`과 `agent-guide-unstamped`의 뜻을 설명합니다.",
              }),
            },
            {
              href: "/references/cli/guideline",
              title: "guideline",
              desc: l.trans({
                en: "Prints the deeper guides that `AGENTS.md` points to.",
                ko: "`AGENTS.md`가 가리키는 심화 가이드를 출력합니다.",
              }),
            },
          ]}
        />
      </Scroll.Slide>
      <Divider />
      {commands.map((command) => (
        <CommandReferenceSlide key={command.name} command={command} />
      ))}
      <DocsToc />
    </Scroll>
  );
});
