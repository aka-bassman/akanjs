import { EventStream } from "akanjs/common";
import type { AgentWireToolCall } from "akanjs/service";

interface StreamedTurn {
  text?: string;
  toolCalls?: AgentWireToolCall[];
  stop?: "end" | "toolUse" | "length";
}

type RunTurn = (onDelta: (delta: string) => void) => Promise<StreamedTurn>;

/**
 * The streaming half of the agent turn wire (use-agentic WIRE.md): the same endpoint answers `text/event-stream`
 * when the request asks for it, one RunnerEvent JSON per SSE `data:` line, ending with `done`. The signal layer
 * passes a raw `Response` through untouched, which is what lets one mutation serve both shapes.
 */
export class AgentTurnStream {
  static wants(request: Bun.BunRequest): boolean {
    return !!request.headers.get("accept")?.includes("text/event-stream");
  }

  /**
   * A domain `Err` carries its dictionary key as the message and the values its text interpolates as `data`, so
   * both travel: the key alone would reach the chat as `agent.error.…` with its placeholders unfilled.
   */
  static failure(error: unknown): { message: string; data?: Record<string, string | number> } {
    const message = error instanceof Error ? error.message : String(error);
    const data = (error as { data?: unknown } | null)?.data;
    return data && typeof data === "object" && !Array.isArray(data)
      ? { message, data: data as Record<string, string | number> }
      : { message };
  }

  static response(run: RunTurn): Response {
    // Nothing to cancel: `run` takes no signal, so a turn whose reader went away finishes with nobody holding it.
    const stream = new EventStream(() => undefined);
    void AgentTurnStream.#deliver(stream, run);
    return stream.response();
  }

  static async #deliver(stream: EventStream, run: RunTurn) {
    try {
      let streamed = 0;
      const turn = await run((delta) => {
        if (!delta) return;
        streamed += delta.length;
        stream.write({ type: "text", delta });
      });
      // An adapter that ignores onDelta still resolves the whole text; deliver it as one late delta.
      if (!streamed && turn.text) stream.write({ type: "text", delta: turn.text });
      const toolCalls = turn.toolCalls ?? [];
      for (const call of toolCalls) stream.write({ type: "toolCall", id: call.id, name: call.name, args: call.args });
      // `length` travels as itself: the browser is the only side that can tell the user an answer was cut off.
      const stop = turn.stop === "length" ? "length" : turn.stop === "toolUse" || toolCalls.length ? "toolUse" : "end";
      stream.write({ type: "done", stop });
    } catch (error) {
      // The status line is long gone once the stream is open, so a failure travels as the wire's error event.
      stream.write({ type: "error", ...AgentTurnStream.failure(error) });
    } finally {
      stream.close();
    }
  }
}
