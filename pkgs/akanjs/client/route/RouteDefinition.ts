import {
  type Cls,
  type EnumInstance,
  isEnum,
  PrimitiveRegistry,
  type PrimitiveScalar,
  type PromiseOrObject,
} from "akanjs/base";
import { parseAkanI18nEnv } from "akanjs/common";
import { deserialize } from "akanjs/constant";
import type { ReactNode } from "react";
import type { Head, LayoutModule, PageConfig, PageModule } from "../csrTypes";
import { AkanNotFoundError } from "../router";
import { RouteArgError, type RouteArgInfo, type RouteArgInput, type RouteBaseArgs } from "./routeArgs";

export type RouteArgsShape = Record<string, unknown>;
export type RouteKind = "page" | "layout" | "rootLayout";
/** Interned: a definition built inside the pages bundle must be recognised by a loader bundled apart from it. */
export const routeDefinitionMarker = Symbol.for("akan.routeDefinition");

type HeadStage<Args> = Head | ((args: Args) => PromiseOrObject<Head | null | undefined>);

interface RouteRenderProps {
  params: Record<string, string>;
  searchParams?: Record<string, string | string[]>;
  children?: ReactNode;
}

export interface RouteArgResolveOption {
  /** A prompt's arguments are strings a person typed: a list is comma-separated and a bad value is refused. */
  strict?: boolean;
}

/**
 * What a route file declares in place of named exports. The chain is the only surface — the module exports the
 * finished definition and the loader turns it back into the module shape every renderer already reads.
 */
export abstract class RouteDefinition<
  Args extends RouteArgsShape = Record<never, never>,
  Extra extends object = Record<never, never>,
> {
  readonly [routeDefinitionMarker] = true;
  abstract readonly kind: RouteKind;
  readonly args: RouteArgInfo[] = [];
  #config?: PageConfig;
  // Held as `never`-argument functions: a `PageDefinition<{ projectId }>` must still be a `RouteDefinition` to
  // the loaders, and a stage typed over `Args` would make the wider declaration unassignable to the plain one.
  #head?: HeadStage<never>;
  #loading?: (args: never) => PromiseOrObject<ReactNode>;
  #render?: (args: never) => PromiseOrObject<ReactNode>;

  config(config: PageConfig) {
    this.#config = config;
    return this;
  }
  head(head: HeadStage<RouteBaseArgs & Args>) {
    this.#head = head as HeadStage<never>;
    return this;
  }
  loading(render: (args: RouteBaseArgs & Args & Extra) => PromiseOrObject<ReactNode>) {
    this.#loading = render as (args: never) => PromiseOrObject<ReactNode>;
    return this;
  }
  render(render: (args: RouteBaseArgs & Args & Extra) => PromiseOrObject<ReactNode>) {
    this.#render = render as (args: never) => PromiseOrObject<ReactNode>;
    return this;
  }

  get pageConfig() {
    return this.#config;
  }

  protected declare(arg: RouteArgInfo) {
    if (arg.name === "lang")
      throw new Error(`[route-convention] ${this.kind}() receives "lang" on every route; it is never declared`);
    if (this.args.some((existing) => existing.name === arg.name))
      throw new Error(`[route-convention] ${this.kind}() declares "${arg.name}" twice`);
    this.args.push(arg);
  }

  /**
   * Typed values out of the URL halves the router matched. A path value the declared type refuses is a URL that
   * matched the pattern and nothing under it, so a page answers not-found; a search value that fails is dropped
   * the way an absent one is. Under `strict` both are refused by name, which is what a prompt caller can act on.
   */
  resolveArgs(input: RouteArgInput, { strict = false }: RouteArgResolveOption = {}): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const arg of this.args) {
      const raw = arg.kind === "param" ? input.params[arg.name] : input.searchParams[arg.name];
      if (raw === undefined || raw === "") {
        if (arg.kind === "param") throw new RouteArgError(arg, `Missing required argument "${arg.name}".`);
        continue;
      }
      const value = RouteDefinition.#lift(arg, raw, strict);
      try {
        resolved[arg.name] = RouteDefinition.#parse(arg, value);
      } catch {
        if (strict) throw new RouteArgError(arg, RouteDefinition.#invalidMessage(arg));
        if (arg.kind === "param") throw new AkanNotFoundError();
      }
    }
    return resolved;
  }

  /**
   * The `[x]` segments of the file's path against the `.param()` stages. A page must name every segment it sits
   * under, so nothing reaches its body undeclared; a layout may name a subset, since most read none of them.
   */
  assertPattern(pattern: string, key: string) {
    const inPath = pattern
      .split("/")
      .filter((part) => part.startsWith(":"))
      .map((part) => part.slice(1))
      .filter((name) => name !== "lang");
    const declared = this.args.filter((arg) => arg.kind === "param").map((arg) => arg.name);
    const unknown = declared.find((name) => !inPath.includes(name));
    if (unknown)
      throw new Error(
        `[route-convention] ${key} declares .param("${unknown}") but no [${unknown}] segment is in its path`,
      );
    const undeclared = inPath.find((name) => !declared.includes(name));
    if (this.kind === "page" && undeclared)
      throw new Error(
        `[route-convention] ${key} sits under [${undeclared}] but declares no .param("${undeclared}") — a page reads only what it declares`,
      );
  }

  /** The module shape every route loader reads, so a chain and a legacy module walk one path from here on. */
  toRouteModule(): PageModule & LayoutModule {
    const render = this.#render;
    if (!render)
      throw new Error(`[route-convention] a ${this.kind}() chain ends with .render(), and this one has none`);
    const head = this.#head;
    const loading = this.#loading;
    const module: PageModule & LayoutModule = {
      default: (async (props: RouteRenderProps) => await render(this.#argsOf(props) as never)) as never,
      ...(this.#config ? { pageConfig: this.#config } : {}),
      ...(head === undefined
        ? {}
        : typeof head === "function"
          ? { generateHead: async (props: RouteRenderProps) => await head(this.#argsOf(props) as never) }
          : { head }),
      ...(loading
        ? {
            Loading: ((props: RouteRenderProps) =>
              loading(this.#argsOf({ ...props, searchParams: {} }) as never)) as never,
          }
        : {}),
    };
    return this.extendModule(module);
  }

  protected extendModule(module: PageModule & LayoutModule): PageModule & LayoutModule {
    return module;
  }

  #argsOf(props: RouteRenderProps): RouteBaseArgs & Args & Extra {
    const { lang = parseAkanI18nEnv().defaultLocale } = props.params;
    const resolved = this.resolveArgs({ params: props.params, searchParams: props.searchParams ?? {} });
    const args = { lang, ...resolved };
    return (this.kind === "page" ? args : { ...args, children: props.children }) as RouteBaseArgs & Args & Extra;
  }

  /**
   * A single value where a list was declared is a one-item list: the URL spells `?tags=a` for one tag. A prompt
   * argument is one string whatever it holds, so under `strict` a list is read comma-separated.
   */
  static #lift(arg: RouteArgInfo, raw: string | string[], strict: boolean): unknown {
    if (!arg.list) return Array.isArray(raw) ? raw[0] : raw;
    if (Array.isArray(raw)) return raw;
    return strict
      ? raw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [raw];
  }

  static #parse(arg: RouteArgInfo, value: unknown): unknown {
    const enumRef = isEnum(arg.type as Cls) ? (arg.type as EnumInstance) : undefined;
    const scalar = (enumRef ? enumRef.type : arg.type) as typeof PrimitiveScalar;
    return deserialize(scalar as never, arg.list ? 1 : 0, value, { key: arg.name, enum: enumRef });
  }

  static #invalidMessage(arg: RouteArgInfo): string {
    if (isEnum(arg.type as Cls))
      return `Invalid argument "${arg.name}": expected one of ${(arg.type as EnumInstance).values.join(", ")}.`;
    const name = PrimitiveRegistry.has(arg.type as Cls)
      ? PrimitiveRegistry.getName(arg.type as typeof PrimitiveScalar)
      : "a value";
    return `Invalid argument "${arg.name}": expected ${name}${arg.list ? "[]" : ""}.`;
  }
}
