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
      name: "code",
      signature:
        "akan code [prompt] [--app <app>] [--profile <local|pod|review|web>] [--model <provider/id>] [--json <boolean>] [--thinking <boolean>] [--rpc <boolean>] [--resume <id>] [--interactive <boolean>]",
      desc: l.trans({
        en: "Run the Akan coding agent on a prompt.\nIt is a coding agent that already knows this workspace: the Akan workflow, context, and self-verification tools are wired in, and the akan skill set describes the scaffolding chain, the store surface, and the validation loop.\nOne command, three hosts. Which one runs is decided from the arguments, not from a subcommand.",
        ko: "prompt를 받아 Akan coding agent를 실행합니다.\n이 workspace를 이미 아는 coding agent입니다. Akan workflow, context, self-verification tool이 연결되어 있고, akan skill set이 scaffolding chain, store surface, validation loop을 설명합니다.\ncommand 하나에 host 셋입니다. 어느 것이 실행될지는 subcommand가 아니라 argument로 결정됩니다.",
      }),
      args: [
        {
          name: "prompt",
          type: "String",
          required: "no",
          defaultValue: "-",
          desc: "What the agent should do. Left off with a terminal attached, the full-screen session opens instead; left off with no terminal and no --json, the command errors rather than waiting.",
        },
      ],
      options: [
        {
          name: "--app",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Narrow the agent to one app: its root becomes `apps/<app>` and only that app is in scope. Without it the whole repo is.",
        },
        {
          name: "--profile",
          type: "String",
          defaultValue: "local",
          enumOrFlag: "local | pod | review | web",
          desc: "What the agent is allowed to be. An unknown name is refused by name rather than falling back.",
        },
        {
          name: "--model",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "`<provider>/<id>`, for example `deepseek/deepseek-v4-flash`. A value with no slash is refused. Left off, the default model is used when its credential is configured, and otherwise the first available one.",
        },
        {
          name: "--json",
          type: "Boolean",
          defaultValue: "false",
          enumOrFlag: "-",
          desc: "Print one event per line as JSON. A pipe asking for frames has no terminal to draw on, so this also rules the full-screen session out.",
        },
        {
          name: "--thinking",
          type: "Boolean",
          defaultValue: "false",
          enumOrFlag: "-",
          desc: "Print the model's reasoning alongside its output.",
        },
        {
          name: "--rpc",
          type: "Boolean",
          defaultValue: "false",
          enumOrFlag: "-",
          desc: "Serve the agent over stdio as akan wire frames for another process to drive. It takes precedence over every other host.",
        },
        {
          name: "--resume",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable · flag: -R",
          desc: "Continue a stored session by id. The short flag is -R because -r already belongs to --rpc, and the derived one would have collided.",
        },
        {
          name: "--interactive",
          type: "Boolean",
          defaultValue: "false",
          enumOrFlag: "flag: -i",
          desc: "Open the full-screen session even when a prompt is given, seeding it with that prompt.",
        },
      ],
      notes: [
        {
          name: "which host runs",
          desc: "`--rpc` first. Then the full-screen session, when `--interactive` is set or when there is no prompt, no `--json`, and stdout is a terminal. Otherwise one prompt is run to completion and the event stream is printed.",
        },
        {
          name: "session switching",
          desc: "Switching sessions inside the full-screen host rebuilds the agent rather than re-pointing it: the engine binds its extensions, tools, and context at construction, so half of what a session is would stay behind.",
        },
        {
          name: "resume id",
          desc: "A session that held a conversation prints the exact line to bring it back on the way out: `Resume this session with: akan code --resume <id>`. A session with nothing in it prints none, because an id for one is an invitation to resume nothing.",
        },
        {
          name: "denied paths",
          desc: "`**/.env`, `**/.env.*`, `**/secrets/**`, `**/*.pem`, and `**/*.key` are refused by every profile, whatever its allowlist says.",
        },
        {
          name: "load cost",
          desc: "The engine is imported by the command rather than at module load, because `akan --help` loads every command module and the engine alone costs over a hundred megabytes resident.",
        },
      ],
      examples: `akan code
akan code "add a comment module to koyo"
akan code --app koyo
akan code "review the order flow" --profile review
akan code "add a topping field" --model deepseek/deepseek-v4-flash --thinking true
akan code --resume <session-id>
akan code "summarize the diff" --json true
akan code --rpc true`,
    },
  ];

  const profiles: IntroItem[] = [
    {
      name: "local",
      desc: "The default. Every builtin tool, the akan tools, MCP discovery on, web fetch and search on, approval never asked, sessions stored to file and reachable across runs. It trusts the machine it is running on, because you are on it.",
    },
    {
      name: "pod",
      desc: "An isolated container. Everything is on because the container is the boundary, but nobody is watching: questions and approvals suspend the turn instead of waiting, and MCP is off because a pod's egress goes through a proxy and a stdio server started inside it is a process nobody vetted.",
    },
    {
      name: "review",
      desc: "Read, ls, grep, and find — nothing that writes. No MCP, no web, sessions in memory only, and no `AGENTS.md` in the window, because a reviewer that changes nothing does not need the project's ~26k tokens of instruction.",
    },
    {
      name: "web",
      desc: "The same reach as local, but approval is asked for every write and both interactions suspend rather than block. Isolation and approval are different axes: a sandbox can be safe and its user may still want to be asked.",
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="code-cli" title={l.trans({ en: "Code CLI", ko: "Code CLI" })}>
        <Docs.Title>{l.trans({ en: "Code CLI", ko: "Code CLI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "You want an agent to add a field and run the validation loop, in this repo, tonight — without opening an editor, configuring an MCP client, or explaining the module conventions to it first.",
              ko: "오늘 밤 이 repo에서 agent가 field를 더하고 validation loop을 돌려주기를 원합니다. editor를 열지도, MCP client를 설정하지도, module convention을 먼저 설명하지도 않고요.",
            })}
          </div>
          <div>
            {l.trans({
              en: "That is what this command is. It is not the MCP server, which lets an editor's agent reach this workspace; it is not `akan agent install`, which writes the rule files those agents read. It is an agent of its own, in your terminal, already carrying both.",
              ko: "이 command가 바로 그것입니다. editor의 agent가 이 workspace에 닿게 해주는 MCP server가 아니고, 그 agent들이 읽는 rule file을 쓰는 `akan agent install`도 아닙니다. 그 둘을 이미 지닌 채 terminal에서 도는 그 자체의 agent입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      {commands.map((command) => (
        <CommandReferenceSlide key={command.name} command={command} />
      ))}
      <Divider />

      <Scroll.Slide id="code-profiles" title={l.trans({ en: "Profiles", ko: "Profile" })}>
        <Docs.Title>{l.trans({ en: "Profiles", ko: "Profile" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A profile is what the agent is allowed to be, as one value: which tools are built, whether it asks before writing, where a session is stored, and how much of the project it carries in its window.",
              ko: "profile은 agent가 무엇일 수 있는지를 한 값으로 묶은 것입니다. 어떤 tool이 만들어지는지, 쓰기 전에 묻는지, session이 어디에 저장되는지, project의 얼마를 window에 지니는지를 정합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Most of it is applied when the agent is assembled: a tool outside the profile is never constructed, so the model cannot call it and it costs no prompt tokens either.",
              ko: "대부분은 agent를 조립할 때 적용됩니다. profile 밖의 tool은 애초에 만들어지지 않으므로 model이 호출할 수도 없고 prompt token도 들지 않습니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.IntroTable type={l.trans({ en: "Profile", ko: "Profile" })} items={profiles} />
        <div className={panelRecipe({ radius: "lg", padding: "sm" }, "my-4")}>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-primary">🧭</span>
            <strong className="text-primary">{"--app"}</strong>
          </div>
          <div className="text-foreground/70 text-sm">
            {l.trans({
              en: "Naming an app moves the profile's root to that app's folder, which is a narrower boundary than a prompt that politely asks the agent to stay there.",
              ko: "app을 지정하면 profile의 root가 그 app 폴더로 옮겨집니다. agent에게 거기 머물러 달라고 정중히 부탁하는 prompt보다 좁은 경계입니다.",
            })}
          </div>
        </div>
        <div className="my-4 text-foreground/70 text-sm">
          {l.trans({
            en: (
              <span>
                For the agent that runs inside a rendered page instead of a terminal, see{" "}
                <Link href="/docs/arch/agentic" className="text-primary underline">
                  Architecture · Agentic
                </Link>
                . For the rule files an editor's agent reads, see{" "}
                <Link href="/references/cli/agent" className="text-primary underline">
                  Agent
                </Link>
                .
              </span>
            ),
            ko: (
              <span>
                terminal이 아니라 rendering된 page 안에서 도는 agent는{" "}
                <Link href="/docs/arch/agentic" className="text-primary underline">
                  Architecture · Agentic
                </Link>
                을, editor의 agent가 읽는 rule file은{" "}
                <Link href="/references/cli/agent" className="text-primary underline">
                  Agent
                </Link>
                를 보세요.
              </span>
            ),
          })}
        </div>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
