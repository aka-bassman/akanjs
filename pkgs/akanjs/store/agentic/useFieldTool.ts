"use client";
import { useScopePath, useSurface } from "use-agentic";
import { actionTagOf } from "../actionTag";
// Through the `"use client"` shim, not `react` — see `StToolBuilder`.
import { useEffect, useRef } from "../hooks";
import { FormFields } from "./formFields";

/**
 * Publishes the setter a form control is already holding, for exactly as long as the control is on screen.
 *
 * The control is the declaration — the same rule the rest of the surface follows. A handler passed by reference
 * (`onChange={st.do.setTitleOnTask}`) names the field it writes, so the tool and the person press one function;
 * an inline arrow names nothing and publishes nothing, which is the existing `data-akan-action` rule with
 * consequences. Publishing from the form's subscription instead would offer every field of the model, including
 * the ones this template draws no control for.
 */
export const useFieldTool = (onChange: unknown) => {
  const surface = useSurface();
  const scope = useScopePath();
  const action = actionTagOf(onChange)?.action ?? null;
  const live = useRef(onChange);
  live.current = onChange;
  const scopeKey = scope.join(".");
  useEffect(() => {
    if (!action) return;
    const ref = FormFields.ref(action);
    const schema = ref && FormFields.schema(ref.field);
    if (!ref || !schema) return;
    return surface.registerTool(scope, {
      name: action,
      description: `Set ${ref.key} on the ${ref.refName} form.`,
      parameters: { type: "object", properties: { value: schema }, required: ["value"], additionalProperties: false },
      effect: "state",
      run: (args) =>
        (live.current as (value: unknown) => unknown)(
          FormFields.checked(action, "value", ref.field, args.value === undefined ? null : args.value),
        ),
    });
  }, [surface, scopeKey, action]);
};
