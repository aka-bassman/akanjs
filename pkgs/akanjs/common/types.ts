export interface FetchPolicy<Returns = unknown> {
  cache?: boolean | number;
  crystalize?: boolean;
  origin?: string;
  onError?: (error: string) => void;
  token?: string;
  partial?: string[];
  timeout?: number;
  /**
   * A `pubsub` subscription only: called after the room has been resubscribed following a dropped connection.
   *
   * Whatever was published while the socket was down is gone, and a room cannot say which messages those were, so
   * a subscriber that has to stay correct reloads here instead of carrying on from a gap it cannot see.
   */
  onResync?: () => void;
}

export type SnakeCase<S extends string> = S extends `${infer T}_${infer U}` ? `${Lowercase<T>}_${SnakeCase<U>}` : S;
export type SnakeCaseObj<T> = {
  [K in keyof T as SnakeCase<K & string>]: T[K] extends object ? SnakeCaseObj<T[K]> : T[K];
};
export type SnakeMsg<Msg> = SnakeCaseObj<Msg>;
