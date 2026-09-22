import { usePage } from "@apps/akan/client";
import { type CommandReferenceItem, CommandReferenceSlide, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();

  const commands: CommandReferenceItem[] = [
    {
      name: "create-ui",
      signature: "akan create-ui [--app <name>] [--module <name>] [--surface <view|unit|template>] [--format <format>]",
      desc: l.trans({
        en: "Create one conventional UI surface for a module that already exists.\nIt writes a single file — `lib/<module>/<Module>.View.tsx`, `.Unit.tsx`, or `.Template.tsx` — from the same template the module scaffolder uses, and touches nothing else.\nThe report names `akan sync` and `akan lint` as the next actions; the command does not run them for you.",
        ko: "이미 존재하는 module에 conventional UI surface 하나를 만듭니다.\n`lib/<module>/<Module>.View.tsx`, `.Unit.tsx`, `.Template.tsx` 중 하나를 module scaffolder와 같은 template으로 쓰고, 그 밖에는 아무것도 건드리지 않습니다.\nreport는 다음 행동으로 `akan sync`와 `akan lint`를 알려줄 뿐, 대신 실행하지는 않습니다.",
      }),
      options: [
        {
          name: "--app",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Target app or library name. A name that is neither is reported as a missing target rather than guessed at.",
        },
        {
          name: "--module",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Target module name.",
        },
        {
          name: "--surface",
          type: "String",
          defaultValue: "template",
          enumOrFlag: "view | unit | template · flag: -u",
          desc: "Which surface to write. Zone and Util are not built by this command.",
        },
        {
          name: "--format",
          type: "String",
          defaultValue: "markdown",
          enumOrFlag: "markdown | json · flag: -o",
          desc: "Report format. `json` is the same report an MCP client receives.",
        },
      ],
      notes: [
        {
          name: "files",
          desc: "Exactly one created file, named from the module: `<Module>.View.tsx` for a detail surface, `<Module>.Unit.tsx` for list and card items, `<Module>.Template.tsx` for the form.",
        },
        {
          name: "boundary",
          desc: 'The Template scaffold carries `"use client"` on line 1 and the Unit and View scaffolds carry none, because those two roles are always server components. Getting the boundary right by construction is most of why the scaffold exists.',
        },
      ],
      examples: `akan create-ui --app koyo --module icecreamOrder
akan create-ui --app koyo --module icecreamOrder --surface view
akan create-ui --app koyo --module icecreamOrder --surface unit --format json`,
    },
    {
      name: "add-field",
      signature:
        "akan add-field [--app <name>] [--module <name>] [--field <name>] [--type <type>] [--default <value>] [--format <format>]",
      desc: l.trans({
        en: "Add one field to a module's constant and dictionary.\nIt writes the field into `<Module>Input` in `<module>.constant.ts`, adds the `akanjs/base` import when the type needs one, and adds the matching label under `.model<Module>` in `<module>.dictionary.ts`.\nEvery edit is verified against the edited source before anything is written: if the field is not where it was inserted, the whole write is abandoned and reported.",
        ko: "module의 constant와 dictionary에 field 하나를 더합니다.\n`<module>.constant.ts`의 `<Module>Input`에 field를 쓰고, type이 필요로 하면 `akanjs/base` import를 더하고, `<module>.dictionary.ts`의 `.model<Module>` 아래에 대응하는 label을 더합니다.\n모든 수정은 쓰기 전에 수정된 source에 대해 검증됩니다. field가 삽입된 자리에 없으면 쓰기 전체를 포기하고 보고합니다.",
      }),
      options: [
        {
          name: "--app",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Target app or library name.",
        },
        {
          name: "--module",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Target module name. Its constant and dictionary must both already exist.",
        },
        {
          name: "--field",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Field name. A name already present in the input class is refused instead of duplicated.",
        },
        {
          name: "--type",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Field type or scalar name. Lowercase spellings are normalized — string, boolean, date, int, integer, float, double, decimal — and anything else is passed through as written.",
        },
        {
          name: "--default",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Optional default, coerced by type: a numeric literal for Int and Float, true or false for Boolean, `now` or any parseable date for Date, and a string literal otherwise. A value the type refuses is an error, not a silent string.",
        },
        {
          name: "--format",
          type: "String",
          defaultValue: "markdown",
          enumOrFlag: "markdown | json · flag: -o",
          desc: "Report format.",
        },
      ],
      notes: [
        {
          name: "Number is refused",
          desc: "`number` and `numeric` are rejected by name: they are ambiguous in Akan. Use `Int` for whole numbers and `Float` for decimals.",
        },
        {
          name: "Upload is refused",
          desc: "`Upload` is not a model field type. Declare an image or file field as a relation to the `File` model, which the shared file library provides; Upload is only valid in a fileUpload signal body.",
        },
        {
          name: "two files, not three",
          desc: "This command stops at the constant and the dictionary. The Template form is updated by the `add-field` workflow, which passes the surfaces to update; the command alone never edits a component.",
        },
        {
          name: "after",
          desc: "The generated barrels do not move until you run `akan sync <app-or-lib>`, and the report says so.",
        },
      ],
      examples: `akan add-field --app koyo --module icecreamOrder --field topping --type String
akan add-field --app koyo --module icecreamOrder --field scoops --type Int --default 2
akan add-field --app koyo --module icecreamOrder --field servedAt --type Date --format json`,
    },
    {
      name: "add-enum-field",
      signature:
        "akan add-enum-field [--app <name>] [--module <name>] [--field <name>] [--values <a,b,c>] [--default <value>] [--format <format>]",
      desc: l.trans({
        en: "Add a field whose values are a closed set.\nIt does everything `add-field` does, and first declares the enum: an `enumOf` class named `<Module><Field>` in the constant, with the `enumOf` import added, and its options registered in the dictionary's enum stage.\nThe field's type is that class, which is why this command takes values instead of a type.",
        ko: "값이 닫힌 집합인 field를 더합니다.\n`add-field`가 하는 일을 모두 하고, 그에 앞서 enum을 선언합니다. constant에 `<Module><Field>` 이름의 `enumOf` class를 만들고 `enumOf` import를 더하며, dictionary의 enum 단계에 option을 등록합니다.\nfield의 type이 그 class이기 때문에, 이 command는 type 대신 values를 받습니다.",
      }),
      options: [
        {
          name: "--app",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Target app or library name.",
        },
        {
          name: "--module",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Target module name.",
        },
        {
          name: "--field",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Field name. It also names the enum class: field `status` on module `order` declares `OrderStatus`.",
        },
        {
          name: "--values",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable · flag: -l",
          desc: "Comma-separated enum values. An empty list is refused.",
        },
        {
          name: "--default",
          type: "String",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Optional default. A value that is not in --values is refused rather than written.",
        },
        {
          name: "--format",
          type: "String",
          defaultValue: "markdown",
          enumOrFlag: "markdown | json · flag: -o",
          desc: "Report format.",
        },
      ],
      notes: [
        {
          name: "no --type",
          desc: "The type is derived from the field name, so passing one has no effect. Use `add-field` when the type already exists.",
        },
        {
          name: "insertion point",
          desc: "The enum needs a safe place in the dictionary's chain. When the file's shape does not offer one, the command reports it and writes nothing rather than guessing.",
        },
      ],
      examples: `akan add-enum-field --app koyo --module icecreamOrder --field status --values pending,serving,served
akan add-enum-field --app koyo --module icecreamOrder --field size --values small,large --default small`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="primitive-cli" title={l.trans({ en: "Primitive CLI", ko: "Primitive CLI" })}>
        <Docs.Title>{l.trans({ en: "Primitive CLI", ko: "Primitive CLI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The module is already there. You need one more field on it, or the View component it never got — and the mechanical half of that job is the half that goes wrong: a label missing from the dictionary, an import that was never added, a component in the wrong file.",
              ko: "module은 이미 있습니다. field 하나가 더 필요하거나, 끝내 만들지 않은 View component가 필요합니다. 그리고 그 일의 기계적인 절반이야말로 어긋나는 절반입니다. dictionary에 빠진 label, 끝내 더해지지 않은 import, 잘못된 file에 놓인 component 같은 것들입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "These three commands are scaffolders that edit an existing module. They are the same steps the `create-ui`, `add-field`, and `add-enum-field` workflows apply, reachable directly when you already know what you want and do not need a plan to review.",
              ko: "이 세 command는 기존 module을 수정하는 scaffolder입니다. `create-ui`, `add-field`, `add-enum-field` workflow가 적용하는 바로 그 단계이며, 무엇을 원하는지 이미 알고 있어 검토할 plan이 필요 없을 때 직접 실행합니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.Alert>
          {l.trans({
            en: (
              <span>
                Every one of them refuses to write when it cannot find the shape it expects. A constant whose input
                class it cannot locate, a dictionary with no safe insertion point, a field that already exists — each is
                reported as a diagnostic and nothing is written. A half-applied edit would be worse than none.
              </span>
            ),
            ko: (
              <span>
                셋 모두 기대한 형태를 찾지 못하면 쓰기를 거부합니다. input class를 찾을 수 없는 constant, 안전한 삽입
                지점이 없는 dictionary, 이미 존재하는 field — 각각 diagnostic으로 보고되고 아무것도 쓰이지 않습니다.
                절반만 적용된 수정은 아예 하지 않은 것보다 나쁩니다.
              </span>
            ),
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />
      {commands.map((command) => (
        <CommandReferenceSlide key={command.name} command={command} />
      ))}
      <Divider />

      <Scroll.Slide
        id="primitive-or-workflow"
        title={l.trans({ en: "Primitive Or Workflow", ko: "primitive냐 workflow냐" })}
      >
        <Docs.Title>{l.trans({ en: "Primitive Or Workflow", ko: "primitive냐 workflow냐" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A primitive is one edit you already decided on. A workflow is the same edit plus the plan you read first, the UI surfaces it also touches, and the validation it runs afterwards.",
              ko: "primitive는 이미 결정한 수정 하나입니다. workflow는 같은 수정에, 먼저 읽는 plan과 함께 건드리는 UI surface, 그리고 이후 실행하는 validation이 더해진 것입니다.",
            })}
          </div>
        </Docs.Description>
        <div className="my-4 space-y-3">
          <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-primary">⚡</span>
              <strong className="text-primary">{"akan add-field ..."}</strong>
            </div>
            <div className="text-foreground/70 text-sm">
              {l.trans({
                en: "Two files, one command, no plan file. You run sync and lint yourself. This is the shape for a field you are adding while you are already in the module.",
                ko: "file 둘, command 하나, plan file 없음. sync와 lint는 직접 실행합니다. module 안에서 작업하던 중에 field를 더할 때의 형태입니다.",
              })}
            </div>
          </div>
          <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-primary">📋</span>
              <strong className="text-primary">{"akan workflow plan add-field ..."}</strong>
            </div>
            <div className="text-foreground/70 text-sm">
              {l.trans({
                en: "A reviewable plan, the Template form updated when you name it in surfaces, the Light projection when you ask for it, and sync plus lint plus typecheck run for you afterwards. This is the shape an agent is told to use.",
                ko: "검토 가능한 plan, surfaces에 지정하면 갱신되는 Template form, 요청하면 더해지는 Light projection, 그리고 이후 대신 실행되는 sync·lint·typecheck. agent에게 사용하라고 지시된 형태입니다.",
              })}
            </div>
          </div>
        </div>
        <div className="my-4 text-foreground/70 text-sm">
          {l.trans({
            en: (
              <span>
                The plan, apply, validate, and repair chain is on{" "}
                <Link href="/references/cli/workflow" className="text-primary underline">
                  Workflow
                </Link>
                . Creating the module itself is on{" "}
                <Link href="/references/cli/module" className="text-primary underline">
                  Module
                </Link>
                .
              </span>
            ),
            ko: (
              <span>
                plan, apply, validate, repair 사슬은{" "}
                <Link href="/references/cli/workflow" className="text-primary underline">
                  Workflow
                </Link>
                에, module 자체를 만드는 일은{" "}
                <Link href="/references/cli/module" className="text-primary underline">
                  Module
                </Link>
                에 있습니다.
              </span>
            ),
          })}
        </div>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
