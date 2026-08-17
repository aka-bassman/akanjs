import { resolveJwt, resolveJwtSecret } from "@libs/util/srvkit";
import type { Account } from "akanjs/fetch";
import type { Middleware, SignalContext } from "akanjs/signal";
import type { ModulesOptions } from "../lib/option";
import type { AccessAccount, ReqType } from "./accountMiddleware.helper";

export class AccountMiddleware implements Middleware {
  static readonly refName = "AccountMiddleware";

  async use(env: ModulesOptions) {
    const jwtSecret = resolveJwtSecret(env.appName, env.environment, env.security?.jwtSecret);
    return async (context: SignalContext, next: () => Promise<unknown>) => {
      const req = (
        context.transport === "http" ? context.getHttpContext().req : context.getWebSocketContext().ws.data
      ) as Partial<ReqType>;
      const account = await resolveJwt<AccessAccount>(
        jwtSecret,
        req.headers?.get("authorization") ?? (req.cookies?.has("jwt") ? `Bearer ${req.cookies.get("jwt")}` : undefined),
        { appName: env.appName, environment: env.environment } as unknown as AccessAccount,
      );
      Object.assign(req, {
        account:
          account.tokenType === "access"
            ? account
            : ({ appName: env.appName, environment: env.environment } as Account),
        userAgent: req["user-agent"],
      });
      return await next();
    };
  }
}
