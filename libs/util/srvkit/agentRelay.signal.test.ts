import { beforeAll, describe, expect, test } from "bun:test";
import { getOrSetupSignalTestFetch } from "akanjs/test";

type UtilFetch = typeof import("../server").fetch;

let fetch: UtilFetch;

/** The relay is framework-embedded; this asserts it still serves through a lib that carries no agent module. */
describe("Agent Relay (framework-embedded)", () => {
  beforeAll(async () => {
    fetch = await getOrSetupSignalTestFetch<UtilFetch>();
  });

  // This lib names no `setAgentAccess` guard, so the call never reaches the LLM adaptor.
  test("refuses a turn when no agent access guard is registered", async () => {
    await expect(
      fetch.runAgentTurn([{ role: "user", text: "hi" }], [], [{ kind: "route", path: "/" }], null),
    ).rejects.toThrow(/Access denied by guard: AgentRelayAccess/);
  });
});
