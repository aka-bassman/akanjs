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

/**
 * A control's `transform` is what it does to every value a person types, so an agent's write goes through it too —
 * otherwise a `Field.Phone` stores `010-1234-5678` for the person and the raw digits for the agent. It normalizes
 * one scalar, so an array-valued control (`TextList`, `Tags`, `DoubleNumber`) applies it per element. A cleared
 * nullable field stays null: a normalizer written for a value would turn it into one.
 */
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

/**
 * Append and remove-by-index for an array of embedded rows, beside the whole-array setter.
 *
 * Not new authority: the setter this control already published can produce any array these two can, so they are
 * strictly weaker — which is what makes deriving them from the same field sound. What they add is that neither can
 * touch a row it was not given, so the agent stops having to retype the rows it is leaving alone.
 *
 * Both take a list and act atomically. Removing indices one call at a time would shift the ones not yet removed, so
 * `sub` filters the whole set at once, the way the generated action already does.
 *
 * `add` appends and publishes no insert position: the `+` a person presses always appends, and the framework cannot
 * see the `limit` an app may pass from its own `onAdd`. `addOrSub` is never published — it matches by `indexOf`, so
 * on rows it compares by reference and every toggle would append.
 */
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
      effect: "state",
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
      effect: "state",
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

/**
 * Publishes the setter a form control is already holding, for exactly as long as the control is on screen.
 *
 * The control is the declaration — the same rule the rest of the surface follows. A handler passed by reference
 * (`onChange={st.do.setTitleOnTask}`) names the field it writes, so the tool and the person press one function;
 * an inline arrow names nothing and publishes nothing, which is the existing `data-akan-action` rule with
 * consequences. Publishing from the form's subscription instead would offer every field of the model, including
 * the ones this template draws no control for.
 */
export const useFieldTool = (onChange: unknown, transform?: unknown) => {
  const surface = useSurface();
  const scope = useScopePath();
  const action = actionTagOf(onChange)?.action ?? null;
  const live = useRef({ onChange, transform });
  live.current = { onChange, transform };
  const scopeKey = scope.join(".");
  useEffect(() => {
    if (!action) return;
    const ref = FormFields.ref(action);
    const schema = ref && FormFields.schema(ref.field);
    if (!ref || !schema) return;
    const entries: ToolEntry[] = [
      {
        name: action,
        description: `Set ${ref.key} on the ${ref.refName} form.`,
        parameters: { type: "object", properties: { value: schema }, required: ["value"], additionalProperties: false },
        effect: "state",
        run: (args) => {
          const checked = FormFields.checked(action, "value", ref.field, args.value === undefined ? null : args.value);
          return (live.current.onChange as (value: unknown) => unknown)(normalized(checked, live.current.transform));
        },
      },
      ...rowEntries(ref, schema),
    ];
    const registered = entries.map((entry) => surface.registerTool(scope, entry));
    return () => {
      for (const unregister of registered) unregister();
    };
  }, [surface, scopeKey, action]);
};
