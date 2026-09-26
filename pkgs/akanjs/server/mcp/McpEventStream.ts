import { EventStream } from "akanjs/common";

// 2026-07-28 removed the GET stream and resumption, so events carry no `id:`; closing the stream is how a client
// cancels (`notifications/cancelled` is stdio-only), hence the required `onCancel`.
export class McpEventStream extends EventStream {
  // Below any common proxy idle timeout, so a slow tool does not have its connection reaped mid-work.
  static readonly keepAliveMs = 15_000;

  constructor(onCancel: () => void) {
    super(onCancel, { keepAliveMs: McpEventStream.keepAliveMs });
  }

  override write(message: object) {
    super.write(message);
  }
}
