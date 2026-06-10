import { describe, expect, test } from "bun:test";
import { shouldRenderLocaleAlternates } from "./metadata";
import {
  createIdempotentRscRenderCancel,
  createRscHostRenderStream,
  createRscWorkerInvalidateCacheMessage,
  getRscHostMaxPendingChunks,
  isRscHostPendingChunkOverflow,
  nextRscHostPendingChunkCount,
  type RscPending,
} from "./rscWorkerHost";
import { type CachedRscReplayMessage, replayCachedRscResult } from "./rscWorkerReplay";

const decoder = new TextDecoder();

function createHostRenderHarness(options: { maxPendingChunks?: number; signal?: AbortSignal } = {}) {
  let pending: RscPending | undefined;
  let deletePendingCount = 0;
  let sendCount = 0;
  let pendingChunkOverflowCount = 0;
  const cancelReasons: unknown[] = [];
  const result = createRscHostRenderStream({
    setPending: (nextPending) => {
      pending = nextPending;
    },
    deletePending: () => {
      deletePendingCount += 1;
      pending = undefined;
    },
    sendRenderOrQueue: () => {
      sendCount += 1;
    },
    cancelRender: (reason) => {
      cancelReasons.push(reason);
    },
    maxPendingChunks: options.maxPendingChunks,
    signal: options.signal,
    onPendingChunkOverflow: () => {
      pendingChunkOverflowCount += 1;
    },
  });

  return {
    result,
    pending: () => {
      if (!pending) throw new Error("pending render was not registered");
      return pending;
    },
    deletePendingCount: () => deletePendingCount,
    sendCount: () => sendCount,
    pendingChunkOverflowCount: () => pendingChunkOverflowCount,
    cancelReasons,
  };
}

describe("RscWorker host pending chunk cap", () => {
  test("uses a conservative default when the env value is invalid", () => {
    expect(getRscHostMaxPendingChunks(undefined)).toBe(256);
    expect(getRscHostMaxPendingChunks("0")).toBe(256);
    expect(getRscHostMaxPendingChunks("not-a-number")).toBe(256);
  });

  test("tracks queued chunks only while the host stream is backpressured", () => {
    expect(nextRscHostPendingChunkCount(0, 1)).toBe(0);
    expect(nextRscHostPendingChunkCount(0, 0)).toBe(1);
    expect(nextRscHostPendingChunkCount(1, -1)).toBe(2);
    expect(nextRscHostPendingChunkCount(2, 1)).toBe(0);
  });

  test("fails only after pending chunks exceed the configured cap", () => {
    expect(isRscHostPendingChunkOverflow(2, 2)).toBe(false);
    expect(isRscHostPendingChunkOverflow(3, 2)).toBe(true);
  });
});

describe("RscWorker locale alternates policy", () => {
  test("skips automatic alternates for special routes or explicit metadata languages", () => {
    expect(shouldRenderLocaleAlternates({})).toBe(true);
    expect(shouldRenderLocaleAlternates({ isSpecialRoute: true })).toBe(false);
    expect(shouldRenderLocaleAlternates({ hasExplicitLanguageAlternates: true })).toBe(false);
    expect(shouldRenderLocaleAlternates({ isSpecialRoute: false, hasExplicitLanguageAlternates: false })).toBe(true);
  });
});

describe("RscWorker host render stream", () => {
  test("resolves on meta and streams chunks until end", async () => {
    const harness = createHostRenderHarness();

    expect(harness.sendCount()).toBe(1);
    harness.pending().onMeta?.({ theme: "dark", status: 404 });
    const result = await harness.result;
    expect(result.type).toBe("stream");
    if (result.type !== "stream") throw new Error("expected stream result");

    harness.pending().onChunk(new TextEncoder().encode("flight"));
    harness.pending().onEnd();

    expect(result.theme).toBe("dark");
    expect(result.status).toBe(404);
    expect(await new Response(result.stream).text()).toBe("flight");
    await expect(result.lateControl).resolves.toBeNull();
  });

  test("resolves on the first chunk even when meta has not arrived", async () => {
    const harness = createHostRenderHarness();

    harness.pending().onChunk(new TextEncoder().encode("early"));
    const result = await harness.result;
    expect(result.type).toBe("stream");
    if (result.type !== "stream") throw new Error("expected stream result");

    harness.pending().onEnd();

    expect(result.theme).toBeUndefined();
    expect(result.status).toBeUndefined();
    expect(await new Response(result.stream).text()).toBe("early");
    await expect(result.lateControl).resolves.toBeNull();
  });

  test("cancels the worker once when the consumer cancels the stream", async () => {
    const harness = createHostRenderHarness();
    const reason = new Error("client disconnected");

    harness.pending().onMeta?.({});
    const result = await harness.result;
    expect(result.type).toBe("stream");
    if (result.type !== "stream") throw new Error("expected stream result");

    await result.stream.cancel(reason);
    result.cancel(new Error("duplicate cancel"));

    expect(harness.deletePendingCount()).toBe(1);
    expect(harness.cancelReasons).toEqual([reason]);
    await expect(result.lateControl).resolves.toBeNull();
  });

  test("rejects and cancels when the request aborts before the stream starts", async () => {
    const controller = new AbortController();
    const harness = createHostRenderHarness({ signal: controller.signal });
    const reason = new Error("client disconnected before first Flight chunk");

    controller.abort(reason);

    await expect(harness.result).rejects.toBe(reason);
    expect(harness.deletePendingCount()).toBe(1);
    expect(harness.cancelReasons).toEqual([reason]);
  });

  test("fails fast and cancels when pending chunks exceed the bounded queue cap", async () => {
    const harness = createHostRenderHarness({ maxPendingChunks: 1 });

    harness.pending().onChunk(new Uint8Array([1]));
    const result = await harness.result;
    expect(result.type).toBe("stream");
    if (result.type !== "stream") throw new Error("expected stream result");
    const reader = result.stream.getReader();
    const closed = reader.closed.catch((streamError: unknown) => streamError);

    harness.pending().onChunk(new Uint8Array([2]));
    harness.pending().onChunk(new Uint8Array([3]));

    const closedError = await closed;
    expect(closedError).toBeInstanceOf(Error);
    expect((closedError as Error).message).toBe("rsc worker host queue exceeded 1 pending chunks");
    expect(harness.deletePendingCount()).toBe(1);
    expect(harness.cancelReasons).toHaveLength(1);
    expect(harness.cancelReasons[0]).toBeInstanceOf(Error);
    expect(harness.pendingChunkOverflowCount()).toBe(1);
    await expect(result.lateControl).resolves.toBeNull();
  });

  test("resolves initial redirect and not-found before the stream starts", async () => {
    const redirectHarness = createHostRenderHarness();
    redirectHarness.pending().onRedirect?.("/login", "replace", 307);

    await expect(redirectHarness.result).resolves.toEqual({
      type: "redirect",
      location: "/login",
      method: "replace",
      status: 307,
    });

    const notFoundHarness = createHostRenderHarness();
    notFoundHarness.pending().onNotFound?.();

    await expect(notFoundHarness.result).resolves.toEqual({ type: "not-found" });
  });

  test("resolves late redirect control after the stream has started", async () => {
    const harness = createHostRenderHarness();

    harness.pending().onChunk(new TextEncoder().encode("shell"));
    const result = await harness.result;
    expect(result.type).toBe("stream");
    if (result.type !== "stream") throw new Error("expected stream result");

    harness.pending().onLateRedirect?.("/target", "push", 308);
    harness.pending().onEnd();

    expect(decoder.decode(await new Response(result.stream).arrayBuffer())).toBe("shell");
    await expect(result.lateControl).resolves.toEqual({
      type: "redirect",
      location: "/target",
      method: "push",
      status: 308,
    });
  });
});

describe("RscWorker render cancellation", () => {
  test("uses an idempotent cancel path that does not depend on stream.cancel", () => {
    const reasons: unknown[] = [];
    const firstReason = new Error("client disconnected");
    const secondReason = new Error("stream locked");
    const cancel = createIdempotentRscRenderCancel((reason) => {
      reasons.push(reason);
    });

    cancel(firstReason);
    cancel(secondReason);
    cancel();

    expect(reasons).toEqual([firstReason]);
  });
});

describe("RscWorker cache invalidation", () => {
  test("creates an invalidate-cache worker message with optional reason", () => {
    expect(createRscWorkerInvalidateCacheMessage()).toEqual({ type: "invalidate-cache" });
    expect(createRscWorkerInvalidateCacheMessage("manual")).toEqual({ type: "invalidate-cache", reason: "manual" });
  });
});

describe("RscWorker cached result replay", () => {
  test("stops replaying cached chunks when cancellation is observed", async () => {
    const messages: CachedRscReplayMessage[] = [];
    let cancelled = false;

    const completed = await replayCachedRscResult({
      requestId: "request-1",
      chunks: [new Uint8Array([1]), new Uint8Array([2])],
      theme: "dark",
      cacheState: { cacheable: true, revalidate: 30 },
      send: (message) => {
        messages.push(message);
      },
      isCancelled: () => cancelled,
      yieldToHost: async () => {
        cancelled = true;
      },
    });

    expect(completed).toBe(false);
    expect(messages.map((message) => message.type)).toEqual(["meta", "cache-state", "chunk"]);
    expect(messages[0]).toEqual({ type: "meta", requestId: "request-1", theme: "dark", status: undefined });
    expect(messages[1]).toEqual({
      type: "cache-state",
      requestId: "request-1",
      state: { cacheable: true, revalidate: 30 },
    });
    expect(messages[2]).toEqual({ type: "chunk", requestId: "request-1", data: new Uint8Array([1]) });
  });
});
