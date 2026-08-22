import { FetchClient, type FetchProxy } from "akanjs/fetch";
import type { SerializedEndpoint } from "akanjs/signal";

export interface EndpointEntry {
  key: string;
  endpoint: SerializedEndpoint;
}

export const isWsEndpoint = (endpoint: SerializedEndpoint) => endpoint.type === "pubsub" || endpoint.type === "message";

/** Generated CRUD, slice reads, and hand-written endpoints in one list — what the summary counts and the list share. */
export const endpointEntriesOf = (refName: string, fetch: FetchProxy): EndpointEntry[] => {
  const signal = fetch.serializedSignal[refName];
  if (!signal) return [];
  const base = Object.entries(FetchClient.getBaseEndpoint(refName, signal));
  const slices = Object.entries(signal.slice ?? {}).flatMap(([suffix, slice]) =>
    Object.entries(FetchClient.getEndpointFromSlice(refName, suffix, slice)),
  );
  const custom = Object.entries(signal.endpoint);
  return [...base, ...slices, ...custom]
    .map(([key, endpoint]) => ({ key, endpoint }))
    .sort((a, b) => (a.key > b.key ? 1 : -1));
};

export const matchesSearch = (key: string, path: string, search: string) => {
  const text = search.trim().toLowerCase();
  if (!text) return true;
  return key.toLowerCase().includes(text) || path.toLowerCase().includes(text);
};

/** `None` refuses every caller and is never badged, so it is not a name anyone filters by either. */
export const guardsOf = (endpoint: SerializedEndpoint) => endpoint.guards?.filter((guard) => guard !== "None") ?? [];

/** Every guard name the serialized signals declare — the app's own authorization vocabulary, not a fixed role list. */
export const guardNamesOf = (fetch: FetchProxy) => {
  const names = new Set<string>();
  for (const refName of Object.keys(fetch.serializedSignal))
    for (const { endpoint } of endpointEntriesOf(refName, fetch))
      for (const guard of guardsOf(endpoint)) names.add(guard);
  return [...names].sort((a, b) => (a > b ? 1 : -1));
};

/** No selection is no filter: the toolbar is optional, and an endpoint naming no guard is reachable by everyone. */
export const matchesGuards = (endpoint: SerializedEndpoint, selected: string[]) => {
  if (!selected.length) return true;
  const guards = guardsOf(endpoint);
  return !guards.length || guards.some((guard) => selected.includes(guard));
};
