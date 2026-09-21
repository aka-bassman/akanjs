import { usePage } from "@apps/akan/client";
import { type CommandReferenceItem, CommandReferenceSlide, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const commands: CommandReferenceItem[] = [
    {
      name: "create-workspace",
      signature:
        "akan create-workspace <workspaceName> --app <app> [--dir <dir>] [--libs <boolean>] [--init <boolean>] [--registry <url>] [--owner <owner>] [--mcp-install <boolean>] [--agent-install <boolean>]",
      desc: l.trans({
        en: "Create a new Akan.js workspace and bootstrap the first application in the same step.\nThe command normalizes both names to lowercase kebab-case, and the install-lib choice, initialization flag, MCP config, and agent rules are all decided here rather than afterwards.",
        ko: "새 Akan.js workspace를 만들고 같은 단계에서 첫 application까지 bootstrap합니다.\n이 명령은 두 이름을 모두 lowercase kebab-case로 정규화하며, library 설치 여부, initialization flag, MCP config, agent rule을 나중이 아니라 이 시점에 결정합니다.",
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
          defaultValue: "false",
          enumOrFlag: "false | true",
          desc: "Install the shared and util libraries. The default starts from an empty workspace.",
        },
        {
          name: "--init",
          type: "Boolean",
          defaultValue: "true",
          enumOrFlag: "-",
          desc: "Initialize the workspace after creation.",
        },
        {
          name: "--registry",
          type: "String",
          defaultValue: "https://registry.npmjs.org",
          enumOrFlag: "-",
          desc: "npm registry URL used to install the Akan packages. Reads AKAN_NPM_REGISTRY when set.",
        },
        {
          name: "--owner",
          type: "String",
          defaultValue: "$GITHUB_OWNER",
          enumOrFlag: "nullable",
          desc: "Owner of the workspace.",
        },
        {
          name: "--mcp-install",
          type: "Boolean",
          defaultValue: "true",
          enumOrFlag: "-",
          desc: "Install the Akan MCP server config for Cursor, Claude Code, and Codex.",
        },
        {
          name: "--agent-install",
          type: "Boolean",
          defaultValue: "true",
          enumOrFlag: "flag: -A",
          desc: "Install the Akan agent rules: AGENTS.md, CLAUDE.md, and the Cursor pointer.",
        },
      ],
      notes: [
        {
          name: "workspace root",
          desc: "The only command that does not have to run from a workspace root, because it creates one.",
        },
        {
          name: "framework version",
          desc: "This command has no --tag. To move an existing workspace onto another release channel, run `akan update --tag <tag>`.",
        },
      ],
      examples: `akan create-workspace acme --app shop
akan create-workspace acme --app shop --dir ./acme --init true
akan create-workspace acme --app shop --libs false`,
    },
    {
      name: "lint",
      signature: "akan lint <target> [--fix <boolean>] [--max-diagnostics <n>]",
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
        {
          name: "--max-diagnostics",
          type: "Number",
          defaultValue: "200",
          enumOrFlag: "-",
          desc: "How many diagnostics Biome prints before truncating. Pass 0 for no limit.",
        },
      ],
      examples: `akan lint myapp
akan lint util --fix false
akan lint myapp --max-diagnostics 0`,
    },
    {
      name: "lint-all",
      signature: "akan lint-all [--fix <boolean>] [--max-diagnostics <n>]",
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
        {
          name: "--max-diagnostics",
          type: "Number",
          defaultValue: "200",
          enumOrFlag: "-",
          desc: "How many diagnostics Biome prints before truncating. Pass 0 for no limit.",
        },
      ],
      examples: `akan lint-all
akan lint-all --fix false
akan lint-all --max-diagnostics 0`,
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
      signature: "akan subspace <status|status-all|diff|push|push-all|pull|upload-env> [name] [--format <text|json>]",
      desc: "Mirror apps and libraries between this workspace and the customer repos (subspaces) it serves, declared in `akan.subspace.ts` at the workspace root.\nThe branch is the unit of uniformity: whichever branch the workspace is on is the branch every subspace receives, so one branch holds one akanjs version and one copy of the library source everywhere. Only the branches `akan.subspace.ts` lists are pushable.\nPush is a squashed snapshot of the workspace's git-tracked files, so a subspace's history never carries the workspace's and one customer's commit messages never reach another's repo. The root manifest is rebuilt from the apps that subspace actually serves, keeping the workspace's exact version specs, so no other customer's dependency tree is installed there. Libraries are push-only: pull applies the subspace's app commits and reports its library edits as a patch instead, because the workspace is the one copy every other subspace is pushed from.\nPull compares the subspace against the last push it received — located by the `akan.subspace.json` only a push writes — rather than against the workspace, so the diff is exactly the customer's own work however far the workspace has moved on. It lands uncommitted in the working tree for a person to review.\nEnvironment values under `env/` are subspace-owned: push never overwrites them and pull never takes them. `upload-env` is the one deliberate exception and it does not touch the subspace's git repo at all — it archives this workspace's env values for that subspace's slice (its apps and the libraries their closure pulls in, plus those apps' `secrets` globs) and uploads them to the cloud workspace the subspace declares as `workspaceId`, where its own `akan download-env` reads them. The archive is replaced whole, so the command asks before it runs and refuses a subspace that declares no `workspaceId`, or one that declares this workspace's own id.",
      args: [
        {
          name: "action",
          type: "String",
          required: "no",
          defaultValue: "status",
          desc: "status, status-all, diff, push, push-all, pull, or upload-env. status and push ask which subspaces to act on when no name is given; the -all forms take every declared subspace and accept no name. upload-env takes one subspace, like diff and pull.",
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
        {
          name: "--host",
          type: "String",
          required: "no",
          defaultValue: "akan cloud",
          desc: "upload-env only: the cloud host to upload to.",
        },
        {
          name: "-F, --force",
          type: "Boolean",
          required: "no",
          defaultValue: "false",
          desc: "upload-env only: replace the subspace's env archive without asking. Required outside a terminal, where the command refuses rather than assuming yes. (-f is --format and -y is --verify.)",
        },
      ],
      examples: `akan subspace status
akan subspace status-all
akan subspace diff acme
akan subspace push
akan subspace push acme
akan subspace push-all
akan subspace pull acme
akan subspace pull acme --adopt-libs
akan subspace upload-env acme
akan subspace upload-env acme --force`,
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
              en: "The commands below come from `workspace.command.ts` — `create-workspace`, `lint`, `lint-all`, `sync-all` — plus `subspace`, which mirrors this workspace out to the customer repos it serves.",
              ko: "아래 명령은 `workspace.command.ts`의 `create-workspace`, `lint`, `lint-all`, `sync-all`, 그리고 이 workspace를 고객사 repo로 미러링하는 `subspace`입니다.",
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
});
