import type { FieldToValue, ParamFieldType } from "akanjs/constant";

/** A scalar (`ID`, `String`, `Int`, `Float`, `Boolean`, `Date`) or an `enumOf` class — what a URL segment can carry. */
export type RouteArgType = ParamFieldType;
/** A search argument may also be a flat list, written `[String]`; the URL repeats the key or comma-separates it. */
export type RouteSearchType = RouteArgType | [RouteArgType];
export type RouteArgValue<T> = T extends [infer Item] ? FieldToValue<Item>[] : FieldToValue<T>;

export interface RouteArgOption {
  /** What the value is, read by the person filling the MCP prompt form in — so English. */
  desc?: string;
}

/** Every route sits under `/:lang`, so the locale segment reaches each stage as `lang` with no `.param()` for it. */
export interface RouteBaseArgs {
  lang: string;
}

export interface RouteArgInfo {
  kind: "param" | "search";
  name: string;
  type: RouteArgType;
  list: boolean;
  desc?: string;
}

export interface RouteArgInput {
  params: Record<string, string>;
  searchParams: Record<string, string | string[]>;
}

/** What the page prompt catalogue publishes for one declared argument. */
export interface RoutePromptArgument {
  name: string;
  description?: string;
  required: boolean;
}

export interface RoutePromptMeta {
  name: string;
  description: string;
  arguments: RoutePromptArgument[];
}

export class RouteArgError extends Error {
  readonly arg: RouteArgInfo;
  constructor(arg: RouteArgInfo, message: string) {
    super(message);
    this.arg = arg;
  }
}
