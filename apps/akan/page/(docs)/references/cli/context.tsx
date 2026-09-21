import { usePage } from "@apps/akan/client";
import { type CommandReferenceItem, CommandReferenceSlide, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const commands: CommandReferenceItem[] = [
    {
      name: "context",
      signature: "akan context [--format <format>] [--app <app>] [--module <module>]",
      desc: "Print agent-readable Akan workspace context.\nUse it when an external coding agent, CI job, or IDE extension needs a structured summary of apps, libraries, packages, modules, generated files, validation commands, and module abstracts.",
      options: [
        {
          name: "--format",
          type: "String",
          defaultValue: "markdown",
          enumOrFlag: "markdown | json",
          desc: "Output format. Use json for tools and markdown for people or chat context.",
        },
        {
          name: "--app",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Limit the context to one app.",
        },
        {
          name: "--module",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Limit module output and include the matching *.abstract.md content first.",
        },
      ],
      notes: [
        {
          name: "abstract exposure",
          desc: "Workspace summaries include abstract metadata only; module-scoped context includes the abstract body.",
        },
        {
          name: "privacy",
          desc: "The context analyzer does not print .env values or secrets.",
        },
      ],
      examples: `akan context
akan context --format json
akan context --app akan
akan context --module user`,
    },
    {
      name: "doctor",
      signature: "akan doctor [--format <format>] [--strict <boolean>] [--ios <boolean>]",
      desc: "Report Akan workspace convention diagnostics.\nUse it before or after agent changes to catch unsupported files, missing module abstracts, and convention drift in machine-readable form.",
      options: [
        {
          name: "--format",
          type: "String",
          defaultValue: "text",
          enumOrFlag: "text | json",
          desc: "Output format. Use json for agent validation loops.",
        },
        {
          name: "--strict",
          type: "Boolean",
          defaultValue: "false",
          enumOrFlag: "-",
          desc: "Treat recommended conventions such as missing module abstracts as errors.",
        },
        {
          name: "--ios",
          type: "Boolean",
          defaultValue: "false",
          enumOrFlag: "-",
          desc: "Also report iOS/mobile config diagnostics, such as a placeholder bundle id that Apple's portal already has claimed.",
        },
      ],
      examples: `akan doctor
akan doctor --format json
akan doctor --format json --strict true`,
    },
    {
      name: "mcp",
      signature: "akan mcp [--mode <readonly|plan|apply>]",
      desc: "Start the Akan MCP server over stdio.\nThe server exposes workspace context, module context, guideline instructions, command explanations, diagnostics, and resources for MCP-aware coding agents.\nHow much it may do is the `--mode` option, and the default is the narrowest one.",
      options: [
        {
          name: "--mode",
          type: "String",
          defaultValue: "readonly",
          enumOrFlag: "readonly | plan | apply",
          desc: "Permission mode. `readonly` answers questions only. `plan` adds `list_workflows`, `explain_workflow`, and `plan_workflow`, which write a plan file and nothing else. `apply` adds `apply_workflow`, `run_validation`, and the repair tools, so it edits source.",
        },
      ],
      notes: [
        {
          name: "workflow policy",
          desc: "The agent guide tells agents to inspect with `--mode plan` and then apply with `--mode apply`, preferring a workflow to a direct source edit.",
        },
        {
          name: "module context",
          desc: "`get_module_context` returns the module abstract first, then surrounding module file metadata.",
        },
      ],
      examples: `akan mcp
akan mcp --mode plan
akan mcp --mode apply`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="context-cli" title={l.trans({ en: "Context CLI", ko: "Context CLI" })}>
        <Docs.Title>{l.trans({ en: "Context CLI", ko: "Context CLI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Context commands expose Akan workspace structure in forms that people, agents, CI jobs, and MCP clients can consume.",
              ko: "Context command는 사람, agent, CI job, MCP client가 읽을 수 있는 형태로 Akan workspace 구조를 제공합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Use `context` to understand the workspace, `doctor` to validate conventions, and `mcp` when an MCP-aware client should reach the same information over stdio. What that client may do is the `--mode` option on `mcp`, not a property of the command.",
              ko: "`context`는 workspace 이해에, `doctor`는 convention 검증에, `mcp`는 MCP client가 같은 정보를 stdio로 접근해야 할 때 사용합니다. 그 client가 무엇까지 할 수 있는지는 command 자체가 아니라 `mcp`의 `--mode` option이 결정합니다.",
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
