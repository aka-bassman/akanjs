import { usePage } from "@apps/akan/client";
import { type CommandReferenceItem, CommandReferenceSlide, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const commands: CommandReferenceItem[] = [
    {
      name: "agent",
      signature: "akan agent install [target] [--force <boolean>]",
      desc: "Install Akan agent rules for editors and coding agents.\nThere is one guide, `AGENTS.md`, and the other two targets are pointers into it: Cursor gets a short `.cursor/rules/akan.mdc` and Claude Code a `CLAUDE.md` that imports `AGENTS.md` with `@AGENTS.md`. So a convention is written once and every agent reads the same copy.\nThe guide's body — workspace shape, the conventions, the recipe index, module abstract rules, generated file boundaries, the MCP workflow policy, validation commands, and the framework guideline — ships inside the package and is re-rendered into a version-stamped `akan:agent` block. Everything outside the markers is yours and is preserved.",
      args: [
        {
          name: "target",
          type: "String",
          required: "no",
          defaultValue: "all",
          desc: "Rule target. Use cursor, agents-md, claude, or all.",
        },
      ],
      options: [
        {
          name: "--force",
          type: "Boolean",
          defaultValue: "false",
          enumOrFlag: "-",
          desc: "Overwrite `.cursor/rules/akan.mdc` and `CLAUDE.md` when they already exist. `AGENTS.md` never needs it, because only its managed block is rewritten.",
        },
      ],
      notes: [
        {
          name: "agents-md",
          desc: "Writes `AGENTS.md`, then lays down the scoped `apps/<app>/AGENTS.md` and `libs/<lib>/AGENTS.md` guides. A scope whose config cannot load yet is skipped and picked up by `akan sync <name>`.",
        },
        { name: "cursor", desc: "Writes `.cursor/rules/akan.mdc`, an alwaysApply rule that points at `AGENTS.md`." },
        { name: "claude", desc: "Writes `CLAUDE.md`, an `@AGENTS.md` import plus the comment rule restated." },
        {
          name: "staleness",
          desc: "Nothing re-renders the block on `bun update`, so `akan doctor` compares its stamp against the installed devkit and reports `agent-guide-stale`, or `agent-guide-unstamped` when there is no stamp at all. The repair it names is `akan agent install agents-md`.",
        },
        {
          name: "abstract rule",
          desc: "The generated block tells agents to read `*.abstract.md` before module behavior changes and update it when public behavior or workflows change.",
        },
      ],
      examples: `akan agent install cursor
akan agent install agents-md
akan agent install claude
akan agent install all --force true`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="agent-cli" title={l.trans({ en: "Agent CLI", ko: "Agent CLI" })}>
        <Docs.Title>{l.trans({ en: "Agent CLI", ko: "Agent CLI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Agent commands install project guidance files for coding assistants. They are intentionally separate from the MCP server: rules are persistent project instructions an agent always carries, while MCP answers live questions and, in apply mode, runs the workflows the rules point at.",
              ko: "Agent command는 coding assistant를 위한 project guidance file을 설치합니다. rule은 agent가 항상 지니는 지속적인 project instruction이고, MCP는 실시간 질의에 답하며 apply mode에서는 rule이 가리키는 workflow까지 실행하므로 둘은 의도적으로 분리되어 있습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Use this after creating a workspace or when you want Cursor, Claude Code, Codex-style agents, and similar tools to follow Akan conventions consistently.",
              ko: "workspace 생성 후 또는 Cursor, Claude Code, Codex 스타일 agent 등이 Akan convention을 일관되게 따르도록 만들고 싶을 때 사용합니다.",
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
