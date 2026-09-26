import type { RouteCacheRenderState } from "./cachePolicy";
import type { RscTraceMetadata } from "./ssrTypes";

export type CachedRscReplayMessage =
  | { type: "meta"; requestId: string; theme?: string; status?: number; trace?: RscTraceMetadata }
  | { type: "cache-state"; requestId: string; state: RouteCacheRenderState }
  | { type: "chunk"; requestId: string; data: Uint8Array }
  | { type: "end"; requestId: string };

function yieldToHostEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function replayCachedRscResult(input: {
  requestId: string;
  chunks: readonly Uint8Array[];
  theme?: string;
  trace?: RscTraceMetadata;
  cacheState?: RouteCacheRenderState;
  send: (message: CachedRscReplayMessage) => void;
  isCancelled: () => boolean;
  yieldToHost?: () => Promise<void>;
}): Promise<boolean> {
  const yieldToHost = input.yieldToHost ?? yieldToHostEventLoop;
  if (input.isCancelled()) return false;
  const metaMessage: CachedRscReplayMessage = { type: "meta", requestId: input.requestId, theme: input.theme };
  if (input.trace) metaMessage.trace = input.trace;
  input.send(metaMessage);
  input.send({ type: "cache-state", requestId: input.requestId, state: input.cacheState ?? { cacheable: true } });
  for (let index = 0; index < input.chunks.length; index += 1) {
    if (input.isCancelled()) return false;
    input.send({ type: "chunk", requestId: input.requestId, data: input.chunks[index] });
    await yieldToHost();
  }
  if (input.isCancelled()) return false;
  input.send({ type: "end", requestId: input.requestId });
  return true;
}
