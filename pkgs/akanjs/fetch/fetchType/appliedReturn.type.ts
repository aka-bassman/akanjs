import type { DataList, GetStateObject, PromiseOrObject } from "akanjs/base";
import type { ExtractSort, FilterInstance } from "akanjs/document";

/** Metadata that identifies a generated slice list/insight request. */
export type SliceMeta = {
  refName: string;
  sliceName: string;
  argLength: number;
};

/** What the root slice takes: one of the model's declared filter queries, and the args that filter asks for. */
export interface QuerySetting {
  queryKey: string;
  /**
   * Read when the query is applied rather than when the setting is written, so a thunk keeps an arg relative to
   * now — `() => [dayjs().subtract(1, "hour")]` — current at the moment the user asks for it.
   */
  args?: unknown[] | (() => unknown[]);
  /**
   * The same list under the name the rest of the framework already uses for it — the `queryArgsOf<Model>` state
   * key, `refresh<Model>({ queryArgs })`, and a field's own `.meta(...)` declaration. Accepted so a query a
   * field declares is one of these as it stands, rather than something every caller has to rename by hand.
   * `args` wins when both are given.
   */
  queryArgs?: unknown[] | (() => unknown[]);
}

type ServerInitShape<
  RefName extends string,
  QueryArgs,
  CapRefName extends string,
  LightObj,
  InsightObj,
  Sort,
> = SliceMeta & {
  [K in `${RefName}ObjList`]: LightObj[];
} & {
  /** `null` when the caller passed `{ insight: false }`: the aggregate query was never made. */
  [K in `${RefName}ObjInsight`]: InsightObj | null;
} & {
  [K in `pageOf${CapRefName}`]: number;
} & {
  [K in `lastPageOf${CapRefName}`]: number;
} & {
  [K in `limitOf${CapRefName}`]: number;
} & {
  [K in `queryArgsOf${CapRefName}`]: QueryArgs;
} & {
  [K in `sortOf${CapRefName}`]: Sort;
} & {
  [K in `${RefName}InitAt`]: Date;
};

export type ServerInit<
  RefName extends string,
  Light,
  Insight = any,
  QueryArgs = any,
  Filter extends FilterInstance = any,
> = ServerInitShape<
  RefName,
  QueryArgs,
  Capitalize<RefName>,
  GetStateObject<Light>,
  GetStateObject<Insight>,
  ExtractSort<Filter>
>;
/** Client/server-friendly return type for initialized list and insight data. */
export type ClientInit<
  RefName extends string,
  Light,
  Insight = any,
  QueryArgs = any,
  Filter extends FilterInstance = any,
> = PromiseOrObject<ServerInit<RefName, Light, Insight, QueryArgs, Filter>>;

export type ServerView<RefName extends string, Model> = { refName: RefName } & {
  [K in `${RefName}Obj`]: GetStateObject<Model>;
} & {
  [K in `${RefName}ViewAt`]: Date;
};
/** Client/server-friendly return type for a single model view payload. */
export type ClientView<RefName extends string, Model> = PromiseOrObject<ServerView<RefName, Model>>;

export type ServerEdit<RefName extends string, Model> = { refName: RefName } & {
  [K in `${RefName}Obj`]: GetStateObject<Model>;
} & {
  [K in `${RefName}ViewAt`]: Date;
};
export type ClientEdit<RefName extends string, Model> = PromiseOrObject<ServerEdit<RefName, Model>>;

export type ViewReturn<RefName extends string, Full> = {
  [K in RefName]: Full;
} & {
  [K in `${RefName}View`]: ServerView<RefName, Full>;
};

export type EditReturn<RefName extends string, Full> = {
  [K in RefName]: Full;
} & {
  [K in `${RefName}Edit`]: ServerEdit<RefName, Full>;
};

/**
 * What `fetch.view<Model>` / `fetch.edit<Model>` / `fetch.init<Model><Suffix>` return: awaitable for the shape
 * the helper has always given, and destructurable into one promise per field for a route that wants each
 * section to render as its own data lands instead of holding the page for the slowest.
 */
export type FetchHandleOf<Awaited, Fields> = PromiseLike<Awaited> & Fields;

export type ViewHandle<RefName extends string, Full> = FetchHandleOf<
  ViewReturn<RefName, Full>,
  {
    [K in RefName]: Promise<Full>;
  } & {
    [K in `${RefName}View`]: Promise<ServerView<RefName, Full>>;
  }
>;

export type EditHandle<RefName extends string, Full> = FetchHandleOf<
  EditReturn<RefName, Full>,
  {
    [K in RefName]: Promise<Full>;
  } & {
    [K in `${RefName}Edit`]: Promise<ServerEdit<RefName, Full>>;
  }
>;

type InitReturnShape<
  RefName extends string,
  CapSuffix extends string,
  Init,
  ListItem extends { id: string },
  Insight,
> = {
  [K in `${RefName}Init${CapSuffix}`]: Init;
} & {
  [K in `${RefName}List${CapSuffix}`]: DataList<ListItem>;
} & { [K in `${RefName}Insight${CapSuffix}`]: Insight };

export type InitReturn<
  RefName extends string,
  Suffix extends string,
  Light,
  Insight,
  Args,
  Filter extends FilterInstance,
> = InitReturnShape<
  RefName,
  Capitalize<Suffix>,
  ServerInit<RefName, Light, Insight, Args, Filter>,
  Light extends { id: string } ? Light : { id: string },
  Insight
>;

/**
 * The list resolves without waiting for the aggregate, so `x<Slice>List` lands before `x<Slice>Init` — which
 * carries `lastPageOf<Model>` and therefore needs the count.
 *
 * `x<Slice>List` and `x<Slice>Insight` hold hydrated model instances, which React Flight refuses as props to a
 * client component: consume them in a server component and hand `x<Slice>Init` to a `Zone`.
 */
type InitHandleShape<
  RefName extends string,
  CapSuffix extends string,
  Init,
  ListItem extends { id: string },
  Insight,
> = {
  [K in `${RefName}Init${CapSuffix}`]: Promise<Init>;
} & {
  [K in `${RefName}List${CapSuffix}`]: Promise<DataList<ListItem>>;
} & { [K in `${RefName}Insight${CapSuffix}`]: Promise<Insight> };

export type InitHandle<
  RefName extends string,
  Suffix extends string,
  Light,
  Insight,
  Args,
  Filter extends FilterInstance,
> = FetchHandleOf<
  InitReturn<RefName, Suffix, Light, Insight, Args, Filter>,
  InitHandleShape<
    RefName,
    Capitalize<Suffix>,
    ServerInit<RefName, Light, Insight, Args, Filter>,
    Light extends { id: string } ? Light : { id: string },
    Insight
  >
>;

// ============= Method Generators =============
