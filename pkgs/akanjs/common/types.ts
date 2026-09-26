export interface FetchPolicy<Returns = unknown> {
  cache?: boolean | number;
  crystalize?: boolean;
  origin?: string;
  onError?: (error: string) => void;
  token?: string;
  partial?: string[];
  /** Milliseconds, or `false` to wait as long as the runtime will; overrides the endpoint's declared `timeout`. */
  timeout?: number | false;
  /** `pubsub` only: called after a resubscribe, since whatever was published while the socket was down is gone. */
  onResync?: () => void;
}

export type SnakeCase<S extends string> = S extends `${infer T}_${infer U}` ? `${Lowercase<T>}_${SnakeCase<U>}` : S;
export type SnakeCaseObj<T> = {
  [K in keyof T as SnakeCase<K & string>]: T[K] extends object ? SnakeCaseObj<T[K]> : T[K];
};
export type SnakeMsg<Msg> = SnakeCaseObj<Msg>;
