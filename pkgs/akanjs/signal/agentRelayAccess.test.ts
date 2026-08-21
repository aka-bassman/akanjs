import { afterEach, describe, expect, test } from "bun:test";
import type { SignalContext } from "akanjs/signal";
import { AgentRelayAccess } from "./guards";

const contextWith = (account: unknown) => ({ get: () => account }) as unknown as SignalContext;

afterEach(() => {
  AgentRelayAccess.use(null);
});

describe("AgentRelayAccess", () => {
  test("allows everyone until a policy is registered", async () => {
    expect(await new AgentRelayAccess().canPass(contextWith(null))).toBe(true);
  });

  test("delegates to the registered policy", async () => {
    AgentRelayAccess.use((context) => context.get("account") !== null);
    expect(await new AgentRelayAccess().canPass(contextWith(null))).toBe(false);
    expect(await new AgentRelayAccess().canPass(contextWith({ id: "u1" }))).toBe(true);
  });

  test("a policy that throws fails closed", async () => {
    AgentRelayAccess.use(() => {
      throw new Error("boom");
    });
    expect(await new AgentRelayAccess().canPass(contextWith({ id: "u1" }))).toBe(false);
  });
});
