import { hostFromRequest, isJsonContentType, Logger } from "akanjs/common";
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
    if (origin !== "null" && (CrossSiteGuard.#isSameSite(origin, req, url) || CrossSiteGuard.#allowed.has(origin)))
      return;
    // Logged rather than echoed: the caller learns it may not, and the operator learns which origin tried against
    // which host we thought we were, which is the half that says whether a proxy is misreporting the host, an
    // allowlist entry is missing, or an attack is underway.
    CrossSiteGuard.logger.warn(
      `Refused "${key}" from cross-site origin ${origin} (request host ${hostFromRequest(req.headers, url)})`,
    );
    throw new Exception.Forbidden("This request was not permitted.");
  }

  /**
   * Host, not full origin — the same comparison `McpRouter` makes, for the same reason.
   *
   * The host is what the browser wrote from the URL it was told to open, so a page on another site POSTing here
   * still arrives with *our* host and its own `Origin`: comparing hosts refuses every cross-site caller. The
   * scheme is the one part of the origin a proxy routinely loses — a TLS-terminating edge (a Cloudflare tunnel,
   * an ingress without `x-forwarded-proto`) dials us over plain HTTP, so an `https://` caller would be measured
   * against a computed `http://` self and refused on every mutation. What that costs is a page served over
   * plaintext on our own host, which is an attacker who already holds the name.
   */
  static #isSameSite(origin: string, req: Request, url: URL): boolean {
    try {
      const { protocol, host } = new URL(origin);
      // Re-parsed under the caller's own scheme so an explicit default port (`:443` in a forwarded host) and its
      // absence in `Origin` compare equal.
      return host === new URL(`${protocol}//${hostFromRequest(req.headers, url)}`).host;
    } catch {
      return false;
    }
  }
}
