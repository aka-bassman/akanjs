import type { AgentWireToolCall } from "akanjs/service";

interface StreamedTurn {
  text?: string;
  toolCalls?: AgentWireToolCall[];
  stop?: "end" | "toolUse";
}

/**
 * The streaming half of the agent turn wire (use-agentic WIRE.md): the same endpoint answers `text/event-stream`
 * when the request asks for it, one RunnerEvent JSON per SSE `data:` line, ending with `done`. The signal layer
 * passes a raw `Response` through untouched, which is what lets one mutation serve both shapes.
 */
export class AgentTurnStream {
  static wants(request: Bun.BunRequest): boolean {
    return !!request.headers.get("accept")?.includes("text/event-stream");
  }

  static response(run: (onDelta: (delta: string) => void) => Promise<StreamedTurn>): Response {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        try {
          let streamed = 0;
          const turn = await run((delta) => {
            if (!delta) return;
            streamed += delta.length;
            send({ type: "text", delta });
          });
          // An adapter that ignores onDelta still resolves the whole text; deliver it as one late delta.
          if (!streamed && turn.text) send({ type: "text", delta: turn.text });
          const toolCalls = turn.toolCalls ?? [];
          for (const call of toolCalls) send({ type: "toolCall", id: call.id, name: call.name, args: call.args });
          send({ type: "done", stop: turn.stop === "toolUse" || toolCalls.length ? "toolUse" : "end" });
        } catch (error) {
          // The status line is long gone once the stream is open, so a failure travels as the wire's error event.
          send({ type: "error", message: error instanceof Error ? error.message : String(error) });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" },
    });
  }
}
