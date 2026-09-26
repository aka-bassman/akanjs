"use client";
import { fetch } from "akanjs/client";
import { capitalize, type DynamicRecord } from "akanjs/common";
import type { FetchProxy } from "akanjs/fetch";
import type { SerializedEndpoint } from "akanjs/signal";
import { st } from "akanjs/store";
import { useEffect, useMemo, useState } from "react";
import { AiOutlineDisconnect, AiOutlineSend, AiOutlineSwap } from "react-icons/ai";
import { buttonRecipe } from "../Button";
import { docUi } from "../Reference";
import Arg from "./Arg";
import {
  ArgSection,
  appendMessage,
  EndpointInterface,
  type Messages,
  WsEndpoint,
  type WsEndpointProps,
} from "./Endpoint";
import { endpointEntriesOf, isWsEndpoint, matchesGuards, matchesSearch } from "./endpointEntries";
import Listener from "./Listener";
import { makeRequestExample } from "./makeExample";

export default function WebSocket() {
  return <div></div>;
}

export function Message() {
  return <div></div>;
}

export function PubSub() {
  return <div></div>;
}

interface WebSocketEndpointsProps {
  refName: string;
  fetch: FetchProxy;
  openAll?: boolean;
  search?: string;
}
const WebSocketEndpoints = ({ refName, fetch, openAll, search }: WebSocketEndpointsProps) => {
  const tryGuards = st.use.tryGuards({ agent: false });
  if (!fetch.serializedSignal[refName])
    return <div className={docUi.emptyPanel}>No signal is registered as “{refName}”.</div>;
  const wsEntries = endpointEntriesOf(refName, fetch).filter(({ endpoint }) => isWsEndpoint(endpoint));
  // A pubsub room authorizes once, at subscribe, so the guards the toggle filters on are the endpoint's own.
  const endpointEntries = wsEntries
    .filter(({ endpoint }) => matchesGuards(endpoint, tryGuards))
    .filter(({ key }) => matchesSearch(key, key, search ?? ""));
  if (!endpointEntries.length)
    return (
      <div className={docUi.emptyPanel}>
        {!wsEntries.length
          ? "This signal declares no websocket endpoint."
          : search?.trim()
            ? `No endpoint matches “${search.trim()}”.`
            : "No websocket endpoint is gated by the selected guards."}
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

const MessageEndpoint = ({ refName, endpointKey, endpoint, open }: WsEndpointProps) => (
  <WsEndpoint
    refName={refName}
    endpointKey={endpointKey}
    endpoint={endpoint}
    open={open}
    doc={<MessageInterface refName={refName} endpointKey={endpointKey} endpoint={endpoint} />}
    test={<MessageTry endpointKey={endpointKey} endpoint={endpoint} />}
  />
);
Message.Endpoint = MessageEndpoint;

interface WsInterfaceProps {
  refName: string;
  endpointKey: string;
  endpoint: SerializedEndpoint;
}
const MessageInterface = ({ refName, endpointKey, endpoint }: WsInterfaceProps) => (
  <EndpointInterface
    refName={refName}
    endpointKey={endpointKey}
    endpoint={endpoint}
    argSections={[
      { label: "Form data", args: endpoint.args.filter((arg) => arg.refName === "Upload") },
      { label: "Variables", args: endpoint.args.filter((arg) => arg.refName !== "Upload") },
    ]}
    returnsLabel="Returns"
  />
);
Message.Interface = MessageInterface;

interface MessageTryProps {
  endpointKey: string;
  endpoint: SerializedEndpoint;
}
const MessageTry = ({ endpointKey, endpoint }: MessageTryProps) => {
  const requestExample = useMemo(() => JSON.stringify(makeRequestExample(endpoint), null, 2), []);
  const [gqlRequest, setGqlRequest] = useState<string>(requestExample);
  const [stopListen, setStopListen] = useState<(() => void) | null>(null);
  const [messages, setMessages] = useState<Messages>("");
  const [response, setResponse] = useState<{
    status: "ready" | "error" | "listening" | "loading";
    data: Messages;
  }>({ status: "ready", data: "" });

  const onSend = async () => {
    const request = JSON.parse(gqlRequest) as { [key: string]: string | number | boolean | null };
    const argData = endpoint.args.map((arg) => request[arg.refName]);
    const fetchFn = ((fetch as unknown as DynamicRecord)[endpointKey] as (...args: any[]) => Promise<any>).bind(
      fetch,
    ) as (...args: any[]) => Promise<any>;
    await fetchFn(...argData);
  };
  const onListen = () => {
    setResponse({ status: "loading", data: null });
    const fetchFn = (
      (fetch as unknown as DynamicRecord)[`listen${capitalize(endpointKey)}`] as (...args: any[]) => Promise<any>
    ).bind(fetch) as (data: (data: any) => void) => Promise<() => void>;
    setResponse({ status: "loading", data: messages });
    const stopListen = fetchFn((data: any) => {
      setMessages((prev) => appendMessage(prev, data));
    });
    setResponse({ status: "listening", data: messages });
    setStopListen(() => stopListen);
  };
  const onStopListen = () => {
    if (!stopListen) return;
    stopListen();
    setStopListen(null);
    setResponse({ status: "ready", data: null });
    setMessages("");
  };

  useEffect(() => {
    if (!stopListen) return;
    return () => {
      onStopListen();
    };
  }, [stopListen]);

  return (
    <div className="flex w-full flex-col gap-4">
      <ArgSection label="Variables">
        <Arg.Json
          value={gqlRequest}
          onChange={(value: string) => {
            setGqlRequest(value);
          }}
        />
      </ArgSection>
      <div className="grid gap-2 md:grid-cols-3">
        <button
          disabled={!!stopListen}
          className={buttonRecipe({ variant: "primary" }, "w-full")}
          onClick={() => {
            onListen();
          }}
          type="button"
        >
          <AiOutlineSwap /> Listen
        </button>
        <button
          disabled={!stopListen}
          className={buttonRecipe({ variant: "secondary" }, "w-full")}
          onClick={() => void onSend()}
          type="button"
        >
          <AiOutlineSend /> Send
        </button>
        <button
          disabled={!stopListen}
          className={buttonRecipe({ variant: "outline" }, "w-full")}
          onClick={() => {
            onStopListen();
          }}
          type="button"
        >
          <AiOutlineDisconnect /> Stop
        </button>
      </div>
      <Listener.Result status={response.status} data={messages} />
    </div>
  );
};
Message.Try = MessageTry;

const PubSubEndpoint = ({ refName, endpointKey, endpoint, open }: WsEndpointProps) => (
  <WsEndpoint
    refName={refName}
    endpointKey={endpointKey}
    endpoint={endpoint}
    open={open}
    doc={<PubSubInterface refName={refName} endpointKey={endpointKey} endpoint={endpoint} />}
    test={<PubSubTry refName={refName} endpointKey={endpointKey} endpoint={endpoint} />}
  />
);
PubSub.Endpoint = PubSubEndpoint;

const PubSubInterface = ({ refName, endpointKey, endpoint }: WsInterfaceProps) => (
  <EndpointInterface
    refName={refName}
    endpointKey={endpointKey}
    endpoint={endpoint}
    argSections={[{ label: "Variables", args: endpoint.args }]}
    returnsLabel="Publishes"
  />
);
PubSub.Interface = PubSubInterface;

const PubSubTry = ({ refName, endpointKey, endpoint }: WsInterfaceProps) => {
  const requestExample = useMemo(() => JSON.stringify(makeRequestExample(endpoint), null, 2), []);
  const [gqlRequest, setGqlRequest] = useState<string>(requestExample);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [messages, setMessages] = useState<Messages>("");
  const [response, setResponse] = useState<{
    status: "ready" | "error" | "listening" | "loading";
    data: Messages;
  }>({ status: "ready", data: "" });
  const onSubscribe = () => {
    setResponse({ status: "loading", data: "" });
    const request = JSON.parse(gqlRequest) as { [key: string]: string | number | boolean | null };
    const argData = endpoint.args.map((arg) => request[arg.name]);

    const fetchFn = ((fetch as unknown as DynamicRecord)[endpointKey] as (...args: any[]) => Promise<any>).bind(
      fetch,
    ) as (
      ...args: [...args: (string | number | boolean | null)[], data: (data: unknown) => void]
    ) => Promise<() => void>;
    setResponse({ status: "loading", data: messages });
    const unsubscribe = fetchFn(...argData, (data: any) => {
      setMessages((prev) => appendMessage(prev, data));
    });
    setResponse({ status: "listening", data: messages });
    setUnsubscribe(() => unsubscribe);
  };
  const onUnsubscribe = () => {
    if (!unsubscribe) return;
    unsubscribe();
    setUnsubscribe(null);
    setResponse({ status: "ready", data: null });
    setMessages("");
  };

  useEffect(() => {
    if (!unsubscribe) return;
    return () => {
      onUnsubscribe();
    };
  }, [unsubscribe]);

  return (
    <div className="flex w-full flex-col gap-4">
      <ArgSection label="Variables">
        <Arg.Json
          value={gqlRequest}
          onChange={(value: string) => {
            setGqlRequest(value);
          }}
        />
      </ArgSection>
      <div className="grid gap-2 md:grid-cols-2">
        <button
          disabled={!!unsubscribe}
          className={buttonRecipe({ variant: "primary" }, "w-full")}
          onClick={() => {
            onSubscribe();
          }}
          type="button"
        >
          <AiOutlineSwap /> Subscribe
        </button>
        <button
          disabled={!unsubscribe}
          className={buttonRecipe({ variant: "outline" }, "w-full")}
          onClick={() => {
            onUnsubscribe();
          }}
          type="button"
        >
          <AiOutlineDisconnect /> Unsubscribe
        </button>
      </div>
      <Listener.Result status={response.status} data={messages} />
    </div>
  );
};
PubSub.Try = PubSubTry;
