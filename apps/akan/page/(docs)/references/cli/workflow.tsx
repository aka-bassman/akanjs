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
      name: "workflow",
      signature:
        "akan workflow <action> [workflow] [--format <markdown|json>] [--out <path>] [--dry-run <boolean>] [--app <name>] [--module <name>] [--field <name>] [--type <type>] [--values <a,b,c>] [--default <value>] [--scalar <name>] [--surface <name>] [--mutation <name>] [--slice <name>]",
      desc: l.trans({
        en: "List, explain, plan, apply, validate, or report an Akan workflow.\nA workflow is a named recipe for a change that always touches the same files in the same order — a field, a module, a slice. Planning it produces a JSON file you can read before anything is written, and applying it consumes that file.\n`plan` and `explain` never write source. `apply` does, and only from a plan file.",
        ko: "Akan workflow를 나열하고, 설명하고, 계획하고, 적용하고, 검증하고, 보고합니다.\nworkflow는 늘 같은 file을 같은 순서로 건드리는 변경 — field 하나, module 하나, slice 하나 — 에 붙인 이름입니다. 계획하면 아무것도 쓰기 전에 읽어볼 수 있는 JSON file이 나오고, 적용은 그 file을 먹습니다.\n`plan`과 `explain`은 source를 쓰지 않습니다. `apply`만 쓰며, 그것도 plan file에서만 씁니다.",
      }),
      args: [
        {
          name: "action",
          type: "String",
          required: "yes",
          defaultValue: "-",
          desc: "list, explain, plan, apply, validate, or report. It has no default, so leaving it off opens a picker rather than choosing one.",
        },
        {
          name: "workflow",
          type: "String",
          required: "no",
          defaultValue: "-",
          desc: "Workflow name for explain and plan, the plan file path for apply, a plan path or run id for validate, and a run id for report. Every action but list requires it.",
        },
      ],
      options: [
        {
          name: "--format",
          type: "String",
          defaultValue: "markdown",
          enumOrFlag: "markdown | json · flag: -o",
          desc: "Output format. `markdown` is rendered for a person; `json` is the same object an MCP client receives.",
        },
        {
          name: "--out",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable · flag: -w",
          desc: "Write the plan JSON to this path. `apply` reads a plan from a file, so a plan you intend to apply must be given one.",
        },
        {
          name: "--dry-run",
          type: "Boolean",
          defaultValue: "false",
          enumOrFlag: "flag: -r",
          desc: "Report the apply that would happen without writing any source. It still writes a run artifact, so the predicted report can be validated and re-read.",
        },
        {
          name: "--app",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Plan input: target app or library name. Required by every workflow.",
        },
        {
          name: "--module",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Plan input: target domain, service, or scalar module name.",
        },
        {
          name: "--field",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Plan input for add-field and add-enum-field: the field name.",
        },
        {
          name: "--type",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Plan input for add-field: the field type or scalar name. Use Int or Float, never Number.",
        },
        {
          name: "--values",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable · flag: -l",
          desc: "Plan input for add-enum-field: comma-separated enum values.",
        },
        {
          name: "--default",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Plan input: the field default. plan and apply coerce it by type, and an enum default outside the declared values is refused.",
        },
        {
          name: "--scalar",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable · flag: -c",
          desc: "Plan input for create-scalar: the scalar name.",
        },
        {
          name: "--surface",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable · flag: -u",
          desc: "Plan input for create-ui: the UI surface to create.",
        },
        {
          name: "--mutation",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable · flag: -n",
          desc: "Plan input for add-mutation: the mutation or action name.",
        },
        {
          name: "--slice",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable · flag: -i",
          desc: "Plan input for add-slice: the slice or query name.",
        },
      ],
      notes: [
        {
          name: "plan file",
          desc: "Without `--out` a plan is printed and gone. `apply` takes a path, not a workflow name, so the `--out` path from the plan step is the argument to the apply step.",
        },
        {
          name: "approval",
          desc: "Every plan carries `requiresApproval: true` and names `apply_workflow` as the tool that acts on it. The plan is the review artifact; reading it is the point of the two-step shape.",
        },
        {
          name: "run artifact",
          desc: "An apply writes `.akan/workflows/runs/<runId>.json` and reports its path as `validationTarget`. That path — or the run id — is what `validate` and `report` take.",
        },
        {
          name: "create-ui surfaces",
          desc: "The create-ui spec declares five allowed values, but apply builds only `view`, `unit`, and `template`; `zone` and `util` are refused with an unsupported-input diagnostic.",
        },
        {
          name: "unknown name",
          desc: "An unrecognized workflow throws and names `akan workflow list` in the message, rather than guessing at the nearest match.",
        },
      ],
      examples: `akan workflow list
akan workflow explain add-field
akan workflow plan add-field --app koyo --module icecreamOrder --field topping --type String --out .akan/workflows/plans/topping.json
akan workflow apply .akan/workflows/plans/topping.json --dry-run true
akan workflow apply .akan/workflows/plans/topping.json
akan workflow validate .akan/workflows/runs/apply-20260921103000-a1b2c3.json
akan workflow report apply-20260921103000-a1b2c3`,
    },
    {
      name: "repair",
      signature: "akan repair <kind> [--format <markdown|json>] [--app <name>] [--module <name>] [--target <name>]",
      desc: l.trans({
        en: "Run one narrow repair and return a structured report.\nEach kind is a known remedy for a known diagnostic, run through the same reporting shape as an apply: what it ran, what it changed, what to do next.\nTwo of the five change nothing on their own — `dictionary` and `module-shape` read `akan doctor --strict`, filter its diagnostics to your module, and name the primitive command that would fix them.",
        ko: "좁은 repair 하나를 실행하고 구조화된 report를 돌려줍니다.\n각 kind는 알려진 diagnostic에 대한 알려진 처방이며, apply와 같은 보고 형태 — 무엇을 실행했고, 무엇을 바꿨고, 다음에 무엇을 할지 — 로 돕니다.\n다섯 중 둘은 스스로 아무것도 바꾸지 않습니다. `dictionary`와 `module-shape`는 `akan doctor --strict`를 읽어 해당 module의 diagnostic만 걸러내고, 그것을 고칠 primitive command를 알려줍니다.",
      }),
      args: [
        {
          name: "kind",
          type: "String",
          required: "yes",
          defaultValue: "-",
          desc: "generated, format, imports, dictionary, or module-shape.",
        },
      ],
      options: [
        {
          name: "--format",
          type: "String",
          defaultValue: "markdown",
          enumOrFlag: "markdown | json · flag: -o",
          desc: "Output format.",
        },
        {
          name: "--app",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Target app or library. Required by generated, dictionary, and module-shape.",
        },
        {
          name: "--module",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Target module. Required by dictionary and module-shape.",
        },
        {
          name: "--target",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable · flag: -t",
          desc: "Target app, library, or package. Required by format and imports.",
        },
      ],
      notes: [
        {
          name: "generated",
          desc: "Runs `akan sync <app>` and, when it passes, records the refresh under `.akan/workflows/sync/` so a later run can tell what is already current.",
        },
        {
          name: "format · imports",
          desc: "Both run `akan lint <target>`, which is Biome's fix path. They are two kinds because the report says which problem you came for, not because two commands exist.",
        },
        {
          name: "dictionary · module-shape",
          desc: "Report-only. They surface the matching doctor diagnostics and hand back `akan add-field ...` or `akan create-module ...` as the source-safe repair; a run with nothing to report says so as a warning.",
        },
        {
          name: "over MCP",
          desc: "Three of the five are published as MCP tools in apply mode: `repair_generated`, `repair_imports`, and `repair_module_shape`. `format` and `dictionary` are CLI-only.",
        },
        {
          name: "run artifact",
          desc: "Every repair writes `.akan/workflows/runs/<runId>.json` like an apply does, and reports its path as `repairReportPath`.",
        },
      ],
      examples: `akan repair generated --app koyo
akan repair format --target koyo
akan repair imports --target koyo
akan repair module-shape --app koyo --module icecreamOrder
akan repair dictionary --app koyo --module icecreamOrder --format json`,
    },
  ];

  const catalogue: IntroItem[] = [
    {
      name: "create-module",
      desc: "A new database-backed domain module with constant, service, signal, store, and UI surfaces. Use it when the user asks for a new business entity.",
    },
    {
      name: "create-scalar",
      desc: "A reusable value module with no database ownership. Use it for a value object, a primitive domain type, or a shared scalar.",
    },
    {
      name: "create-ui",
      desc: "One conventional UI surface for a module that already exists. Apply builds view, unit, or template.",
    },
    {
      name: "add-field",
      desc: "A field across the constant, the dictionary, and the UI surfaces you name. Use it when the user asks to add a field to an existing module.",
    },
    {
      name: "add-enum-field",
      desc: "The same, for a field with a closed set of values: the enum class, its dictionary options, and the field itself.",
    },
    {
      name: "add-mutation",
      desc: "A server mutation with the matching signal, store, and UI action surface. Use it for a new state-changing module action.",
    },
    {
      name: "add-slice",
      desc: "A list or query slice across data access, signal, and view surfaces. Use it for a filtered list, a tab, a segment, or a reusable query.",
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="workflow-cli" title={l.trans({ en: "Workflow CLI", ko: "Workflow CLI" })}>
        <Docs.Title>{l.trans({ en: "Workflow CLI", ko: "Workflow CLI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Adding one field to a module is six edits in five files, and four of them are mechanical. Do it by hand and the interesting part — the name, the type, the default — competes for your attention with a dictionary label and a generated barrel. Do it twice and the two modules disagree.",
              ko: "module에 field 하나를 더하는 일은 다섯 file에 걸친 여섯 번의 수정이고, 그중 넷은 기계적입니다. 손으로 하면 정작 중요한 부분 — 이름, type, default — 이 dictionary label과 generated barrel에 주의를 뺏깁니다. 두 번 하면 두 module이 서로 어긋납니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A workflow names that change once. You plan it, read the plan, apply it, and validate what it did. `akan repair` is the other half: when validation fails, it runs the one command that clears that failure.",
              ko: "workflow는 그 변경에 한 번 이름을 붙입니다. 계획하고, 계획을 읽고, 적용하고, 결과를 검증합니다. `akan repair`는 나머지 절반입니다. 검증이 실패했을 때, 그 실패를 해소하는 하나의 command를 실행합니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.Alert>
          {l.trans({
            en: (
              <span>
                Prefer a workflow to a direct source edit. Under <code>akan mcp --mode apply</code> a direct edit is
                refused while an allowlisted workflow or repair tool can make the same change, and{" "}
                <code>plan_workflow</code> answers with a <code>planPath</code> precisely so the next step has something
                to consume.
              </span>
            ),
            ko: (
              <span>
                직접 source를 수정하기보다 workflow를 택하세요. <code>akan mcp --mode apply</code> 아래에서는
                allowlist에 오른 workflow나 repair tool이 같은 변경을 할 수 있는 한 직접 수정이 거부되며,{" "}
                <code>plan_workflow</code>가 <code>planPath</code>로 답하는 이유도 다음 단계가 먹을 것을 주기
                위해서입니다.
              </span>
            ),
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="plan-apply-loop" title={l.trans({ en: "Plan, Apply, Validate", ko: "계획, 적용, 검증" })}>
        <Docs.Title>{l.trans({ en: "Plan, Apply, Validate", ko: "계획, 적용, 검증" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The four steps are one chain, and each hands the next a file path rather than a name. That is what makes the sequence reviewable: the plan is a document before it is an action, and the run artifact is a record after it.",
              ko: "네 단계는 하나의 사슬이고, 각 단계는 이름이 아니라 file 경로를 다음에 넘깁니다. 그래서 이 순서는 검토 가능합니다. plan은 행동이기 전에 문서이고, run artifact는 행동 이후의 기록입니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.Mermaid
          title="Workflow chain"
          highlightNodes={["apply"]}
          chart={`flowchart LR
  plan["akan workflow plan --out"] --> file["plan JSON"]
  file --> apply["akan workflow apply"]
  apply --> artifact[".akan/workflows/runs"]
  artifact --> validate["akan workflow validate"]
  validate --> repair["akan repair"]`}
        />
        <div className="my-4 space-y-3">
          <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-primary">📋</span>
              <strong className="text-primary">{"plan --out <path>"}</strong>
            </div>
            <div className="text-foreground/70 text-sm">
              {l.trans({
                en: "Reads the workspace and writes a JSON plan: the steps, the files it predicts it will change, the validation it will want afterwards. Nothing in your source is touched.",
                ko: "workspace를 읽어 JSON plan을 씁니다. 단계, 바뀔 것으로 예측되는 file, 이후 필요할 validation이 담깁니다. source는 건드리지 않습니다.",
              })}
            </div>
          </div>
          <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-primary">✍️</span>
              <strong className="text-primary">{"apply <planPath>"}</strong>
            </div>
            <div className="text-foreground/70 text-sm">
              {l.trans({
                en: "Takes the plan file, not a workflow name. An invalid or unreadable plan is reported as a diagnostic instead of throwing, so the report shape is the same whether it worked or not.",
                ko: "workflow 이름이 아니라 plan file을 받습니다. 잘못되었거나 읽을 수 없는 plan은 예외 대신 diagnostic으로 보고되므로, 성공하든 실패하든 report의 형태는 같습니다.",
              })}
            </div>
          </div>
          <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-primary">✅</span>
              <strong className="text-primary">{"validate <runId | path>"}</strong>
            </div>
            <div className="text-foreground/70 text-sm">
              {l.trans({
                en: "Runs the validation commands the plan asked for — sync, lint, typecheck — and classifies a failure as a source change, a workspace config problem, or an environment one.",
                ko: "plan이 요구한 validation command — sync, lint, typecheck — 를 실행하고, 실패를 source 변경, workspace config 문제, environment 문제 중 하나로 분류합니다.",
              })}
            </div>
          </div>
          <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-primary">🔧</span>
              <strong className="text-primary">{"akan repair <kind>"}</strong>
            </div>
            <div className="text-foreground/70 text-sm">
              {l.trans({
                en: "The remedy for that classification. `generated` re-syncs, `format` and `imports` re-lint, and the two report-only kinds point at the primitive that fixes a module.",
                ko: "그 분류에 대한 처방입니다. `generated`는 다시 sync하고, `format`과 `imports`는 다시 lint하며, 보고만 하는 두 kind는 module을 고칠 primitive를 가리킵니다.",
              })}
            </div>
          </div>
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="workflow-catalogue" title={l.trans({ en: "Workflow Catalogue", ko: "Workflow 카탈로그" })}>
        <Docs.Title>{l.trans({ en: "Workflow Catalogue", ko: "Workflow 카탈로그" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Seven workflows ship with the CLI. `akan workflow list` prints them with the same descriptions, and `akan workflow explain <name>` adds the inputs, the predicted changes, and the completion criteria.",
              ko: "CLI에는 일곱 개의 workflow가 함께 옵니다. `akan workflow list`가 같은 설명으로 출력하고, `akan workflow explain <name>`은 input, 예측되는 변경, 완료 기준까지 더해 보여줍니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.IntroTable type={l.trans({ en: "Workflow", ko: "Workflow" })} items={catalogue} />
        <div className="my-4 text-foreground/70 text-sm">
          {l.trans({
            en: (
              <span>
                Each one applies through a primitive command you can also run directly — see{" "}
                <Link href="/references/cli/primitive" className="text-primary underline">
                  Primitive
                </Link>{" "}
                — and is reachable over MCP through{" "}
                <Link href="/references/cli/context" className="text-primary underline">
                  akan mcp
                </Link>
                .
              </span>
            ),
            ko: (
              <span>
                각 workflow는 직접 실행할 수도 있는 primitive command를 통해 적용됩니다 —{" "}
                <Link href="/references/cli/primitive" className="text-primary underline">
                  Primitive
                </Link>{" "}
                참고 — 그리고{" "}
                <Link href="/references/cli/context" className="text-primary underline">
                  akan mcp
                </Link>
                로 MCP에서도 닿을 수 있습니다.
              </span>
            ),
          })}
        </div>
      </Scroll.Slide>
      <Divider />
      {commands.map((command) => (
        <CommandReferenceSlide key={command.name} command={command} />
      ))}
      <DocsToc />
    </Scroll>
  );
});
