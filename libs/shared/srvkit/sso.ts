import type { Guard, GuardScope, SignalContext } from "akanjs/signal";
import { assertSsoConfigured } from "./ssoHelper";

// ─── Guard Classes ────────────────────────────────────────────────────

// Each reads only whether its provider is configured, so it answers with no arguments and is safe to evaluate
// while filtering a catalogue — an unconfigured provider's endpoints drop out of the listing instead of being
// offered and then failing. That is what `account` means here; none of them touches the call's resource.

export class SSOKakao implements Guard {
  static name = "SSOKakao";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    assertSsoConfigured("kakao");
    return true;
  }
}

export class SSONaver implements Guard {
  static name = "SSONaver";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    assertSsoConfigured("naver");
    return true;
  }
}

export class SSOGithub implements Guard {
  static name = "SSOGithub";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    assertSsoConfigured("github");
    return true;
  }
}

export class SSOGoogle implements Guard {
  static name = "SSOGoogle";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    assertSsoConfigured("google");
    return true;
  }
}

export class SSOFacebook implements Guard {
  static name = "SSOFacebook";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    assertSsoConfigured("facebook");
    return true;
  }
}

export class SSOApple implements Guard {
  static name = "SSOApple";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    assertSsoConfigured("apple");
    return true;
  }
}
