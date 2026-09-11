import { resolveJwt, resolveJwtSecret } from "@libs/util/srvkit";
import { getEnv } from "akanjs/base";
import { readAuthToken } from "akanjs/common";
import type { Account } from "akanjs/fetch";
import type { Middleware, SignalContext } from "akanjs/signal";
import type { ModulesOptions } from "../lib/option";
import type { AuthTokenMeta } from "./account";
import type { AccessAccount, ReqType } from "./accountMiddleware.helper";
import { isAgentToken } from "./agentCall";
import { RevokedSessions } from "./revokedSessions";

export class AccountMiddleware implements Middleware {
  static readonly refName = "AccountMiddleware";

  async use(env: ModulesOptions) {
    const { appName, environment } = getEnv();
    const jwtSecret = resolveJwtSecret(appName, environment, env.security?.jwtSecret);
    return async (context: SignalContext, next: () => Promise<unknown>) => {
      const req = (
        context.transport === "http" ? context.getHttpContext().req : context.getWebSocketContext().ws.data
      ) as Partial<ReqType>;
      const cookieJwt = readAuthToken((key) => req.cookies?.get(key));
      const account = await resolveJwt<AccessAccount>(
        jwtSecret,
        req.headers?.get("authorization") ?? (cookieJwt ? `Bearer ${cookieJwt}` : undefined),
        { appName, environment } as unknown as AccessAccount,
      );
      // An agent's token is the one kind a user can revoke before it expires (`/oauth/revoke`, the connected-apps
      // page), so it is the one kind checked against the revocation list; a browser session costs nothing here.
      const revoked =
        account.tokenType === "access" &&
        isAgentToken(account) &&
        (await RevokedSessions.has((account as AccessAccount & AuthTokenMeta).sid));
      Object.assign(req, {
        account: account.tokenType === "access" && !revoked ? account : ({ appName, environment } as Account),
        userAgent: req["user-agent"],
      });
      return await next();
    };
  }
}
