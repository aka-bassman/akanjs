import { EventStream } from "../routing/eventStream";

/**
 * One `text/event-stream` response carrying the notifications a single request produced, ending with that
 * request's own result.
 *
 * This is the only channel a server has for pushing anything: `2026-07-28` removed the GET stream, session
 * resumption and server-initiated requests, so nothing may be sent that is not related to a request in flight.
 * Closing the stream is also how the client cancels — `notifications/cancelled` is stdio-only — which is why
 * `cancel` is a constructor argument rather than something a caller could forget to wire. No event carries an
 * `id:`, since there is nothing a reconnecting client could resume.
 */
export class McpEventStream extends EventStream {
  /** Below any common proxy idle timeout, so a slow tool does not have its connection reaped mid-work. */
  static readonly keepAliveMs = 15_000;

  constructor(onCancel: () => void) {
    super(onCancel, { keepAliveMs: McpEventStream.keepAliveMs });
  }

  override write(message: object) {
    super.write(message);
  }
}
