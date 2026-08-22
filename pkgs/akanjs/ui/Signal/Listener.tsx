"use client";
import { cn } from "akanjs/client";
import { capitalize } from "akanjs/common";
import { useEffect, useRef } from "react";
import { Code } from "../Reference";
import { getStatusBadgeClassName, getStatusTone } from "./style";

export default function Listener() {
  return <div></div>;
}

const dotClass: { [key: string]: string } = {
  error: "bg-destructive",
  listening: "animate-pulse bg-success",
  loading: "animate-ping bg-info",
  ready: "bg-border",
};

interface ListenerResultProps {
  status: "ready" | "loading" | "error" | "listening";
  data: unknown;
}
const ListenerResult = ({ status, data }: ListenerResultProps) => {
  const dataStr = typeof data === "object" ? JSON.stringify(data, null, 2) : String(data);
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [dataStr]);
  return (
    <Code
      bodyRef={ref}
      code={dataStr}
      label="Stream"
      meta={
        <>
          <span className={getStatusBadgeClassName(status)}>{capitalize(status)}</span>
          <span className={cn("size-2 rounded-full", dotClass[status] ?? "bg-border")} />
        </>
      }
      placeholder="Nothing received yet."
      tone={getStatusTone(status)}
    />
  );
};
Listener.Result = ListenerResult;
