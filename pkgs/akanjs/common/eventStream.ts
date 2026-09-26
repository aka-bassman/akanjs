export interface EventStreamOptions {
  keepAliveMs?: number;
  /** What the keep-alive sends; a line starting with `:` is a comment every SSE client discards. */
  keepAliveChunk?: string;
}

// The keep-alive interval stays below common proxy idle timeouts so a quiet stream is not reaped.
export class EventStream {
  static readonly defaultKeepAliveMs = 15_000;

  readonly #encoder = new TextEncoder();
  readonly #stream: ReadableStream<Uint8Array>;
  #controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  #keepAlive: ReturnType<typeof setInterval> | null = null;

  constructor(
    onCancel: () => void,
    { keepAliveMs = EventStream.defaultKeepAliveMs, keepAliveChunk = ":\r\n" }: EventStreamOptions = {},
  ) {
    this.#stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.#controller = controller;
        this.#keepAlive = setInterval(() => this.#enqueue(keepAliveChunk), keepAliveMs);
        // A pending interval would otherwise hold the process open past the last request.
        this.#keepAlive.unref?.();
      },
      cancel: () => {
        this.#stopKeepAlive();
        this.#controller = null;
        onCancel();
      },
    });
  }

  get open() {
    return this.#controller !== null;
  }

  response(headers: { [key: string]: string } = {}) {
    return new Response(this.#stream, {
      headers: {
        "content-type": "text/event-stream",
        // `no-transform` and the nginx hint stop an intermediary from buffering the stream into one response.
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
        ...headers,
      },
    });
  }

  write(message: object, id?: string | number) {
    this.#enqueue(`${id === undefined ? "" : `id: ${id}\n`}data: ${JSON.stringify(message)}\n\n`);
  }

  comment(text: string) {
    this.#enqueue(`: ${text}\n\n`);
  }

  retry(ms: number) {
    this.#enqueue(`retry: ${ms}\n\n`);
  }

  close() {
    this.#stopKeepAlive();
    const controller = this.#controller;
    this.#controller = null;
    try {
      controller?.close();
    } catch {
      // The client went away between the cancel callback and this call.
    }
  }

  #enqueue(chunk: string) {
    if (!this.#controller) return;
    try {
      this.#controller.enqueue(this.#encoder.encode(chunk));
    } catch {
      // The client went away between the cancel callback and this write.
      this.#stopKeepAlive();
      this.#controller = null;
    }
  }

  #stopKeepAlive() {
    if (this.#keepAlive) clearInterval(this.#keepAlive);
    this.#keepAlive = null;
  }
}
