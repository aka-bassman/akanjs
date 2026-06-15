import type { ENDPOINT_META, PromiseOrObject } from "akanjs/base";
import type { FetchPolicy } from "akanjs/common";
import type {
  EndpInfoArgs,
  EndpInfoClientReturns,
  EndpInfoNullable,
  EndpInfoReqType,
  EndpointCls,
  EndpointInfo,
} from "akanjs/signal";

type EndpInfoReturns<E> = EndpInfoClientReturns<E> | (EndpInfoNullable<E> extends true ? null : never);

type QueryOrMutationFetchFn<E> = (
  ...args: [...EndpInfoArgs<E>, fetchPolicy?: FetchPolicy]
) => Promise<EndpInfoReturns<E>>;

type MessageEmitFn<E> = (...args: EndpInfoArgs<E>) => EndpInfoReturns<E>;

type MessageListenFn<E> = (
  handleEvent: (data: EndpInfoReturns<E>) => PromiseOrObject<void>,
  options?: FetchPolicy,
) => () => void;

type PubsubSubscribeFn<E> = (
  ...args: [...EndpInfoArgs<E>, handleEvent: (data: EndpInfoReturns<E>) => PromiseOrObject<void>, options?: FetchPolicy]
) => () => void;

type PrimaryFetchFn<E> =
  EndpInfoReqType<E> extends "query" | "mutation"
    ? QueryOrMutationFetchFn<E>
    : EndpInfoReqType<E> extends "message"
      ? MessageEmitFn<E>
      : never;

// Keys kept as-is: query / mutation / message (emit)
type PrimaryFetchType<EInfoObj extends { [key: string]: EndpointInfo }> = {
  [K in keyof EInfoObj as EndpInfoReqType<EInfoObj[K]> extends "query" | "mutation" | "message"
    ? K
    : never]: PrimaryFetchFn<EInfoObj[K]>;
};

// Keys remapped to `subscribe${Key}`
type PubsubFetchType<EInfoObj extends { [key: string]: EndpointInfo }> = {
  [K in keyof EInfoObj as EndpInfoReqType<EInfoObj[K]> extends "pubsub"
    ? K extends string
      ? `subscribe${Capitalize<K>}`
      : never
    : never]: PubsubSubscribeFn<EInfoObj[K]>;
};

// Keys remapped to `listen${Key}`
type MessageListenFetchType<EInfoObj extends { [key: string]: EndpointInfo }> = {
  [K in keyof EInfoObj as EndpInfoReqType<EInfoObj[K]> extends "message"
    ? K extends string
      ? `listen${Capitalize<K>}`
      : never
    : never]: MessageListenFn<EInfoObj[K]>;
};

export type GetFetchTypeFromEndpoint<
  EndpCls extends EndpointCls,
  _EndpointInfoObj extends { [key: string]: EndpointInfo } = EndpCls[typeof ENDPOINT_META],
> = PrimaryFetchType<_EndpointInfoObj> & PubsubFetchType<_EndpointInfoObj> & MessageListenFetchType<_EndpointInfoObj>;
