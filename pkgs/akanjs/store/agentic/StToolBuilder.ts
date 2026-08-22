import {
  type CLIENT_VALUE,
  type Cls,
  dayjs,
  type EnumInstance,
  Int,
  isEnum,
  PrimitiveRegistry,
  type PrimitiveScalar,
} from "akanjs/base";
import type { ParamFieldType } from "akanjs/constant";
import {
  AgenticSurface,
  type JsonSchema,
  type ToolConfirm,
  type ToolEffect,
  type ToolGuard,
  useScopePath,
  useSurface,
} from "use-agentic";
import { tagAction } from "../actionTag";
// Through the `"use client"` shim, not `react` — the RSC pages bundle stubs client modules per file, and a raw
// react-hook import here resolves against react's react-server build, which has no hooks. Same as `storeInstance`.
import { useEffect, useRef } from "../hooks";

export interface StToolMeta {
  desc?: string;
  effect?: ToolEffect;
  confirm?: ToolConfirm;
  guard?: ToolGuard;
}

interface StToolArg {
  name: string;
  type: ParamFieldType;
  optional: boolean;
}

type ArgValue<T> = T extends EnumInstance<string, infer V> ? V : T extends { [CLIENT_VALUE]: infer V } ? V : never;

/**
 * A component tool in the signal's vocabulary: `st.tool("x", { desc }).arg("id", ID).exec(fn)`.
 *
 * This is not A12's rejected store-action builder — a store action derives its schema from the endpoint it is
 * named after, while a component tool exists nowhere else, so declaring is the only source there is. `.arg()` only
 * accumulates data; `.exec()` is the one hook, so the chain must complete in one unconditional statement.
 */
export class StToolBuilder<Args extends unknown[] = []> {
  readonly #name: string;
  readonly #meta: StToolMeta;
  readonly #args: StToolArg[];

  constructor(name: string, meta: StToolMeta = {}, args: StToolArg[] = []) {
    this.#name = name;
    this.#meta = meta;
    this.#args = args;
  }

  arg<T extends ParamFieldType>(name: string, type: T): StToolBuilder<[...Args, ArgValue<T>]>;
  arg<T extends ParamFieldType>(
    name: string,
    type: T,
    option: { optional: true },
  ): StToolBuilder<[...Args, ArgValue<T> | null]>;
  arg<T extends ParamFieldType>(
    name: string,
    type: T,
    option: { optional?: boolean } = {},
  ): StToolBuilder<[...Args, ArgValue<T> | null]> {
    // Rejects an unsupported type where it is written, not on the agent's first call.
    StToolBuilder.schemaOf(type);
    return new StToolBuilder(this.#name, this.#meta, [...this.#args, { name, type, optional: !!option.optional }]);
  }

  /** The only hook in the chain. `run`, `guard`, and `confirm` stay always-latest; the declaration is mount-static. */
  exec(run: (...args: Args) => unknown): (...args: Args) => Promise<void> {
    const surface = useSurface();
    const scope = useScopePath();
    const live = useRef({ run, meta: this.#meta });
    live.current = { run, meta: this.#meta };
    const declared = useRef<{ name: string; meta: StToolMeta; args: StToolArg[] } | null>(null);
    declared.current ??= { name: this.#name, meta: this.#meta, args: this.#args };
    const callable = useRef<((...args: Args) => Promise<void>) | null>(null);
    if (!callable.current) {
      const action = AgenticSurface.fullName(scope, this.#name);
      callable.current = tagAction(
        async (...args: Args) => {
          await live.current.run(...args);
        },
        { action },
      );
    }
    const scopeKey = scope.join(".");
    useEffect(() => {
      const spec = declared.current;
      if (!spec) return;
      return surface.registerTool(scope, {
        name: spec.name,
        description: spec.meta.desc,
        effect: spec.meta.effect,
        parameters: StToolBuilder.parametersOf(spec.args),
        // A `remove*` tool confirms unless it declares otherwise — destructiveness read off the key, as MCP hints are.
        ...(spec.meta.confirm === undefined && !spec.name.startsWith("remove")
          ? {}
          : {
              confirm: (args: Record<string, unknown>) => {
                const confirm = live.current.meta.confirm ?? spec.name.startsWith("remove");
                return typeof confirm === "function" ? confirm(args) : confirm;
              },
            }),
        ...(spec.meta.guard === undefined
          ? {}
          : { guard: (args: Record<string, unknown>) => live.current.meta.guard?.(args) ?? true }),
        run: (named) => live.current.run(...(StToolBuilder.positionalOf(spec.name, spec.args, named) as Args)),
      });
    }, [surface, scopeKey, this.#name]);
    return callable.current;
  }

  static parametersOf(args: StToolArg[]): JsonSchema | undefined {
    if (!args.length) return undefined;
    const required = args.filter((arg) => !arg.optional).map((arg) => arg.name);
    return {
      type: "object",
      properties: Object.fromEntries(args.map((arg) => [arg.name, StToolBuilder.schemaOf(arg.type)])),
      ...(required.length ? { required } : {}),
      additionalProperties: false,
    };
  }

  /** Scalars and enums only — the value arrives as JSON from a model, so a class instance has no way in. */
  static schemaOf(type: ParamFieldType): JsonSchema {
    if (isEnum(type as Cls)) {
      const enumRef = type as EnumInstance;
      const kind = enumRef.type === String ? "string" : enumRef.type === Int ? "integer" : "number";
      return { type: kind, enum: [...enumRef.values] };
    }
    const scalar = type as typeof PrimitiveScalar;
    if (!PrimitiveRegistry.has(scalar as unknown as Cls))
      throw new Error("st.tool takes scalar and enum arguments only.");
    switch (PrimitiveRegistry.getName(scalar)) {
      case "ID":
      case "String":
        return { type: "string" };
      case "Int":
        return { type: "integer" };
      case "Float":
        return { type: "number" };
      case "Boolean":
        return { type: "boolean" };
      case "Date":
        return { type: "string", format: "date-time" };
      default:
        throw new Error(`st.tool cannot describe the scalar ${PrimitiveRegistry.getName(scalar)}.`);
    }
  }

  static positionalOf(toolName: string, args: StToolArg[], named: Record<string, unknown>): unknown[] {
    return args.map((arg) => {
      const value = named[arg.name];
      if (value === undefined || value === null) {
        if (arg.optional) return null;
        throw new Error(`Missing argument "${arg.name}" for ${toolName}.`);
      }
      return StToolBuilder.checkedValue(toolName, arg.name, arg.type, value);
    });
  }

  /** What `AgentBridge` does for endpoint arguments, for a component tool's own — nothing on the wire enforces the published schema. */
  static checkedValue(toolName: string, argName: string, type: ParamFieldType, value: unknown): unknown {
    if (isEnum(type as Cls)) {
      const enumRef = type as EnumInstance;
      if (!enumRef.values.includes(value as never))
        throw new Error(`Argument "${argName}" of ${toolName} must be one of: ${[...enumRef.values].join(", ")}.`);
      return value;
    }
    switch (PrimitiveRegistry.getName(type as typeof PrimitiveScalar)) {
      case "ID":
      case "String":
        if (typeof value !== "string") throw new Error(`Argument "${argName}" of ${toolName} must be a string.`);
        return value;
      case "Int":
        if (!Number.isInteger(value)) throw new Error(`Argument "${argName}" of ${toolName} must be a whole number.`);
        return value;
      case "Float":
        if (typeof value !== "number" || !Number.isFinite(value))
          throw new Error(`Argument "${argName}" of ${toolName} must be a finite number.`);
        return value;
      case "Boolean":
        if (typeof value !== "boolean") throw new Error(`Argument "${argName}" of ${toolName} must be a boolean.`);
        return value;
      case "Date": {
        const parsed = dayjs(value as string | number | Date);
        if (!parsed.isValid()) throw new Error(`Argument "${argName}" of ${toolName} must be an ISO 8601 date string.`);
        return parsed;
      }
      default:
        return value;
    }
  }
}
