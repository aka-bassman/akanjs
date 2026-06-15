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

type FetchKeysOfSignal<Signal> = Signal extends FetchSignalInput ? keyof FetchTypeOfSignal<Signal> : never;
type FetchKeysOfSignals<Signals extends readonly FetchSignalInput[]> = FetchKeysOfSignal<Signals[number]>;

type LastFetchValue<
  Signals extends readonly FetchSignalInput[],
  Key extends PropertyKey,
  Current = never,
> = Signals extends readonly [infer First extends FetchSignalInput, ...infer Rest extends readonly FetchSignalInput[]]
  ? Key extends keyof FetchTypeOfSignal<First>
    ? LastFetchValue<Rest, Key, FetchTypeOfSignal<First>[Key]>
    : LastFetchValue<Rest, Key, Current>
  : Current;

export type MergeAllFetchTypes<Signals extends readonly FetchSignalInput[]> = [FetchKeysOfSignals<Signals>] extends [
  never,
]
  ? unknown
  : {
      [Key in FetchKeysOfSignals<Signals>]: LastFetchValue<Signals, Key>;
    };

export type FetchClientType<Signals extends readonly FetchSignalInput[]> = FetchProxy<
  MergeAllFetchTypes<Signals>,
  GetSliceMetaObjFromDatabaseSignals<Signals>
>;
