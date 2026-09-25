/**
 * The one shape an unexpected failure takes on the wire, for both transports.
 *
 * An `Exception` says what it means to say and travels as it is. Everything else — a SQL error, an adaptor
 * throwing, a framework `throw new Error` — is an internal detail: a stack names server file paths and the
 * framework's own structure, and a driver message quotes the statement and sometimes its values. That is the
 * same reason a guard's refusal is generalized to `You are not permitted to perform this action.`, so a 500 is
 * generalized for it too. `endpoint.logger.error` already recorded the stack, so nothing is lost.
 */
export class SignalFailure {
  static readonly message = "Internal Server Error";
  static #detailed: boolean | null = null;

  /**
   * Whether this process may describe its own failures. Production is the deployed build — the same test
   * `WebRouter` applies, so `akan start` under `NODE_ENV=production` still says what broke. `AKAN_ERROR_DETAIL=1`
   * puts the detail back for a deployed build somebody is debugging.
   */
  static get detailed(): boolean {
    SignalFailure.#detailed ??=
      process.env.AKAN_ERROR_DETAIL === "1" ||
      !(process.env.NODE_ENV === "production" && process.env.AKAN_COMMAND_TYPE !== "start");
    return SignalFailure.#detailed;
  }

  static reset() {
    SignalFailure.#detailed = null;
  }

  /** The 500 payload: the real message and stack in dev, one sentence in production. */
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
