"use client";
import type { DataList } from "akanjs/base";
import type { JsonSchema } from "use-agentic";
import { useScopePath, useSurface } from "use-agentic";
import { actionTagOf } from "../actionTag";
// Through the `"use client"` shim, not `react` — see `StToolBuilder`.
import { useEffect, useRef } from "../hooks";
import { FormFields } from "./formFields";

export interface RelationFieldSource<T extends { id: string }> {
  /** Read live from the store rather than closed over: `load` below changes the list mid-call. */
  read: () => DataList<T>;
  load: () => Promise<unknown> | unknown;
  label: (model: T) => string;
  disabled?: boolean;
}

/** A relation picker's two tools: list the pickable documents (loading them first), then set by id. */
export const useRelationFieldTool = <T extends { id: string }>(
  onChange: unknown,
  { read, load, label, disabled }: RelationFieldSource<T>,
) => {
  const surface = useSurface();
  const scope = useScopePath();
  const action = actionTagOf(onChange)?.action ?? null;
  const live = useRef({ onChange, read, load, label });
  live.current = { onChange, read, load, label };
  const scopeKey = scope.join(".");
  useEffect(() => {
    if (!action || disabled) return;
    const ref = FormFields.ref(action);
    const target = ref && FormFields.relationOf(ref.field);
    // A describable field is `useFieldTool`'s: two setters under one name would give one action two shapes.
    if (!ref || !target || FormFields.schema(ref.field)) return;
    const many = ref.field.arrDepth > 0;
    const nullable = !!ref.field.nullable && !many;
    const listName = FormFields.optionsToolName(ref.refName, ref.key);
    const argName = many ? `${ref.key}Ids` : `${ref.key}Id`;
    const id: JsonSchema = { type: "string" };
    const options = () => live.current.read().map((model) => ({ id: model.id, label: live.current.label(model) }));
    const idsIn = (args: Record<string, unknown>): unknown => {
      const value = args[argName];
      if (nullable && (value === null || value === undefined)) return [];
      return many ? value : [value];
    };
    const offList = surface.registerTool(scope, {
      name: listName,
      description: `List the ${target}s the ${ref.refName} form can pick for ${ref.key}, loading them first. Pass an id from it to ${action}.`,
      settle: false,
      run: async () => {
        await live.current.load();
        return options();
      },
    });
    const offSet = surface.registerTool(scope, {
      name: action,
      description: `Set ${ref.key} on the ${ref.refName} form to ${many ? `${target}s` : `one ${target}`}, by id. Call ${listName} first for the ids.`,
      parameters: {
        type: "object",
        properties: { [argName]: many ? { type: "array", items: id } : id },
        ...(nullable ? {} : { required: [argName] }),
        additionalProperties: false,
      },
      guard: (args) => {
        const ids = idsIn(args);
        if (!Array.isArray(ids)) return `"${argName}" of ${action} must be an array of ids.`;
        const list = live.current.read();
        const missing = ids.filter((value) => typeof value !== "string" || !list.get(value));
        if (!missing.length) return true;
        if (!list.length) return `No ${target} is loaded yet. Call ${listName} first for the ids.`;
        return `The ${ref.refName} form offers no ${target} ${missing.join(", ")}. It offers: ${list
          .map((model) => `${model.id} (${live.current.label(model)})`)
          .join(", ")}.`;
      },
      run: (args) => {
        const list = live.current.read();
        const setter = live.current.onChange as (value: unknown) => unknown;
        const picked = (idsIn(args) as string[]).flatMap((value) => {
          const model = list.get(value);
          return model ? [model] : [];
        });
        return setter(many ? picked : (picked[0] ?? null));
      },
    });
    return () => {
      offList();
      offSet();
    };
  }, [surface, scopeKey, action, disabled]);
};
