import { usePage } from "@apps/akan/client";
import {
  type CommandReferenceItem,
  CommandReferenceSlide,
  Divider,
  Docs,
  DocsToc,
  type ReferenceRow,
} from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

const formatOption: ReferenceRow = {
  name: "--format",
  type: "String",
  defaultValue: "markdown",
  enumOrFlag: "markdown | json (flag: -o)",
  desc: "How the report of written files is printed. Use json in an agent loop.",
};
const moduleArgNote: ReferenceRow = {
  name: "positional",
  desc: "The module is named as `[sys-name:module-name]`, such as `shop:product`. Omit it to pick the app or library and then the module interactively.",
};

export default page().render(() => {
  const { l } = usePage();

  const commands: CommandReferenceItem[] = [
    {
      name: "create-module",
      signature: "akan create-module <moduleName> [sys] [--page <boolean>] [--format <markdown|json>]",
      desc: "Create a new domain module template inside an app or library.\nThe generator creates the standard Akan module files and can additionally create route-level page files when `--page` is enabled.",
      args: [
        {
          name: "moduleName",
          type: "String",
          required: "yes",
          defaultValue: "-",
          desc: "Module name. Spaces are removed and the first letter is lowercased.",
        },
      ],
      options: [
        {
          name: "--page",
          type: "Boolean",
          defaultValue: "false",
          enumOrFlag: "-",
          desc: "Create page files with the module.",
        },
        formatOption,
      ],
      examples: `akan create-module Story
akan create-module UserProfile --page true
akan create-module Story --format json`,
    },
    {
      name: "create-service",
      signature: "akan create-service <serviceName> [sys] [--format <markdown|json>]",
      desc: "Create a service module — the module kind for behavior that is not centered on one stored model, so it gets no constant, document, or store files.\nIt lands in `lib/_<service>`, and its abstract file is `<service>.abstract.md` without the underscore. A leading underscore in the name is stripped, so `_noti` and `noti` create the same folder.",
      args: [
        {
          name: "serviceName",
          type: "String",
          required: "yes",
          defaultValue: "-",
          desc: "Service name. Spaces and a leading underscore are removed, and the first letter is lowercased.",
        },
      ],
      options: [formatOption],
      examples: `akan create-service noti
akan create-service Security --format json`,
    },
    {
      name: "remove-module",
      signature: "akan remove-module [sys-name:module-name]",
      desc: "Remove an existing module from an app or library.\nUse this when the module's domain definitions, generated connections, and UI companion files should be removed from the target system.",
      notes: [moduleArgNote],
      examples: `akan remove-module shop:story
akan remove-module`,
    },
    {
      name: "create-view",
      signature: "akan create-view [sys-name:module-name] [--format <markdown|json>]",
      desc: 'Create a full View component for an existing module.\nA View is the one-record detail surface and is always a server component, so it never carries `"use client"`.',
      options: [formatOption],
      notes: [moduleArgNote],
      examples: "akan create-view shop:story",
    },
    {
      name: "create-unit",
      signature: "akan create-unit [sys-name:module-name] [--format <markdown|json>]",
      desc: "Create a Unit component for rendering repeated module items.\nA Unit is the list row or card that consumes light module data, and like View it is always a server component.",
      options: [formatOption],
      notes: [moduleArgNote],
      examples: "akan create-unit shop:story",
    },
    {
      name: "create-template",
      signature: "akan create-template [sys-name:module-name] [--format <markdown|json>]",
      desc: 'Create a Template component for the module\'s create/edit form.\nA Template is bound to store form state, so it is always a client component and carries `"use client"` on line 1.',
      options: [formatOption],
      notes: [moduleArgNote],
      examples: "akan create-template shop:story",
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="module-cli" title={l.trans({ en: "Module CLI", ko: "Module CLI" })}>
        <Docs.Title>{l.trans({ en: "Module CLI", ko: "Module CLI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Module commands create and maintain modules inside an app or library. `create-module` is for a feature centered on a stored model, `create-service` for behavior that is not, and the three component commands add a UI companion file to a module that already exists.",
              ko: "Module command는 app 또는 library 안의 module을 생성하고 관리합니다. stored model 중심 feature에는 `create-module`을, 그렇지 않은 behavior에는 `create-service`를 쓰고, 나머지 세 component command는 이미 존재하는 module에 UI companion file을 추가합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Module names are normalized with lower-case first-letter style after spaces are removed, matching Akan module file conventions. Every command here prints the files it wrote, as markdown by default and as JSON with `-o json`.",
              ko: "Module name은 space 제거 후 lower-case first-letter style로 정규화되어 Akan module file convention과 맞춰집니다. 여기의 모든 generator는 작성한 file 목록을 출력하며, 기본은 markdown이고 `-o json`으로 JSON을 받습니다.",
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
