import type { Guard, GuardScope, SignalContext } from "akanjs/signal";
import type { SerAccount } from "./account";
import { isAgentCall } from "./agentCall";
import { allow } from "./guards.helper";

export class Every implements Guard {
  static name = "Every";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    const account =
      context.transport === "http"
        ? (context.getHttpContext<{ account?: SerAccount }>().req.account ?? null)
        : (context.getWebSocketContext<{ account?: SerAccount }>().ws.data.account ?? null);
    return allow(context, account, ["user", "admin", "superAdmin"]);
  }
}

export class Owner implements Guard {
  static name = "Owner";
  static scope: GuardScope = "resource";
  canPass(context: SignalContext): boolean {
    const account =
      context.transport === "http"
        ? (context.getHttpContext<{ account?: SerAccount }>().req.account ?? null)
        : (context.getWebSocketContext<{ account?: SerAccount }>().ws.data.account ?? null);
    return allow(context, account, ["user", "admin", "superAdmin"]);
  }
}

export class Admin implements Guard {
  static name = "Admin";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    const account =
      context.transport === "http"
        ? (context.getHttpContext<{ account?: SerAccount }>().req.account ?? null)
        : (context.getWebSocketContext<{ account?: SerAccount }>().ws.data.account ?? null);
    return allow(context, account, ["admin", "superAdmin"]);
  }
}

export class SuperAdmin implements Guard {
  static name = "SuperAdmin";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    const account =
      context.transport === "http"
        ? (context.getHttpContext<{ account?: SerAccount }>().req.account ?? null)
        : (context.getWebSocketContext<{ account?: SerAccount }>().ws.data.account ?? null);
    return allow(context, account, ["superAdmin"]);
  }
}

export class User implements Guard {
  static name = "User";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    const account =
      context.transport === "http"
        ? (context.getHttpContext<{ account?: SerAccount }>().req.account ?? null)
        : (context.getWebSocketContext<{ account?: SerAccount }>().ws.data.account ?? null);
    return allow(context, account, ["user"]);
  }
}

export class SelfOrAdmin implements Guard {
  static name = "SelfOrAdmin";
  static scope: GuardScope = "resource";
  private argName: string;
  constructor(argName?: string) {
    this.argName = argName ?? "userId";
  }
  canPass(context: SignalContext): boolean {
    const account =
      context.transport === "http"
        ? (context.getHttpContext<{ account?: SerAccount<{ self?: { id: string }; me?: { id: string } }> }>().req
            .account ?? null)
        : (context.getWebSocketContext<{ account?: SerAccount<{ self?: { id: string }; me?: { id: string } }> }>().ws
            .data.account ?? null);
    const userId = context.getArg(this.argName);
    return !!userId && !!account && (account.self?.id === userId || !!account.me);
  }
}

/**
 * Passes a person and refuses a model — an MCP call, or any call on an agent's token. `agents = false` is what takes
 * the endpoint out of the MCP catalogue document itself; `account` scope is what refuses the call should one still
 * arrive. It says nothing about who the person is, so it rides beside a role guard: `guards: [Every, Person]`.
 */
export class Person implements Guard {
  static name = "Person";
  static scope: GuardScope = "account";
  static agents = false;
  canPass(context: SignalContext): boolean {
    return !isAgentCall(context);
  }
}
