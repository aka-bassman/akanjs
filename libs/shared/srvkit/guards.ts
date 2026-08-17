import type { Guard, GuardScope, SignalContext } from "akanjs/signal";
import type { SerAccount } from "./account";
import { allow } from "./guards.helper";

// Every guard below carries an explicit `scope`, including the resource one. An MCP catalogue evaluates only
// the `account` guards when deciding what to list, and treats an unmarked guard as `resource` — so a missing
// marker is invisible rather than an error. Writing all of them down is what makes that auditable.

export class Every implements Guard {
  static name = "Every";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    return allow(context, context.get<SerAccount>("account"), ["user", "admin", "superAdmin"]);
  }
}

export class Owner implements Guard {
  static name = "Owner";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    return allow(context, context.get<SerAccount>("account"), ["user", "admin", "superAdmin"]);
  }
}

export class Admin implements Guard {
  static name = "Admin";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    return allow(context, context.get<SerAccount>("account"), ["admin", "superAdmin"]);
  }
}

export class SuperAdmin implements Guard {
  static name = "SuperAdmin";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    return allow(context, context.get<SerAccount>("account"), ["superAdmin"]);
  }
}

export class User implements Guard {
  static name = "User";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    return allow(context, context.get<SerAccount>("account"), ["user"]);
  }
}

export class SelfOrAdmin implements Guard {
  static name = "User";
  // Reads an argument, so it fails closed when evaluated without one and must never gate a listing.
  static scope: GuardScope = "resource";
  private argName: string;
  constructor(argName?: string) {
    this.argName = argName ?? "userId";
  }
  canPass(context: SignalContext): boolean {
    const account = context.get<SerAccount<{ self?: { id: string }; me?: { id: string } }>>("account");
    const userId = context.getArg(this.argName);
    return !!userId && !!account && (account.self?.id === userId || !!account.me);
  }
}
