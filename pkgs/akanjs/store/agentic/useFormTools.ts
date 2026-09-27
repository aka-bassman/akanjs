"use client";
import { capitalize } from "akanjs/common";
import { AgenticSurface, useScopePath, useSurface } from "use-agentic";
// Through the `"use client"` shim, not `react` — see `StToolBuilder`.
import { useEffect, useRef } from "../hooks";
import { FormFields } from "./formFields";

/** Publishes `fill<Model>Form`: a patch over every writable field, gated per field by the controls on screen. */
export const useFormTools = (refName: string | null, write: (action: string, value: unknown) => void) => {
  const surface = useSurface();
  const scope = useScopePath();
  const live = useRef(write);
  live.current = write;
  const scopeKey = scope.join(".");
  useEffect(() => {
    if (!refName) return;
    const fields = FormFields.patchable(refName);
    if (!fields.length) return;
    const byKey = new Map(fields.map((entry) => [entry.key, entry]));
    const name = `fill${capitalize(refName)}Form`;
    const offered = () =>
      fields.filter(
        (entry) =>
          FormFields.isComposite(entry.field) || !!surface.tool(AgenticSurface.fullName(scope, entry.action), scope),
      );
    return surface.registerTool(scope, {
      name,
      description: `Fill fields of the ${refName} form. Sends a patch — a field left out keeps its value.`,
      parameters: {
        type: "object",
        properties: Object.fromEntries(fields.map((entry) => [entry.key, entry.schema])),
        additionalProperties: false,
      },
      guard: (args) => {
        const keys = Object.keys(args);
        if (!keys.length) return "Name at least one field to fill.";
        const open = new Set(offered().map((entry) => entry.key));
        const closed = keys.filter((key) => !open.has(key));
        if (!closed.length) return true;
        return `This screen offers no ${closed.join(", ")} on the ${refName} form. It offers: ${
          [...open].join(", ") || "nothing"
        }.`;
      },
      run: (args) => {
        // Checked in full first, so a bad field never leaves the form half-patched.
        const patch = Object.entries(args).map(([key, value]) => {
          const entry = byKey.get(key);
          if (!entry) throw new Error(`The ${refName} form has no field "${key}".`);
          return { entry, value: FormFields.checked(name, key, entry.field, value) };
        });
        // Through the control's own tool where there is one, so its `transform` applies; a composite dispatches.
        for (const { entry, value } of patch) {
          const control = surface.tool(AgenticSurface.fullName(scope, entry.action), scope);
          if (control?.run) void control.run({ value });
          else live.current(entry.action, value);
        }
      },
    });
  }, [surface, scopeKey, refName]);
};
