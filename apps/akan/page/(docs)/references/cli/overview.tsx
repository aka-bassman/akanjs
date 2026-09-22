import { usePage } from "@apps/akan/client";
import { cardGridRecipe, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();

  const cliGroups = [
    {
      title: "Workspace",
      href: "/references/cli/workspace",
      commands: [
        "create-workspace <workspaceName> --app <app>",
        "lint <target>",
        "lint-all",
        "sync-all",
        "subspace <action> [name]",
      ],
      desc: l.trans({
        en: "Create a workspace and keep repository-wide generated surfaces synchronized.",
        ko: "workspace를 생성하고 repository 전체 generated surface를 동기화합니다.",
      }),
    },
    {
      title: "Application",
      href: "/references/cli/application",
      commands: [
        "create-application <appName>",
        "remove-application <app>",
        "sync <system>",
        "script <app> [filename]",
        "console <app>",
        "logs <app>",
        "build <app>",
        "typecheck <app>",
        "test <target>",
        "build-ios <app>",
        "build-android <app>",
        "start <app>",
        "start-ios <app>",
        "start-android <app>",
        "release-ios <app>",
        "release-android <app>",
        "release-source <app>",
        "codepush <app>",
        "dbup",
        "dbdown",
        "configure-app <app>",
      ],
      desc: l.trans({
        en: "Manage app lifecycle work from local development to mobile release and database helpers.",
        ko: "local development부터 mobile release, database helper까지 app lifecycle 작업을 관리합니다.",
      }),
    },
    {
      title: "Library",
      href: "/references/cli/library",
      commands: [
        "create-library <libName>",
        "remove-library <lib>",
        "sync-library <lib>",
        "install-library <libName>",
        "library-status",
      ],
      desc: l.trans({
        en: "Create, install, remove, and sync shared libraries used by apps.",
        ko: "app이 사용하는 shared library를 생성, 설치, 삭제, 동기화합니다.",
      }),
    },
    {
      title: "Package",
      href: "/references/cli/package",
      commands: [
        "version",
        "create-package --name <name>",
        "remove-package <pkg>",
        "sync-package <pkg>",
        "build-package <pkg>",
        "verify-dist-package <pkg>",
      ],
      desc: l.trans({
        en: "Manage framework/tooling packages under pkgs/akanjs.",
        ko: "pkgs/akanjs 아래 framework/tooling package를 관리합니다.",
      }),
    },
    {
      title: "Module",
      href: "/references/cli/module",
      commands: [
        "create-module <moduleName>",
        "create-service <serviceName>",
        "remove-module <module>",
        "create-view <module>",
        "create-unit <module>",
        "create-template <module>",
      ],
      desc: l.trans({
        en: "Generate database modules, service modules, and optional module UI companion files.",
        ko: "database module, service module, 그리고 선택적인 module UI companion file을 생성합니다.",
      }),
    },
    {
      title: "Scalar",
      href: "/references/cli/scalar",
      commands: ["create-scalar <scalarName>", "remove-scalar <scalarName>"],
      desc: l.trans({
        en: "Create reusable value types that are not database-backed document models.",
        ko: "database-backed document model이 아닌 reusable value type을 생성합니다.",
      }),
    },
    {
      title: "Page",
      href: "/references/cli/page",
      commands: ["create-crud-page <app> <module>"],
      desc: l.trans({
        en: "Generate CRUD page routes for an existing module inside an app.",
        ko: "app 안의 기존 module을 위한 CRUD page route를 생성합니다.",
      }),
    },
    {
      title: "Primitive",
      href: "/references/cli/primitive",
      commands: ["create-ui --module <module>", "add-field --field <field>", "add-enum-field --values <a,b,c>"],
      desc: l.trans({
        en: "Scaffold into a module that already exists: one UI surface, one field, or one enum field.",
        ko: "이미 존재하는 module에 scaffold합니다. UI surface 하나, field 하나, enum field 하나입니다.",
      }),
    },
    {
      title: "Workflow",
      href: "/references/cli/workflow",
      commands: [
        "workflow list",
        "workflow explain <name>",
        "workflow plan <name> --out <path>",
        "workflow apply <planPath>",
        "workflow validate <runId>",
        "workflow report <runId>",
        "repair <kind>",
      ],
      desc: l.trans({
        en: "Plan a change, read the plan, apply it, validate what it did, and repair what validation caught.",
        ko: "변경을 계획하고, 계획을 읽고, 적용하고, 결과를 검증하고, 검증이 잡아낸 것을 repair합니다.",
      }),
    },
    {
      title: "Quality",
      href: "/references/cli/quality",
      commands: ["quality scan", "quality ssr", "quality ssr --format json"],
      desc: l.trans({
        en: "Report code quality warnings across every app and lib, and measure the server render share per scope.",
        ko: "모든 app과 lib의 code quality warning을 보고하고, scope별 server render share를 측정합니다.",
      }),
    },
    {
      title: "Validation",
      href: "/references/cli/application",
      commands: [
        "sync <app-or-lib>",
        "lint <app-or-lib-or-pkg>",
        "typecheck <app>",
        "test <app-or-lib-or-pkg>",
        "build <app>",
        "doctor --strict --format json",
        "quality scan",
      ],
      desc: l.trans({
        en: "The order the agent guide prescribes, in one place: sync, lint, typecheck, test, build. `doctor` reports convention drift and `quality` measures code shape; neither is a gate, and both are worth reading before a review.",
        ko: "agent guide가 규정하는 순서를 한곳에 모았습니다. sync, lint, typecheck, test, build. `doctor`는 convention 이탈을, `quality`는 code 형태를 보고합니다. 둘 다 gate는 아니지만 review 전에 읽어둘 만합니다.",
      }),
    },
    {
      title: "Cloud",
      href: "/references/cli/cloud",
      commands: ["login", "logout", "update", "download-env", "upload-env"],
      desc: l.trans({
        en: "Configure optional cloud authentication, environment transfer, and framework updates.",
        ko: "선택적인 cloud authentication, environment 전송, framework update를 설정합니다.",
      }),
    },
    {
      title: "Tunnel",
      href: "/references/cli/tunnel",
      commands: ["tunnel [app]", "tunnel --list", "tunnel --stop <code>"],
      desc: l.trans({
        en: "Share a locally running app on a public URL, as a standalone command rather than part of a dev session.",
        ko: "local에서 돌고 있는 app을 public URL로 공유합니다. dev session의 일부가 아니라 독립 command입니다.",
      }),
    },
    {
      title: "Code Agent",
      href: "/references/cli/code",
      commands: ["code [prompt]", "code --profile review", "code --resume <session-id>"],
      desc: l.trans({
        en: "Run the Akan coding agent in the terminal, carrying the workspace's own tools and skills.",
        ko: "workspace의 tool과 skill을 지닌 Akan coding agent를 terminal에서 실행합니다.",
      }),
    },
    {
      title: "Agent Tooling",
      href: "/references/cli/context",
      commands: [
        "context --format json",
        "doctor --format json",
        "guideline list",
        "guideline show framework",
        "agent install cursor",
        "mcp --mode plan",
      ],
      desc: l.trans({
        en: "Expose workspace context, module abstracts, diagnostics, guideline instructions, agent rules, and the MCP tools, whose reach is set per run by --mode.",
        ko: "workspace context, module abstract, diagnostic, guideline instruction, agent rule과 MCP tool을 제공합니다. MCP tool의 범위는 실행할 때 --mode로 정합니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="cli-commands" title={l.trans({ en: "CLI Commands", ko: "CLI 명령" })}>
        <Docs.Title>{l.trans({ en: "CLI Commands", ko: "CLI 명령" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The Akan CLI manages the whole workspace lifecycle: workspace creation, app development, generated code, libraries, packages, modules, scalars, pages, mobile builds, local databases, and optional cloud helpers.",
              ko: "Akan CLI는 workspace 생성, app development, generated code, library, package, module, scalar, page, mobile build, local database, optional cloud helper까지 workspace lifecycle 전체를 관리합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "This overview is a command index. Open the matching detail page for command-specific argument tables, option tables, notes, and terminal examples.",
              ko: "이 overview는 command index입니다. command별 argument 표, option 표, notes, terminal example은 해당 detail page에서 확인하세요.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="shared-behaviour" title={l.trans({ en: "Shared Behaviour", ko: "공통 동작" })}>
        <Docs.Title>{l.trans({ en: "Shared Behaviour", ko: "공통 동작" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Three things hold for every command and are not repeated on the detail pages.",
              ko: "모든 command에 공통으로 적용되며 detail page에서는 반복하지 않는 세 가지입니다.",
            })}
          </div>
        </Docs.Description>
        <div className="my-4 space-y-3">
          <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-primary">🔍</span>
              <strong className="text-primary">-v, --verbose</strong>
            </div>
            <div className="text-foreground/70 text-sm">
              {l.trans({
                en: "Registered on every command. It turns on the executor's verbose output, so each spawned process and its arguments are printed as they run.",
                ko: "모든 command에 등록되어 있습니다. executor의 verbose 출력을 켜서 실행되는 process와 그 argument를 그대로 출력합니다.",
              })}
            </div>
          </div>
          <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-primary">🔡</span>
              <strong className="text-primary">{"--kebab-case"}</strong>
            </div>
            <div className="text-foreground/70 text-sm">
              {l.trans({
                en: "An option declared as `allowLocalRelease` is registered as `--allow-local-release`. The camelCase spelling is the name in the source, never the flag you type.",
                ko: "`allowLocalRelease`로 선언한 option은 `--allow-local-release`로 등록됩니다. camelCase는 source의 이름일 뿐 입력하는 flag가 아닙니다.",
              })}
            </div>
          </div>
          <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-primary">⌨️</span>
              <strong className="text-primary">{"akan <initials>"}</strong>
            </div>
            <div className="text-foreground/70 text-sm">
              {l.trans({
                en: "A command that declares a short alias also answers to the first letter of each dashed word: `akan ba` is `akan build-android`. A required argument left off the line is asked for rather than defaulted.",
                ko: "short alias를 선언한 command는 dash로 나뉜 각 단어의 첫 글자로도 실행됩니다. `akan ba`는 `akan build-android`입니다. 필수 argument를 생략하면 기본값을 고르지 않고 물어봅니다.",
              })}
            </div>
          </div>
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="command-index" title={l.trans({ en: "Command Index", ko: "Command index" })}>
        <Docs.Title>{l.trans({ en: "Command Index", ko: "Command index" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Each CLI group mirrors a command declaration under `pkgs/@akanjs/cli`. Internal or development-only commands are intentionally skipped from public docs.",
              ko: "각 CLI group은 `pkgs/@akanjs/cli` 아래 command 선언과 대응합니다. internal 또는 development-only command는 public docs에서 의도적으로 제외합니다.",
            })}
          </div>
        </Docs.Description>
        <div className={cardGridRecipe()}>
          {cliGroups.map(({ title, href, commands, desc }) => (
            <Link key={title} href={href} className={panelRecipe({}, "hover:border-primary")}>
              <div className="font-bold text-foreground">{title}</div>
              <div className="mt-2 space-y-1">
                {commands.map((command) => (
                  <div key={command} className="font-mono text-foreground/70">
                    akan {command}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-foreground/70">{desc}</div>
            </Link>
          ))}
        </div>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
