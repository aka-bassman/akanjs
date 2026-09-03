import { isJsonContentType, Logger, originFromRequest } from "akanjs/common";
import { Exception } from "./exception";

export interface CrossSiteOption {
  /**
   * Origins allowed to drive a mutation besides the one serving the request. The native shells are here by
   * default because a Capacitor webview is a real caller whose origin is never the serve domain.
   */
  allowedOrigins?: string[];
  /** Turns the whole gate off. For a deployment whose API is reached only by non-browser callers. */
  enabled?: boolean;
}

/**
 * Refuses a state-changing request a browser made from somewhere else.
 *
 * The framework authenticates with a `SameSite=None` cookie, which a browser attaches to **every** cross-site
 * request, and `Request.json()` reads a body whatever content type it claims. Without this, any page on the
 * internet could POST a form at a mutation and have it run as whoever was signed in — the response is unreadable
 * without CORS headers, but the write already landed.
 *
 * Two independent gates, because neither covers the other:
 *
 * - **Content type.** Demanding `application/json` puts a CORS preflight in front of every JSON mutation, and
 *   the preflight fails because nothing here answers one. This is what closes the hole for the common case.
 * - **Origin.** A file upload is `multipart/form-data`, which is preflight-free by spec and cannot be made to
 *   require JSON, so the only thing left to check is who sent it. Also covers a mutation with no body at all.
 *
 * A request with no `Origin` header is allowed: browsers set it on every POST, so its absence means a
 * non-browser caller (a server, a CLI, a test), which has no ambient credential to be abused. A literal
 * `Origin: null` is refused — that is the opaque origin a sandboxed frame or a `data:` document sends.
 */
export class CrossSiteGuard {
  static readonly logger = new Logger("CrossSiteGuard");
  /** iOS ships `capacitor://localhost`, Android `http://localhost`, older shells `ionic://localhost`. */
  static readonly nativeOrigins = ["capacitor://localhost", "ionic://localhost", "http://localhost"] as const;
  static #enabled = true;
  static #allowed = new Set<string>(CrossSiteGuard.nativeOrigins);

  /** Applied at boot from the mounting app's `option.ts`; the native shells stay allowed unless disabled. */
  static configure({ allowedOrigins = [], enabled = true }: CrossSiteOption) {
    CrossSiteGuard.#enabled = enabled;
    CrossSiteGuard.#allowed = new Set([...CrossSiteGuard.nativeOrigins, ...allowedOrigins]);
  }

  static reset() {
    CrossSiteGuard.#enabled = true;
    CrossSiteGuard.#allowed = new Set(CrossSiteGuard.nativeOrigins);
  }

  /**
   * The body gate. Called only where a JSON body is about to be read, so an upload mutation — whose content type
   * is multipart by construction — reaches `assertOrigin` and nothing else.
   */
  static assertJsonBody(contentType: string | null) {
    if (!CrossSiteGuard.#enabled) return;
    if (isJsonContentType(contentType)) return;
    throw new Exception.UnsupportedMediaType("Content-Type must be application/json.");
  }

  static assertOrigin(req: Request, url: URL, key: string) {
    if (!CrossSiteGuard.#enabled) return;
    const origin = req.headers.get("origin");
    if (origin === null) return;
    if (origin !== "null" && (origin === originFromRequest(req.headers, url) || CrossSiteGuard.#allowed.has(origin)))
      return;
    // Logged rather than echoed: the caller learns it may not, and the operator learns which origin tried, which
    // is the half that says whether an allowlist entry is missing or an attack is underway.
    CrossSiteGuard.logger.warn(`Refused "${key}" from cross-site origin ${origin}`);
    throw new Exception.Forbidden("This request was not permitted.");
  }
}
