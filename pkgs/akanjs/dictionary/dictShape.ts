import type { ENDPOINT_DICT_SHAPE, FILTER_DICT_SHAPE, SLICE_DICT_SHAPE } from "akanjs/base";
import type {
  FilterCls,
  FilterDictShape as FilterCompactShape,
  FilterDictArgShape,
  FilterInfo,
  FilterInstance,
} from "akanjs/document";
import type {
  EndpointCls,
  EndpointDictShape as EndpointCompactShape,
  EndpointInfo,
  SliceCls,
  SliceDictShape as SliceCompactShape,
  SliceInfo,
} from "akanjs/signal";

type DictArgShape = { [key: string]: readonly string[] };
type AnyFilterShape = FilterCompactShape<FilterInstance<Record<string, FilterInfo>, Record<string, unknown>>>;
type DictFilterShape<Filter> =
  Filter extends FilterCls<infer FilterShape>
    ? FilterCompactShape<FilterShape>
    : Filter extends { readonly [FILTER_DICT_SHAPE]: infer CompactShape extends FilterDictArgShape }
      ? CompactShape
      : Filter extends FilterInstance
        ? FilterCompactShape<Filter>
        : Filter extends { query: Record<string, FilterInfo>; sort: Record<string, unknown> }
          ? FilterCompactShape<Filter>
          : Filter extends { query: DictArgShape; sort: Record<string, true> }
            ? Filter
            : AnyFilterShape;
export type DictSliceShape<Slice> =
  Slice extends SliceCls<infer _SrvModule, infer SliceInfoObj>
    ? SliceCompactShape<SliceInfoObj>
    : Slice extends { readonly [SLICE_DICT_SHAPE]: infer CompactShape extends DictArgShape }
      ? CompactShape
      : Slice extends DictArgShape
        ? Slice
        : Slice extends Record<string, SliceInfo>
          ? SliceCompactShape<Slice>
          : Record<never, never>;
export type DictEndpointShape<Endpoint> =
  Endpoint extends EndpointCls<infer _SrvModule, infer EndpointInfoObj>
    ? EndpointCompactShape<EndpointInfoObj>
    : Endpoint extends { readonly [ENDPOINT_DICT_SHAPE]: infer CompactShape extends DictArgShape }
      ? CompactShape
      : Endpoint extends DictArgShape
        ? Endpoint
        : Endpoint extends Record<string, EndpointInfo>
          ? EndpointCompactShape<Endpoint>
          : Record<never, never>;
export type DictArgNames<ArgNames> = ArgNames extends readonly string[] ? ArgNames[number] : never;
export type DictFilterQuery<Filter> = DictFilterShape<Filter>["query"];
export type DictFilterSort<Filter> = DictFilterShape<Filter>["sort"];
