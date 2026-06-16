import type { DatabaseSignal, EndpointCls, ServiceSignal, SliceCls } from "akanjs/signal";
import type { FetchProxy } from "../client";
import type { GetSliceMetaObjFromDatabaseSignals } from "../types";
import type { GetFetchTypeFromEndpoint } from "./endpointFetch.type";
import type { GetFetchTypeFromSlice } from "./sliceFetch.type";

export type FetchSignalInput = FetchProxy | DatabaseSignal | ServiceSignal;

export type FetchTypeOfSignal<Signal extends FetchSignalInput> =
  Signal extends FetchProxy<infer FetchType>
    ? FetchType
    : Signal extends { endpoint: infer EndpCls extends EndpointCls; slice: infer SlceCls extends SliceCls }
      ? GetFetchTypeFromEndpoint<EndpCls> & GetFetchTypeFromSlice<SlceCls>
      : Signal extends { endpoint: infer EndpCls extends EndpointCls }
        ? GetFetchTypeFromEndpoint<EndpCls>
        : unknown;

type OverrideFetchType<Current, Next> = Omit<Current, keyof Next> & Next;

export type MergeAllFetchTypes<Signals extends readonly FetchSignalInput[]> = Signals extends readonly [
  infer First extends FetchSignalInput,
  ...infer Rest extends readonly FetchSignalInput[],
]
  ? OverrideFetchType<FetchTypeOfSignal<First>, MergeAllFetchTypes<Rest>>
  : unknown;

export type FetchClientType<Signals extends readonly FetchSignalInput[]> = FetchProxy<
  MergeAllFetchTypes<Signals>,
  GetSliceMetaObjFromDatabaseSignals<Signals>
>;
