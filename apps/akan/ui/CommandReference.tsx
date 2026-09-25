import { usePage } from "@apps/akan/client";
import { Scroll } from "@libs/util/ui";
import type { ReactNode } from "react";
import { Code } from "./Code";
import { Docs, type OptionItem } from "./Docs";

export interface ReferenceRow {
  name: string;
  type?: string;
  required?: string;
  defaultValue?: string;
  enumOrFlag?: string;
  desc: ReactNode;
}

export interface CommandReferenceItem {
  name: string;
  signature: string;
  desc: ReactNode;
  args?: ReferenceRow[];
  options?: ReferenceRow[];
  notes?: ReferenceRow[];
  examples: string;
}

const presentOf = (value?: string) => (value && value !== "-" ? value : undefined);

const optionsOf = (rows: ReferenceRow[], requiredLabel: string): OptionItem[] =>
  rows.map((row) => ({
    key: row.name,
    type: presentOf(row.type) ?? "",
    default: presentOf(row.defaultValue),
    tags: [row.required === "yes" ? requiredLabel : undefined, presentOf(row.enumOrFlag)].filter(
      (tag): tag is string => !!tag,
    ),
    desc: row.desc,
  }));

interface CommandReferenceSlideProps {
  command: CommandReferenceItem;
}

export const CommandReferenceSlide = ({ command }: CommandReferenceSlideProps) => {
  const { l } = usePage();
  const requiredLabel = l.trans({ en: "required", ko: "필수" });

  return (
    <Scroll.Slide id={command.name} title={command.name}>
      <Docs.Title>{command.name}</Docs.Title>
      <Docs.Description>
        <div className="whitespace-pre-line">
          <Docs.CodeText>{command.desc}</Docs.CodeText>
        </div>
      </Docs.Description>
      <Code.Snippet
        className="w-full"
        title={l.trans({ en: "Signature", ko: "형식" })}
        language="bash"
        code={command.signature}
      />
      {command.args?.length ? (
        <>
          <Docs.SubTitle>{l.trans({ en: "Arguments", ko: "인자" })}</Docs.SubTitle>
          <Docs.OptionTable items={optionsOf(command.args, requiredLabel)} />
        </>
      ) : null}
      {command.options?.length ? (
        <>
          <Docs.SubTitle>{l.trans({ en: "Options", ko: "옵션" })}</Docs.SubTitle>
          <Docs.OptionTable items={optionsOf(command.options, requiredLabel)} />
        </>
      ) : null}
      {command.notes?.length ? (
        <>
          <Docs.SubTitle>{l.trans({ en: "Notes", ko: "참고" })}</Docs.SubTitle>
          <Docs.IntroTable
            type={l.trans({ en: "Name", ko: "이름" })}
            items={command.notes.map((note) => ({
              name: <span className="font-sans">{note.name}</span>,
              desc: note.desc,
            }))}
          />
        </>
      ) : null}
      <Code.Snippet
        className="w-full"
        title={l.trans({ en: "Examples", ko: "예시" })}
        language="bash"
        code={command.examples}
      />
    </Scroll.Slide>
  );
};
