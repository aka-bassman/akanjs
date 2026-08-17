import type { Guard, GuardScope } from "./guard";
import type { SignalContext } from "./signalContext";

export class Public implements Guard {
  static name = "Public";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    return true;
  }
}

export class None implements Guard {
  static name = "None";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    return false;
  }
}
