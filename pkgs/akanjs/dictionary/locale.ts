import type { GetStateObject, MergedValues } from "akanjs/base";
import type { BaseInsight, BaseObject } from "akanjs/constant";
import type { FilterCls, FilterInfo, FilterInstance } from "akanjs/document";
import type { EndpInfoArgNames, EndpointInfo, SliceInfo, SliceInfoArgNames, SliceInfoRefName } from "akanjs/signal";
import type { ModelDictInfo, ScalarDictInfo, ServiceDictInfo } from ".";

interface Trans {
  t: string;
}
interface FieldTrans {
  t: string;
  desc?: string;
}
interface FnTrans<ArgKey extends string> {
  t: string;
  desc?: string;
  arg?: { [key in ArgKey]: FieldTrans };
}
type AnyFilterShape = FilterInstance<Record<string, FilterInfo>, Record<string, unknown>>;
type DictFilterShape<Filter> = Filter extends FilterInstance
  ? Filter
  : Filter extends FilterCls<infer FilterShape>
    ? FilterShape
    : Filter extends { query: Record<string, FilterInfo>; sort: Record<string, unknown> }
      ? Filter
      : AnyFilterShape;
type DictFilterQuery<Filter> = DictFilterShape<Filter>["query"];
type DictFilterSort<Filter> = DictFilterShape<Filter>["sort"];
type FilterTranslatorKey<Filter> = {
  [Key in keyof DictFilterQuery<Filter> & string]:
    | `${Key}`
    | `${Key}.desc`
    | (DictFilterQuery<Filter>[Key] extends FilterInfo<infer ArgNames, any>
        ? ArgNames[number] extends string
          ? `${Key}.arg.${ArgNames[number]}` | `${Key}.arg.${ArgNames[number]}.desc`
          : never
        : never);
}[keyof DictFilterQuery<Filter> & string];
type EndpointTranslatorKey<Endpoint extends { [key: string]: EndpointInfo }> = {
  [Key in keyof Endpoint & string]:
    | `${Key}`
    | `${Key}.desc`
    | `${Key}.arg.${EndpInfoArgNames<Endpoint[Key]>[number]}`
    | `${Key}.arg.${EndpInfoArgNames<Endpoint[Key]>[number]}.desc`;
}[keyof Endpoint & string];
type SliceTranslatorKey<Slice> = {
  [Key in keyof Slice & string]: Slice[Key] extends infer Info extends SliceInfo
    ?
        | `${SliceInfoRefName<Info>}List${Capitalize<Key>}`
        | `${SliceInfoRefName<Info>}List${Capitalize<Key>}.desc`
        | `${SliceInfoRefName<Info>}List${Capitalize<Key>}.arg.${SliceInfoArgNames<Info>[number] | "skip" | "limit" | "sort"}`
        | `${SliceInfoRefName<Info>}List${Capitalize<Key>}.arg.${SliceInfoArgNames<Info>[number] | "skip" | "limit" | "sort"}.desc`
        | `${SliceInfoRefName<Info>}Insight${Capitalize<Key>}`
        | `${SliceInfoRefName<Info>}Insight${Capitalize<Key>}.desc`
        | `${SliceInfoRefName<Info>}Insight${Capitalize<Key>}.arg.${SliceInfoArgNames<Info>[number]}`
        | `${SliceInfoRefName<Info>}Insight${Capitalize<Key>}.arg.${SliceInfoArgNames<Info>[number]}.desc`
    : never;
}[keyof Slice & string];

type SliceApiTrans<
  T extends string,
  Suffix extends string,
  ArgName extends string,
  _CapitalizedSuffix extends string = Capitalize<Suffix>,
> = {
  [K in `${T}List${_CapitalizedSuffix}`]: FnTrans<ArgName | "skip" | "limit" | "sort">;
} & {
  [K in `${T}Insight${_CapitalizedSuffix}`]: FnTrans<ArgName>;
};
type BaseModelCrudGetApiTrans<T extends string> = {
  [K in T]: FnTrans<`${T}Id`>;
} & {
  [K in `light${T}`]: FnTrans<`${T}Id`>;
} & {
  [K in `create${T}`]: FnTrans<"data">;
} & {
  [K in `update${T}`]: FnTrans<`${T}Id` | "data">;
} & {
  [K in `remove${T}`]: FnTrans<`${T}Id`>;
};

export type ModelTrans<
  T extends string,
  Model extends BaseObject,
  Insight extends BaseInsight,
  Filter,
  Slice extends { [key: string]: SliceInfo },
  Endpoint extends { [key: string]: EndpointInfo },
  ErrorKey extends string,
  EtcKey extends string,
> = {
  modelName: Trans;
  modelDesc: Trans;
  model: { [K in keyof GetStateObject<Model>]: FieldTrans };
  insight: { [K in keyof GetStateObject<Insight>]: FieldTrans };
  query: {
    [K in keyof DictFilterQuery<Filter>]: DictFilterQuery<Filter>[K] extends FilterInfo<infer ArgNames, any>
      ? FnTrans<ArgNames[number]>
      : never;
  };
  sort: { [K in keyof DictFilterSort<Filter>]: FieldTrans };
  api: {
    [K in keyof Endpoint]: FnTrans<EndpInfoArgNames<Endpoint[K]>[number]>;
  } & BaseModelCrudGetApiTrans<T> &
    MergedValues<{
      [K in keyof Slice]: SliceApiTrans<SliceInfoRefName<Slice[K]>, K & string, SliceInfoArgNames<Slice[K]>[number]>;
    }>;
  error: { [K in ErrorKey]: Trans };
} & { [K in EtcKey]: Trans };
export type ModelTranslatorKey<
  T extends string,
  Model,
  Insight,
  Filter,
  Slice extends { [key: string]: SliceInfo },
  Endpoint extends { [key: string]: EndpointInfo },
  EtcKey extends string,
> =
  | `${T}.modelName`
  | `${T}.modelDesc`
  | `${T}.${keyof GetStateObject<Model> & string}${"" | ".desc"}`
  | `${T}.insight.${keyof GetStateObject<Insight> & string}${"" | ".desc"}`
  | `${T}.query.${FilterTranslatorKey<Filter>}`
  | `${T}.sort.${keyof DictFilterSort<Filter> & string}${"" | ".desc"}`
  | `${T}.signal.${EndpointTranslatorKey<Endpoint> | SliceTranslatorKey<Slice>}`
  | `${T}.${EtcKey}`;

export type ScalarTrans<T extends string, Model, ErrorKey extends string, EtcKey extends string> = {
  name: Trans;
  desc: Trans;
  model: { [K in keyof GetStateObject<Model>]: FieldTrans };
  error: { [K in ErrorKey]: Trans };
} & { [K in EtcKey]: Trans };
export type ScalarTranslatorKey<T extends string, Model, EtcKey extends string> =
  | `${T}.modelName`
  | `${T}.modelDesc`
  | `${T}.${keyof GetStateObject<Model> & string}${"" | ".desc"}`
  | `${T}.${EtcKey}`;

export type ServiceTrans<
  T extends string,
  Endpoint extends { [key: string]: EndpointInfo },
  ErrorKey extends string,
  EtcKey extends string,
> = {
  api: {
    [K in keyof Endpoint]: FnTrans<EndpInfoArgNames<Endpoint[K]>[number]>;
  };
  error: { [K in ErrorKey]: Trans };
} & { [K in EtcKey]: Trans };
export type ServiceTranslatorKey<
  T extends string,
  Endpoint extends { [key: string]: EndpointInfo },
  EtcKey extends string,
> = `${T}.signal.${EndpointTranslatorKey<Endpoint>}` | `${T}.${EtcKey}`;

export type EnumTrans<EnumValue extends string | number> = {
  [key in EnumValue]: Trans;
};
export type EnumTranslatorKey<EnumKey extends string> = `${EnumKey}.${string}${"" | ".desc"}`;

export interface DictModule<DictKey extends string, ErrorKey extends string> {
  __Dict_Key__: DictKey;
  __Error_Key__: ErrorKey;
  dict: ModelDictInfo<any> | ScalarDictInfo<any> | ServiceDictInfo<any>;
}

export const registerModelTrans = <
  RefName extends string,
  Model extends BaseObject,
  Insight extends BaseInsight,
  Filter,
  Slice extends { [key: string]: SliceInfo },
  Endpoint extends { [key: string]: EndpointInfo },
  ModelDict extends ModelDictInfo<any>,
>(
  modelDict: ModelDict,
): ModelDict extends ModelDictInfo<any, any, any, any, any, infer EnumKey, any, any, any, infer ErrorKey, infer EtcKey>
  ? DictModule<
      ModelTranslatorKey<RefName, Model, Insight, Filter, Slice, Endpoint, EtcKey> | EnumTranslatorKey<EnumKey>,
      `${RefName}.error.${ErrorKey}`
    >
  : never => {
  return { dict: modelDict } as unknown as ModelDict extends ModelDictInfo<
    any,
    any,
    any,
    any,
    any,
    infer EnumKey,
    any,
    any,
    any,
    infer ErrorKey,
    infer EtcKey
  >
    ? DictModule<
        ModelTranslatorKey<RefName, Model, Insight, Filter, Slice, Endpoint, EtcKey> | EnumTranslatorKey<EnumKey>,
        `${RefName}.error.${ErrorKey}`
      >
    : never;
};

export const registerScalarTrans = <T extends string, Model, ScalarDict>(
  scalarDict: ScalarDict,
): ScalarDict extends ScalarDictInfo<any, any, infer EnumKey, infer ErrorKey, infer EtcKey>
  ? DictModule<ScalarTranslatorKey<T, Model, EtcKey> | EnumTranslatorKey<EnumKey>, `${T}.error.${ErrorKey}`>
  : never => {
  return { dict: scalarDict } as unknown as ScalarDict extends ScalarDictInfo<
    any,
    any,
    infer EnumKey,
    infer ErrorKey,
    infer EtcKey
  >
    ? DictModule<ScalarTranslatorKey<T, Model, EtcKey> | EnumTranslatorKey<EnumKey>, `${T}.error.${ErrorKey}`>
    : never;
};

export const registerServiceTrans = <T extends string, Endpoint extends { [key: string]: EndpointInfo }, ServiceDict>(
  serviceDict: ServiceDict,
): ServiceDict extends ServiceDictInfo<any, any, infer ErrorKey, infer EtcKey>
  ? DictModule<ServiceTranslatorKey<T, Endpoint, EtcKey>, `${T}.error.${ErrorKey}`>
  : never => {
  return { dict: serviceDict } as unknown as ServiceDict extends ServiceDictInfo<any, any, infer ErrorKey, infer EtcKey>
    ? DictModule<ServiceTranslatorKey<T, Endpoint, EtcKey>, `${T}.error.${ErrorKey}`>
    : never;
};
