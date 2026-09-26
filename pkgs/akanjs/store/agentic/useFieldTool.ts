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

// The control's `transform` applies to agent writes too, per element for an array; a cleared null stays null.
const normalized = (value: unknown, transform: unknown): unknown => {
  if (typeof transform !== "function" || value === null) return value;
  const apply = transform as (input: unknown) => unknown;
  return Array.isArray(value) ? value.map((item) => apply(item)) : apply(value);
};

const dispatcherOf = (action: string) =>
  StoreRegistry.instance.do[action] as ((...args: unknown[]) => unknown) | undefined;

const rowsOf = (ref: FormFieldRef): unknown[] => {
  const form = StoreRegistry.instance.get()[`${ref.refName}Form`] as { [key: string]: unknown } | undefined;
  const rows = form?.[ref.key];
  return Array.isArray(rows) ? rows : [];
};

// Append and remove-by-index are strictly weaker than the whole-array setter, so sound to derive from it.
// `addOrSub` is never published: it matches rows by reference, so every toggle would append.
const rowEntries = (ref: FormFieldRef, arraySchema: JsonSchema): ToolEntry[] => {
  if (!FormFields.rowModelOf(ref.field)) return [];
  const names = formSetterNames(capitalize(ref.refName), ref.key);
  if (!dispatcherOf(names.addFieldOnModel) || !dispatcherOf(names.subFieldOnModel)) return [];
  return [
    {
      name: names.addFieldOnModel,
      description: `Append rows to ${ref.key} on the ${ref.refName} form. Leaves every existing row untouched.`,
      parameters: {
        type: "object",
        properties: { values: arraySchema },
        required: ["values"],
        additionalProperties: false,
      },
      run: (args) => {
        const checked = FormFields.checked(names.addFieldOnModel, "values", ref.field, args.values);
        return dispatcherOf(names.addFieldOnModel)?.(checked);
      },
    },
    {
      name: names.subFieldOnModel,
      description: `Remove rows of ${ref.key} from the ${ref.refName} form by their positions, counting from 0.`,
      parameters: {
        type: "object",
        properties: { idxs: { type: "array", items: { type: "integer" } } },
        required: ["idxs"],
        additionalProperties: false,
      },
      guard: (args) => {
        const idxs = args.idxs;
        if (!Array.isArray(idxs) || !idxs.length) return `"idxs" of ${names.subFieldOnModel} takes at least one index.`;
        const length = rowsOf(ref).length;
        const outside = idxs.filter(
          (idx) => typeof idx !== "number" || !Number.isInteger(idx) || idx < 0 || idx >= length,
        );
        if (!outside.length) return true;
        return `${ref.key} has ${length} ${length === 1 ? "row" : "rows"}, so ${outside.join(", ")} is out of range.`;
      },
      run: (args) => dispatcherOf(names.subFieldOnModel)?.(args.idxs),
    },
  ];
};

export interface FieldToolOptions {
  /** Applied to the agent's write exactly as to the person's typing. */
  transform?: unknown;
  /** While true, nothing is published. */
  disabled?: boolean;
  /** Also publishes `move<Field>On<Model>`, for a list the person can drag. */
  sortable?: boolean;
}

// No store action: splices the live rows into the setter, without `transform` — the values are already stored.
const moveEntry = (ref: FormFieldRef, onChange: () => (value: unknown) => unknown): ToolEntry => {
  const name = formSetterNames(capitalize(ref.refName), ref.key).moveFieldOnModel;
  return {
    name,
    description: `Move one entry of ${ref.key} on the ${ref.refName} form to another position, counting from 0. Reorders only — no entry's content changes.`,
    parameters: {
      type: "object",
      properties: { from: { type: "integer" }, to: { type: "integer" } },
      required: ["from", "to"],
      additionalProperties: false,
    },
    guard: (args) => {
      const length = rowsOf(ref).length;
      const outside = ["from", "to"].filter((key) => {
        const idx = args[key];
        return typeof idx !== "number" || !Number.isInteger(idx) || idx < 0 || idx >= length;
      });
      if (!outside.length) return true;
      return `${ref.key} has ${length} ${length === 1 ? "entry" : "entries"}, so ${outside.join(" and ")} is out of range.`;
    },
    run: (args) => {
      const rows = [...rowsOf(ref)];
      const [moved] = rows.splice(args.from as number, 1);
      rows.splice(args.to as number, 0, moved);
      return onChange()(rows);
    },
  };
};

/** Publishes a by-reference setter while its control is usable; `disabled` also closes it to `fill<Model>Form`. */
export const useFieldTool = (onChange: unknown, { transform, disabled, sortable }: FieldToolOptions = {}) => {
  const surface = useSurface();
  const scope = useScopePath();
  const action = actionTagOf(onChange)?.action ?? null;
  const off = !!disabled;
  const live = useRef({ onChange, transform });
  live.current = { onChange, transform };
  const scopeKey = scope.join(".");
  useEffect(() => {
    if (!action || off) return;
    const ref = FormFields.ref(action);
    const schema = ref && FormFields.schema(ref.field);
    if (!ref || !schema) return;
    const entries: ToolEntry[] = [
      {
        name: action,
        description: `Set ${ref.key} on the ${ref.refName} form.`,
        parameters: { type: "object", properties: { value: schema }, required: ["value"], additionalProperties: false },
        run: (args) => {
          const checked = FormFields.checked(action, "value", ref.field, args.value === undefined ? null : args.value);
          return (live.current.onChange as (value: unknown) => unknown)(normalized(checked, live.current.transform));
        },
      },
      ...rowEntries(ref, schema),
      ...(sortable && ref.field.arrDepth > 0
        ? [moveEntry(ref, () => live.current.onChange as (value: unknown) => unknown)]
        : []),
    ];
    const registered = entries.map((entry) => surface.registerTool(scope, entry));
    return () => {
      for (const unregister of registered) unregister();
    };
  }, [surface, scopeKey, action, off, !!sortable]);
};
