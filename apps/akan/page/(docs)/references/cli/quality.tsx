import { usePage } from "@apps/akan/client";
import {
  type CommandReferenceItem,
  CommandReferenceSlide,
  Divider,
  Docs,
  DocsToc,
  type IntroItem,
  panelRecipe,
} from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();

  const commands: CommandReferenceItem[] = [
    {
      name: "quality",
      signature: "akan quality [action] [--format <text|json>]",
      desc: l.trans({
        en: "Scan every app and library for Akan code quality warnings, or measure the server/client render balance.\nIt reports and never fails: the command exits successfully whatever it finds, so a scan can run beside lint and typecheck without becoming a third gate.\nBoth actions run the same scan. `ssr` keeps only the warnings whose scope is `ssr` and leads with the server render share.",
        ko: "모든 app과 library를 훑어 Akan code quality warning을 보고하거나 server/client render 비율을 측정합니다.\n보고만 할 뿐 실패시키지 않습니다. 무엇을 찾든 정상 종료하므로 lint, typecheck 옆에서 또 하나의 gate가 되지 않고 함께 돌릴 수 있습니다.\n두 action은 같은 scan을 돌립니다. `ssr`은 scope가 `ssr`인 warning만 남기고 server render share를 먼저 출력합니다.",
      }),
      args: [
        {
          name: "action",
          type: "String",
          required: "no",
          defaultValue: "scan",
          desc: "Which measurement to run: scan or ssr.",
        },
      ],
      options: [
        {
          name: "--format",
          type: "String",
          defaultValue: "text",
          enumOrFlag: "text | json",
          desc: "Output format. `json` prints the whole result object, including the per-warning `fix` text, for a CI job or an agent loop.",
        },
      ],
      notes: [
        {
          name: "what is read",
          desc: "Every `.ts` and `.tsx` file under `apps/` and `libs/` except `.d.ts`, plus every `*.abstract.md`. `.gitignore` is honored, so generated and ignored trees are never counted.",
        },
        {
          name: "fix line",
          desc: "Each warning carries a `fix:` line naming the remediation, in both text and JSON output. A rule is not just a complaint about a file.",
        },
        {
          name: "scanned files",
          desc: "The header count is the whole walk. The SSR balance underneath is measured over a much smaller subset, so the two numbers never match and are not meant to.",
        },
        {
          name: "suggested rules",
          desc: "`scan` closes with a list of conventions the scanner recommends but does not yet enforce. They are advisory reading, not findings.",
        },
      ],
      examples: `akan quality
akan quality scan
akan quality ssr
akan quality ssr --format json`,
    },
  ];

  const scopes: IntroItem[] = [
    {
      name: "global",
      desc: "Two exported functions with the same name, or two with the same body, anywhere in the workspace.",
    },
    {
      name: "file",
      desc: "File length, placeholder exports in a generated index, scaffold text left in a dictionary, a `//!` marker in browser-reachable code, global/`Window`/prototype mutation outside an approved integration file, and a component file exporting something that is not a component.",
    },
    {
      name: "convention",
      desc: "A declaration that belongs in another module file — logic in `.constant.ts`, persistence in `.service.ts`, and the rest of the `constant / dictionary / document / service / signal / store` split.",
    },
    {
      name: "layout",
      desc: "An app or lib root file or folder outside the allowlist, a stray file in a `lib/` facet root, and a module UI filename that is not one of the allowed roles.",
    },
    {
      name: "agent",
      desc: "A form setter wrapped in a pass-through arrow, which silently publishes no agent tool for the field.",
    },
    {
      name: "ssr",
      desc: "The six render-balance rules below, and the only ones `akan quality ssr` keeps.",
    },
  ];

  const ssrRules: IntroItem[] = [
    {
      name: "akan.ssr.unnecessary-use-client",
      desc: "The directive is there and nothing in the file needs it. Delete it.",
    },
    {
      name: "akan.ssr.client-static-component",
      desc: "A component in a client file renders real markup with zero client-only capability — server work sitting in the bundle.",
    },
    {
      name: "akan.ssr.client-static-markup",
      desc: "A large subtree wraps one or two interactive touches. Interaction stays client, markup goes server.",
    },
    {
      name: "akan.ssr.client-mount-load",
      desc: "A mount-time effect loads server data the route could have fetched before the first byte.",
    },
    {
      name: "akan.ssr.module-missing-server-view",
      desc: "A module renders only from Template/Zone/Util and has no Unit or View at all.",
    },
    {
      name: "akan.ssr.template-client-state",
      desc: "A Template holds form state in `useState` instead of the store.",
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="quality-cli" title={l.trans({ en: "Quality CLI", ko: "Quality CLI" })}>
        <Docs.Title>{l.trans({ en: "Quality CLI", ko: "Quality CLI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Lint tells you a line is wrong. This command tells you the shape of the codebase is drifting: a file that grew past what one reader can hold, a module whose UI never got a server surface, a page that moved its markup into the bundle. None of that is a syntax error, and none of it shows up until somebody measures.",
              ko: "lint은 한 줄이 틀렸다고 알려줍니다. 이 command는 codebase의 형태가 흘러가고 있다고 알려줍니다. 한 사람이 담아둘 수 없을 만큼 커진 file, server surface가 끝내 생기지 않은 module, markup을 bundle로 옮겨버린 page 같은 것들입니다. 어느 것도 syntax error가 아니고, 누군가 측정하기 전에는 드러나지 않습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Reach for it before a review, after a refactor, and whenever a change touched `.tsx` files — the render balance is the one number a UI change can quietly cost you.",
              ko: "review 전에, refactor 후에, 그리고 `.tsx` file을 건드린 변경마다 사용하세요. render balance는 UI 변경이 조용히 앗아갈 수 있는 유일한 숫자입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      {commands.map((command) => (
        <CommandReferenceSlide key={command.name} command={command} />
      ))}
      <Divider />

      <Scroll.Slide id="scan-scopes" title={l.trans({ en: "What Scan Reports", ko: "scan이 보고하는 것" })}>
        <Docs.Title>{l.trans({ en: "What Scan Reports", ko: "scan이 보고하는 것" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every warning carries a scope, and the scope is the fastest way to read a long result. These are all six, in the order they appear in the output.",
              ko: "모든 warning은 scope를 가지며, 긴 결과를 읽는 가장 빠른 길이 scope입니다. 출력에 나타나는 순서대로 여섯 가지 전부입니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.IntroTable type={l.trans({ en: "Scope", ko: "Scope" })} items={scopes} />
        <div className={panelRecipe({ radius: "lg", padding: "sm" }, "my-4")}>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-primary">📐</span>
            <strong className="text-primary">{"akan quality scan"}</strong>
          </div>
          <div className="text-foreground/70 text-sm">
            {l.trans({
              en: "The text output ends with the SSR balance and the suggested-rules list, so a plain `akan quality` already answers both questions. `akan quality ssr` exists for the times you only want the second one.",
              ko: "text 출력은 SSR balance와 suggested rule 목록으로 끝나므로, 그냥 `akan quality`만 실행해도 두 질문에 모두 답합니다. `akan quality ssr`은 두 번째만 보고 싶을 때를 위해 있습니다.",
            })}
          </div>
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="server-share" title={l.trans({ en: "Server Render Share", ko: "Server render share" })}>
        <Docs.Title>{l.trans({ en: "Server Render Share", ko: "Server render share" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The share is JSX elements rendered on the server over the total, counted per app and per library with a workspace row at the end. Anything under 50% is marked in the output with `<- below the 50% target`.",
              ko: "share는 전체 대비 server에서 rendering되는 JSX element의 비율이며, app별 library별로 세고 마지막에 workspace 행이 붙습니다. 50% 미만은 출력에 `<- below the 50% target`으로 표시됩니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Treat 50% as the floor and a falling share as a regression: if a change moved markup to the client, either say why or move it back.",
              ko: "50%를 바닥으로, 떨어지는 share를 regression으로 다루세요. 변경이 markup을 client로 옮겼다면 이유를 말하거나 되돌려야 합니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.Alert>
          {l.trans({
            en: (
              <span>
                The balance reads only <code>apps|libs/*/ui/**.tsx</code> and <code>apps|libs/*/lib/**.tsx</code>, minus
                tests. <code>page/**</code>, <code>webkit/</code>, <code>srvkit/</code>, and <code>common/</code> are
                excluded, so a docs page or a route file can never move the number — and neither can a{" "}
                <code>use client</code> you added there.
              </span>
            ),
            ko: (
              <span>
                balance는 <code>apps|libs/*/ui/**.tsx</code>와 <code>apps|libs/*/lib/**.tsx</code>만 읽고 test는
                제외합니다. <code>page/**</code>, <code>webkit/</code>, <code>srvkit/</code>, <code>common/</code>은
                대상이 아니므로 docs page나 route file은 이 숫자를 움직일 수 없습니다. 거기에 붙인{" "}
                <code>use client</code>도 마찬가지입니다.
              </span>
            ),
          })}
        </Docs.Alert>
        <Docs.IntroTable type={l.trans({ en: "Rule", ko: "Rule" })} items={ssrRules} />
        <div className="my-4 text-foreground/70 text-sm">
          {l.trans({
            en: (
              <span>
                Each rule is taught with the code that triggers it and the fix that clears it in{" "}
                <Link href="/docs/arch/frontend" className="text-primary underline">
                  Architecture · Frontend
                </Link>
                .
              </span>
            ),
            ko: (
              <span>
                각 rule을 발생시키는 code와 해소하는 수정은{" "}
                <Link href="/docs/arch/frontend" className="text-primary underline">
                  Architecture · Frontend
                </Link>
                에서 다룹니다.
              </span>
            ),
          })}
        </div>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
