// Anything but an `Exception` is generalized: a stack names server paths and a driver message quotes the statement.
export class SignalFailure {
  static readonly message = "Internal Server Error";
  static #detailed: boolean | null = null;

  /** Off in a deployed build (the `WebRouter` test) unless `AKAN_ERROR_DETAIL=1`. */
  static get detailed(): boolean {
    SignalFailure.#detailed ??=
      process.env.AKAN_ERROR_DETAIL === "1" ||
      !(process.env.NODE_ENV === "production" && process.env.AKAN_COMMAND_TYPE !== "start");
    return SignalFailure.#detailed;
  }

  static reset() {
    SignalFailure.#detailed = null;
  }

  static body<Extra extends Record<string, unknown> = Record<string, never>>(
    error: unknown,
    extra: Extra = {} as Extra,
  ): Extra & { error: string; statusCode: number; timestamp: string; stack?: string } {
    const detailed = SignalFailure.detailed;
    return {
      error: detailed ? (error instanceof Error ? error.message : String(error)) : SignalFailure.message,
      statusCode: 500,
      ...extra,
      timestamp: new Date().toISOString(),
      ...(detailed && error instanceof Error && error.stack ? { stack: error.stack } : {}),
    };
  }

  static response(error: unknown, extra: Record<string, unknown> = {}): Response {
    return new Response(JSON.stringify(SignalFailure.body(error, extra)), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
