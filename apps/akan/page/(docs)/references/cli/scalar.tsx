import { usePage } from "@apps/akan/client";
import { type CommandReferenceItem, CommandReferenceSlide, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const commands: CommandReferenceItem[] = [
    {
      name: "create-scalar",
      signature: "akan create-scalar <scalarName> [sys] [--format <markdown|json>]",
      desc: "Create a new scalar type for reusable value objects or simple data shapes that do not need DB persistence.\nThe generator normalizes the scalar name, writes the files under `lib/__scalar/<scalar>`, and prints what it wrote.",
      args: [
        {
          name: "scalarName",
          type: "String",
          required: "yes",
          defaultValue: "-",
          desc: "Scalar name. Spaces are removed and the first letter is lowercased.",
        },
      ],
      options: [
        {
          name: "--format",
          type: "String",
          defaultValue: "markdown",
          enumOrFlag: "markdown | json (flag: -o)",
          desc: "How the report of written files is printed. Use json in an agent loop.",
        },
      ],
      examples: `akan create-scalar Coordinate
akan create-scalar Address --format json`,
    },
    {
      name: "remove-scalar",
      signature: "akan remove-scalar <scalarName> [sys]",
      desc: "Remove an existing scalar type from an app or library.\nUse it after checking usages, because scalar definitions are often imported by modules, dictionaries, templates, and service payload types.",
      args: [
        { name: "scalarName", type: "String", required: "yes", defaultValue: "-", desc: "Scalar name to remove." },
      ],
      examples: "akan remove-scalar Coordinate",
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="scalar-cli" title={l.trans({ en: "Scalar CLI", ko: "Scalar CLI" })}>
        <Docs.Title>{l.trans({ en: "Scalar CLI", ko: "Scalar CLI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Scalar commands create and remove scalar types inside an app or library. A scalar is a reusable data type or value object, not a database-backed document model.",
              ko: "Scalar command는 app 또는 library 안에 scalar type을 생성하거나 제거합니다. scalar는 database-backed document model이 아니라 reusable data type 또는 value object입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The scalar name is normalized after spaces are removed, matching Akan scalar file conventions.",
              ko: "Scalar name은 space 제거 후 Akan scalar file convention에 맞게 정규화됩니다.",
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
