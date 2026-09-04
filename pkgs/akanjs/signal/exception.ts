/**
 * The three ways this framework throws, and which one to reach for.
 *
 * - **`Exception`** (here) — a request-level answer with a status code. It travels to the caller as it is:
 *   `{ error, statusCode, path, timestamp }`, with the message intact. Reach for it when the caller did
 *   something the endpoint can name — a filter that does not exist, an argument that will not parse, a guard's
 *   refusal. The message is read by whoever called, so it may not say anything the caller may not know.
 *
 * - **`Err`** (`akanjs/dictionary`, `new Err("<module>.error.<key>")`) — the same thing for a **domain** rule,
 *   with the sentence in the module's dictionary in every language. Everything a *user* reads is one of these;
 *   `Exception` carries English prose and belongs to the protocol rather than to the product.
 *
 * - **`Error`** — a bug, an invariant the code holds and something broke, or a misconfiguration a developer has
 *   to fix. It never reaches a caller: `SignalFailure` generalizes anything without a status code to
 *   `Internal Server Error` and logs the stack, because a stack names server paths and a driver message quotes
 *   the statement. Most of the 379 `throw new Error` in this package are boot-time refusals, which is right —
 *   nobody is holding the connection.
 *
 * The test for the first two is whether a caller can act on it. The test for the third is whether *this repo*
 * has to change for the throw to stop happening.
 */
/**
 * The shape of every `Exception.<Status>` shorthand below.
 *
 * The annotation is not decoration: a `static X = class extends Exception {}` has to be serialized into the
 * `.d.ts` as a structural type, and that type contains `Exception`, whose statics contain it again — declaration
 * emit gives up with TS7056 and `akn build-package akanjs` fails. Naming the type breaks the cycle.
 */
export interface StatusException {
  new (message?: string, details?: unknown): Exception;
}

export class Exception extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      error: this.message,
      statusCode: this.statusCode,
      ...(this.details !== undefined ? { details: this.details } : {}),
      ...(this.data !== undefined ? { data: this.data } : {}),
    };
  }
  static BadRequest: StatusException = class BadRequestException extends Exception {
    constructor(message = "Bad Request", details?: unknown) {
      super(400, message, details);
    }
  };
  static Unauthorized: StatusException = class UnauthorizedException extends Exception {
    constructor(message = "Unauthorized", details?: unknown) {
      super(401, message, details);
    }
  };
  static Forbidden: StatusException = class ForbiddenException extends Exception {
    constructor(message = "Forbidden", details?: unknown) {
      super(403, message, details);
    }
  };
  static NotFound: StatusException = class NotFoundException extends Exception {
    constructor(message = "Not Found", details?: unknown) {
      super(404, message, details);
    }
  };
  static Conflict: StatusException = class ConflictException extends Exception {
    constructor(message = "Conflict", details?: unknown) {
      super(409, message, details);
    }
  };
  static UnsupportedMediaType: StatusException = class UnsupportedMediaTypeException extends Exception {
    constructor(message = "Unsupported Media Type", details?: unknown) {
      super(415, message, details);
    }
  };
  static Error: StatusException = class InternalServerErrorException extends Exception {
    constructor(message = "Internal Server Error", details?: unknown) {
      super(500, message, details);
    }
  };
}
