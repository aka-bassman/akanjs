"use client";
import type { FetchProxy } from "akanjs/fetch";
import { docUi } from "../Reference";
import { endpointEntriesOf, isWsEndpoint, matchesSearch } from "./endpointEntries";
import Message from "./Message";
import PubSub from "./PubSub";

export default function WebSocket() {
  return <div></div>;
}

interface WebSocketEndpointsProps {
  refName: string;
  fetch: FetchProxy;
  openAll?: boolean;
  search?: string;
}
const WebSocketEndpoints = ({ refName, fetch, openAll, search }: WebSocketEndpointsProps) => {
  if (!fetch.serializedSignal[refName])
    return <div className={docUi.emptyPanel}>No signal is registered as “{refName}”.</div>;
  // Not filtered by the role toggle the way REST is: a pubsub room authorizes at subscribe, so its guards are the
  // endpoint's own and the slice-level role map the toggle models says nothing about them.
  const endpointEntries = endpointEntriesOf(refName, fetch)
    .filter(({ endpoint }) => isWsEndpoint(endpoint))
    .filter(({ key }) => matchesSearch(key, key, search ?? ""));
  if (!endpointEntries.length)
    return (
      <div className={docUi.emptyPanel}>
        {search?.trim() ? `No endpoint matches “${search.trim()}”.` : "This signal declares no websocket endpoint."}
      </div>
    );
  return (
    <div className="flex flex-col gap-2">
      {endpointEntries.map(({ key, endpoint }) =>
        endpoint.type === "pubsub" ? (
          <PubSub.Endpoint key={key} refName={refName} endpointKey={key} endpoint={endpoint} open={openAll} />
        ) : (
          <Message.Endpoint key={key} refName={refName} endpointKey={key} endpoint={endpoint} open={openAll} />
        ),
      )}
    </div>
  );
};
WebSocket.Endpoints = WebSocketEndpoints;
