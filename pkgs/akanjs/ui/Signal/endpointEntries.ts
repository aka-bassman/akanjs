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
