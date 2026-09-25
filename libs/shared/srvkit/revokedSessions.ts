type RevokedSessionCheck = (sessionId: string) => Promise<boolean>;

/**
 * Whether an access token's session was revoked before the token expired. The answer lives in the OAuth service's
 * cache, but the two readers run where no service can be injected — `AccountMiddleware`, and the `/mcp` verifier
 * `option.ts` builds before any service exists — so the service registers the check here at boot and both ask
 * through it. No check registered means nothing was ever revoked, which is also the truth for an app that does not
 * mount the OAuth module.
 */
export class RevokedSessions {
  static #check: RevokedSessionCheck | null = null;

  static use(check: RevokedSessionCheck | null) {
    RevokedSessions.#check = check;
  }

  /** A cache that cannot answer lets the token live out its hour: locking every agent out is the worse failure. */
  static async has(sessionId: string | undefined): Promise<boolean> {
    if (!sessionId || !RevokedSessions.#check) return false;
    try {
      return await RevokedSessions.#check(sessionId);
    } catch {
      return false;
    }
  }
}
