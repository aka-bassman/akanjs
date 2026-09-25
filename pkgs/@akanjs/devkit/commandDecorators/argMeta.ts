import type {
  AppExecutor,
  Executor,
  LibExecutor,
  ModuleExecutor,
  PkgExecutor,
  SysExecutor,
  WorkspaceExecutor,
} from "../executors";
import { COMMAND_META, type CommandCls } from "./targetMeta";

export const argTypes = ["Argument", "Option"] as const;
export type ArgType = (typeof argTypes)[number];

export const internalArgTypes = ["Workspace", "App", "Apps", "Lib", "Sys", "Pkg", "Module", "Exec"] as const;
export type InternalArgType = (typeof internalArgTypes)[number];

export type PrimitiveArgType = StringConstructor | NumberConstructor | BooleanConstructor;
export type NormalizedPrimitiveArgType = "string" | "number" | "boolean";

export type CommandContext = {
  values: Record<string, unknown>;
  app?: AppExecutor;
  lib?: LibExecutor;
  sys?: SysExecutor;
  pkg?: PkgExecutor;
  module?: ModuleExecutor;
  exec?: Executor;
};

export type EnumChoice = string | number | { label: string; value: string | number | boolean };
export type EnumChoices = readonly EnumChoice[];
export type DynamicEnum<Context> = (context: Context) => EnumChoices | Promise<EnumChoices>;

export interface ArgsOption<Context = CommandContext> {
  type?: "string" | "number" | "boolean";
  flag?: string;
  desc?: string;
  default?: string | number | boolean;
  nullable?: boolean;
  example?: string | number | boolean;
  enum?: EnumChoices | DynamicEnum<Context>;
  ask?: string;
}
export interface ArgMeta<Context = CommandContext> {
  name: string;
  argsOption: ArgsOption<Context>;
  key: string;
  idx: number;
  type: ArgType;
}
export interface InternalArgMeta {
  key: string;
  idx: number;
  type: InternalArgType;
  option?: { nullable?: boolean };
}

export const getArgMetas = (
  command: CommandCls,
  key: string,
): [(ArgMeta | InternalArgMeta)[], ArgMeta[], (ArgMeta | InternalArgMeta)[]] => {
  const allArgMetas = [...(command[COMMAND_META]?.get(key)?.args ?? [])];
  const argMetas = allArgMetas.filter((argMeta): argMeta is ArgMeta => argMeta.type === "Option");
  const internalArgMetas = allArgMetas.filter((argMeta) => argMeta.type !== "Option");
  return [allArgMetas, argMetas, internalArgMetas];
};

export interface InternalArgToken<T = unknown, Type extends InternalArgType = InternalArgType> {
  type: Type;
  _value: T;
}

const createInternalArgToken = <T, Type extends InternalArgType>(type: Type) => ({ type }) as InternalArgToken<T, Type>;

export const normalizePrimitiveArgType = (type: PrimitiveArgType): NormalizedPrimitiveArgType => {
  if (type === String) return "string";
  if (type === Number) return "number";
  if (type === Boolean) return "boolean";
  throw new Error(`Invalid primitive argument type: ${type}`);
};

export const App = createInternalArgToken<AppExecutor, "App">("App");
export type App = AppExecutor;

/**
 * One or more apps, from a variadic positional (`akan start a b`, `akan start a,b`, `akan start all`)
 * or a checkbox when none is named. Reach for it only where running several is meaningful — every other
 * command takes `App`, whose single-select is unchanged.
 */
export const Apps = createInternalArgToken<AppExecutor[], "Apps">("Apps");
export type Apps = AppExecutor[];

export const Lib = createInternalArgToken<LibExecutor, "Lib">("Lib");
export type Lib = LibExecutor;

export const Sys = createInternalArgToken<SysExecutor, "Sys">("Sys");
export type Sys = SysExecutor;

export const Exec = createInternalArgToken<Executor, "Exec">("Exec");
export type Exec = Executor;

export const Pkg = createInternalArgToken<PkgExecutor, "Pkg">("Pkg");
export type Pkg = PkgExecutor;

export const Module = createInternalArgToken<ModuleExecutor, "Module">("Module");
export type Module = ModuleExecutor;

export const Workspace = createInternalArgToken<WorkspaceExecutor, "Workspace">("Workspace");
export type Workspace = WorkspaceExecutor;
