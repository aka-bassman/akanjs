import { usePage } from "@apps/akan/client";
import { type CommandReferenceItem, CommandReferenceSlide, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";

export default function Page() {
  const { l } = usePage();

  const commands: CommandReferenceItem[] = [
    {
      name: "create-workspace",
      signature:
        "akan create-workspace <workspaceName> --app <app> [--dir <dir>] [--libs <boolean>] [--tag <tag>] [--init <boolean>]",
      desc: l.trans({
        en: "Create a new Akan.js workspace and optionally bootstrap the first application in the same step.\nThe command normalizes names to lowercase kebab-case and uses the selected update tag, install-lib choice, and initialization flag to prepare the repository.",
        ko: "새 Akan.js workspace를 만들고 같은 단계에서 첫 application까지 bootstrap할 수 있습니다.\n이 명령은 이름을 lowercase kebab-case로 정규화하고 선택한 update tag, library 설치 여부, initialization flag로 repository를 준비합니다.",
      }),
      args: [
        {
          name: "workspaceName",
          type: "String",
          required: "yes",
          defaultValue: "-",
          desc: "Organization/workspace name. Normalized to lowercase kebab-case.",
        },
      ],
      options: [
        {
          name: "--app",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "-",
          desc: "Codename of the first application. Normalized to lowercase kebab-case.",
        },
        {
          name: "--dir",
          type: "String",
          defaultValue: "local when USE_AKANJS_PKGS=true, otherwise .",
          enumOrFlag: "-",
          desc: "Directory where the workspace is created.",
        },
        {
          name: "--libs",
          type: "Boolean",
          defaultValue: "-",
          enumOrFlag: "false | true",
          desc: "Install shared and util libraries.",
        },
        {
          name: "--tag",
          type: "String",
          defaultValue: "latest",
          enumOrFlag: "latest | dev | canary | beta | rc | alpha",
          desc: "Akan.js update tag used while creating the workspace.",
        },
        {
          name: "--init",
          type: "Boolean",
          defaultValue: "true",
          enumOrFlag: "-",
          desc: "Initialize the workspace after creation.",
        },
      ],
      notes: [
        { name: "runsOnWorkspaceRoot", desc: "false" },
        {
          name: "script",
          desc: "workspaceScript.createWorkspace(workspaceName, app, { dirname, installLibs, tag, init })",
        },
      ],
      examples: `akan create-workspace acme --app shop
akan create-workspace acme --app shop --dir ./acme --tag latest --init true
akan create-workspace acme --app shop --libs false`,
    },
    {
      name: "lint",
      signature: "akan lint <target> [--fix <boolean>]",
      desc: l.trans({
        en: "Run lint and formatting for a selected app, library, or package target.\n`--fix` defaults to true, so the command applies formatter/linter fixes unless the option is explicitly disabled.",
        ko: "선택한 app, library, package target에 lint와 formatting을 실행합니다.\n`--fix` 기본값은 true이므로 option을 명시적으로 끄지 않으면 formatter/linter fix를 적용합니다.",
      }),
      options: [
        {
          name: "--fix",
          type: "Boolean",
          defaultValue: "true",
          enumOrFlag: "-",
          desc: "Apply formatter/lint fixes.",
        },
      ],
      examples: `akan lint myapp
akan lint util --fix false`,
    },
    {
      name: "lint-all",
      signature: "akan lint-all [--fix <boolean>]",
      desc: l.trans({
        en: "Run lint and formatting across the workspace instead of a single selected target.\nUse it before broader verification when generated surfaces, app code, and shared libraries should be checked together.",
        ko: "단일 target이 아니라 workspace 전체 범위에 lint와 formatting을 실행합니다.\ngenerated surface, app code, shared library를 함께 확인해야 하는 넓은 검증 전에 사용합니다.",
      }),
      options: [
        {
          name: "--fix",
          type: "Boolean",
          defaultValue: "true",
          enumOrFlag: "-",
          desc: "Apply formatter/lint fixes.",
        },
      ],
      examples: `akan lint-all
akan lint-all --fix false`,
    },
    {
      name: "sync-all",
      signature: "akan sync-all",
      desc: l.trans({
        en: "Refresh dependency and configuration surfaces for every app and library in the workspace.\nUse it when generated configuration looks stale or after changes that affect shared workspace setup.",
        ko: "workspace의 모든 app과 library dependency/configuration surface를 갱신합니다.\ngenerated configuration이 오래되었거나 shared workspace setup에 영향을 주는 변경 뒤에 사용합니다.",
      }),
      examples: "akan sync-all",
    },
    {
      name: "subspace",
      signature: "akan subspace <status|status-all|diff|push|push-all|pull> [name] [--format <text|json>]",
      desc: "Mirror apps and libraries between this workspace and the customer repos (subspaces) it serves, declared in `akan.subspace.ts` at the workspace root.\nThe branch is the unit of uniformity: whichever branch the workspace is on is the branch every subspace receives, so one branch holds one akanjs version and one copy of the library source everywhere. Only the branches `akan.subspace.ts` lists are pushable.\nPush is a squashed snapshot of the workspace's git-tracked files, so a subspace's history never carries the workspace's and one customer's commit messages never reach another's repo. The root manifest is rebuilt from the apps that subspace actually serves, keeping the workspace's exact version specs, so no other customer's dependency tree is installed there. Libraries are push-only: pull applies the subspace's app commits and reports its library edits as a patch instead, because the workspace is the one copy every other subspace is pushed from.\nPull compares the subspace against the last push it received — located by the `akan.subspace.json` only a push writes — rather than against the workspace, so the diff is exactly the customer's own work however far the workspace has moved on. It lands uncommitted in the working tree for a person to review.\nEnvironment values under `env/` are subspace-owned in both directions and are never overwritten or pulled.",
      args: [
        {
          name: "action",
          type: "String",
          required: "no",
          defaultValue: "status",
          desc: "status, status-all, diff, push, push-all, or pull. status and push ask which subspaces to act on when no name is given; the -all forms take every declared subspace and accept no name.",
        },
        {
          name: "name",
          type: "String",
          required: "no",
          defaultValue: "-",
          desc: "Subspace name. When omitted the command asks: a multi-select for status and push, a single choice for diff and pull, which are reviewed one repo at a time. Without a terminal to ask in, pass a name or use status-all / push-all.",
        },
        {
          name: "--format",
          type: "String",
          required: "no",
          defaultValue: "text",
          desc: "Output format: text or json.",
        },
        {
          name: "--verify",
          type: "Boolean",
          required: "no",
          defaultValue: "true",
          desc: "Run bun install and akan sync inside the subspace before committing.",
        },
        {
          name: "--adopt-libs",
          type: "Boolean",
          required: "no",
          defaultValue: "false",
          desc: "pull only: also apply the subspace's library edits instead of reporting them as a patch.",
        },
        {
          name: "--path",
          type: "String",
          required: "no",
          defaultValue: "-",
          desc: "diff only: limit the comparison to one path.",
        },
      ],
      examples: `akan subspace status
akan subspace status-all
akan subspace diff acme
akan subspace push
akan subspace push acme
akan subspace push-all
akan subspace pull acme
akan subspace pull acme --adopt-libs`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="workspace-cli" title={l.trans({ en: "Workspace CLI", ko: "Workspace CLI" })}>
        <Docs.Title>{l.trans({ en: "Workspace CLI", ko: "Workspace CLI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Workspace commands create a new Akan.js workspace and keep the whole repository synchronized. Use them when you are starting a project, fixing generated surfaces, or applying lint across apps and libraries.",
              ko: "Workspace command는 새 Akan.js workspace를 만들고 repository 전체를 동기화합니다. 프로젝트를 시작하거나 generated surface를 정리하거나 app/library 전체에 lint를 적용할 때 사용합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The commands below come from `workspace.command.ts` — `create-workspace`, `lint`, `lint-all`, `sync-all` — plus `fleet`, which mirrors this workspace out to the customer repos it serves.",
              ko: "아래 명령은 `workspace.command.ts`의 `create-workspace`, `lint`, `lint-all`, `sync-all`, 그리고 이 workspace를 고객사 repo로 미러링하는 `fleet`입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      {commands.map((command) => (
        <CommandReferenceSlide key={command.name} command={command} />
      ))}
      <DocsToc />
    </Scroll>
  );
}
