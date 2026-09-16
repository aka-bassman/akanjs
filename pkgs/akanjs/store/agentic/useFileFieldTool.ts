"use client";
import { capitalize } from "akanjs/common";
import type { JsonSchema, ToolEntry } from "use-agentic";
import { useScopePath, useSurface } from "use-agentic";
import { actionTagOf } from "../actionTag";
import { formSetterNames } from "../formSetterNames";
// Through the `"use client"` shim, not `react` — see `StToolBuilder`.
import { useEffect, useRef } from "../hooks";
import { StoreRegistry } from "../storeRegistry";
import { type FormFieldRef, FormFields } from "./formFields";

export interface FileFieldSource<T extends { id: string }> {
  /**
   * The files this field may be set to, read live rather than closed over: one attached mid-conversation joins the
   * list between two calls. **Omitted publishes nothing** — a shared `Field.Img` forwards an optional prop, and a
   * call site that hands it nothing has no candidates and must not grow a tool that refuses every id.
   */
  read?: () => readonly T[];
  /** How one file reads to a person, so an agent can name the one it means — a filename, a caption. */
  label: (file: T) => string;
  /**
   * How many files the field holds, when it holds a list. Nothing derives it: `ConstantField` carries `arrDepth`,
   * which says the value is a list and not how long a legal one is, so the control passes the number it already
   * renders. Without it the cap is the server's `Err`, and an agent that learns a limit by tripping one is the
   * failure the listing tool exists to avoid.
   */
  max?: number;
  min?: number;
  disabled?: boolean;
}

const dispatcherOf = (action: string) =>
  StoreRegistry.instance.do[action] as ((...args: unknown[]) => unknown) | undefined;

const rowsOf = (ref: FormFieldRef): unknown[] => {
  const form = StoreRegistry.instance.get()[`${ref.refName}Form`] as { [key: string]: unknown } | undefined;
  const rows = form?.[ref.key];
  return Array.isArray(rows) ? rows : [];
};

const counted = (num: number) => `${num} ${num === 1 ? "file" : "files"}`;

/**
 * The tools an upload control owes an agent: list the files it may put in the field, then put one there by id.
 *
 * `FormFields.schema` publishes nothing for a relation and is right not to — writing an id would need a lookup the
 * store does not do — and `useRelationFieldTool` answers that for the relation a dropdown picks. The other half of
 * its reasoning, *"a relation is picked **or uploaded**"*, is this hook.
 *
 * It is not that one minus its loader. A picker's `read` is the whole resolvable set, so rewriting the array is
 * always expressible and `add`/`sub` would be a convenience — which is why neither that hook nor `useFieldTool`
 * publishes them for a list of ids. An upload control's `read` is what *this conversation* brought, and the field
 * may already hold files that predate it: naming the array whole would then drop them, because the ids that would
 * keep them are ids the guard has never heard of. So here the pair is the only way to add one file to a field that
 * already holds some, which is the ordinary case rather than a shortcut.
 *
 * `read` is the control's and not the framework's because the ids are the host's: the conversation carries
 * `MessageAttachment.ref`s, and only whoever set them can turn one back into the model a form field holds.
 */
export const useFileFieldTool = <T extends { id: string }>(
  onChange: unknown,
  { read, label, max, min, disabled }: FileFieldSource<T>,
) => {
  const surface = useSurface();
  const scope = useScopePath();
  const action = actionTagOf(onChange)?.action ?? null;
  const live = useRef({ onChange, read, label });
  live.current = { onChange, read, label };
  const scopeKey = scope.join(".");
  useEffect(() => {
    if (!action || disabled || !read) return;
    const ref = FormFields.ref(action);
    const target = ref && FormFields.relationOf(ref.field);
    // A field the form can describe on its own is `useFieldTool`'s, and one a dropdown picks is the relation
    // hook's: publishing two setters under one name would register one action with two argument shapes.
    if (!ref || !target || FormFields.schema(ref.field)) return;
    const many = ref.field.arrDepth > 0;
    const nullable = !!ref.field.nullable && !many;
    const names = formSetterNames(capitalize(ref.refName), ref.key);
    const listName = FormFields.optionsToolName(ref.refName, ref.key);
    const argName = many ? `${ref.key}Ids` : `${ref.key}Id`;
    const id: JsonSchema = { type: "string" };
    const ids: JsonSchema = { type: "array", items: id };
    const files = () => live.current.read?.() ?? [];
    const options = () => files().map((file) => ({ id: file.id, label: live.current.label(file) }));
    const held = (value: unknown): T[] => {
      const list = files();
      const wanted = Array.isArray(value) ? value : [value];
      return wanted.flatMap((one) => {
        const found = list.find((file) => file.id === one);
        return found ? [found] : [];
      });
    };
    const pair = many && !!dispatcherOf(names.addFieldOnModel) && !!dispatcherOf(names.subFieldOnModel);
    /**
     * One refusal for every entry that names a file, so a wrong id never reaches a setter as a silent drop.
     *
     * On a list it also says where the boundary is. The ids the field already holds are real, on screen, and in
     * the form the agent just read — and they are not in `read`, which is only what reached this screen. Refusing
     * one as "no such file" reads as the form being wrong rather than the verb, and the next move is to doubt the
     * value instead of reaching for the tool that does cover it.
     */
    const guardIds = (name: string, value: unknown, allowNull: boolean): true | string => {
      if (allowNull && (value === null || value === undefined)) return true;
      const wanted = Array.isArray(value) ? value : [value];
      if (!Array.isArray(value) && Array.isArray(wanted[0])) return `"${argName}" of ${name} takes ids, not a list.`;
      const list = files();
      const missing = wanted.filter((one) => typeof one !== "string" || !list.some((file) => file.id === one));
      if (!missing.length) return true;
      const route = pair
        ? ` A file already on ${ref.key} may not be offered at all — it can only be removed by position, with ${names.subFieldOnModel}.`
        : "";
      if (!list.length)
        return `No file is offered for ${ref.key} yet — one has to be attached or uploaded first.${route}`;
      return `The ${ref.refName} form offers no file ${missing.join(", ")}. It offers: ${list
        .map((file) => `${file.id} (${live.current.label(file)})`)
        .join(", ")}.${route}`;
    };
    /** The cap, checked against what the field would hold afterwards rather than against what the call named. */
    const guardCount = (after: number, subbing = false): true | string => {
      if (max !== undefined && after > max)
        return `${ref.key} holds at most ${counted(max)}, and that would make ${after}. Remove one with ${names.subFieldOnModel} first.`;
      if (min !== undefined && after < min)
        return `${ref.key} holds at least ${counted(min)}, and that would leave ${after}.${
          subbing ? ` Replace one with ${names.addFieldOnModel} instead.` : ""
        }`;
      return true;
    };
    const capNote = [
      max === undefined ? "" : `It holds at most ${counted(max)}.`,
      min === undefined ? "" : `It holds at least ${counted(min)}.`,
    ]
      .filter(Boolean)
      .join(" ");
    const entries: ToolEntry[] = [
      {
        name: listName,
        description: `List the files the ${ref.refName} form can put in ${ref.key}, by id. Pass an id from it to ${action}.`,
        settle: false,
        run: () => options(),
      },
      {
        name: action,
        description: [
          many
            ? `Replace ${ref.key} on the ${ref.refName} form with files from ${listName}, by id. Every file not named is dropped, including one this list does not offer — use ${names.addFieldOnModel} to keep what is already there.`
            : `Set ${ref.key} on the ${ref.refName} form to one file from ${listName}, by id.`,
          many ? capNote : "",
        ]
          .filter(Boolean)
          .join(" "),
        parameters: {
          type: "object",
          properties: { [argName]: many ? ids : id },
          ...(nullable ? {} : { required: [argName] }),
          additionalProperties: false,
        },
        guard: (args) => {
          const named = guardIds(action, args[argName], nullable);
          if (named !== true || !many) return named;
          return guardCount(Array.isArray(args[argName]) ? (args[argName] as unknown[]).length : 0);
        },
        run: (args) => {
          const picked = held(args[argName]);
          return (live.current.onChange as (value: unknown) => unknown)(many ? picked : (picked[0] ?? null));
        },
      },
    ];
    // Append and remove-by-position. Where `useFieldTool` offers these as the weaker way to write an array, here
    // they are the only way to reach one the conversation did not put there — see the note above the hook.
    if (pair)
      entries.push(
        {
          name: names.addFieldOnModel,
          description: [
            `Append files from ${listName} to ${ref.key} on the ${ref.refName} form, by id. Leaves every file already there untouched.`,
            capNote,
          ]
            .filter(Boolean)
            .join(" "),
          parameters: {
            type: "object",
            properties: { [argName]: ids },
            required: [argName],
            additionalProperties: false,
          },
          guard: (args) => {
            const named = guardIds(names.addFieldOnModel, args[argName], false);
            if (named !== true) return named;
            const adding = Array.isArray(args[argName]) ? (args[argName] as unknown[]).length : 0;
            return guardCount(rowsOf(ref).length + adding);
          },
          run: (args) => dispatcherOf(names.addFieldOnModel)?.(held(args[argName])),
        },
        {
          name: names.subFieldOnModel,
          description: `Remove files from ${ref.key} on the ${ref.refName} form by their positions, counting from 0.`,
          parameters: {
            type: "object",
            properties: { idxs: { type: "array", items: { type: "integer" } } },
            required: ["idxs"],
            additionalProperties: false,
          },
          guard: (args) => {
            const idxs = args.idxs;
            if (!Array.isArray(idxs) || !idxs.length)
              return `"idxs" of ${names.subFieldOnModel} takes at least one position.`;
            const length = rowsOf(ref).length;
            const outside = idxs.filter(
              (idx) => typeof idx !== "number" || !Number.isInteger(idx) || idx < 0 || idx >= length,
            );
            if (outside.length) return `${ref.key} holds ${counted(length)}, so ${outside.join(", ")} is out of range.`;
            return guardCount(length - new Set(idxs).size, true);
          },
          run: (args) => dispatcherOf(names.subFieldOnModel)?.(args.idxs),
        },
      );
    const registered = entries.map((entry) => surface.registerTool(scope, entry));
    return () => {
      for (const unregister of registered) unregister();
    };
  }, [surface, scopeKey, action, disabled, !read, max, min]);
};
