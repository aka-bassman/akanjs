import { beforeAll, describe, expect, test } from "bun:test";
import { getOrSetupSignalTestFetch } from "akanjs/test";

type UtilFetch = typeof import("../server").fetch;

let fetch: UtilFetch;

/** The relay is framework-embedded; this asserts it still serves through a lib that carries no agent module. */
describe("Agent Relay (framework-embedded)", () => {
  beforeAll(async () => {
    fetch = await getOrSetupSignalTestFetch<UtilFetch>();
  });

  // The key comes from `option.setLlm` and this lib registers none, so the refusal path never reaches a live call.
  test("refuses a turn when no LLM adaptor is configured", async () => {
    await expect(
      fetch.runAgentTurn([{ role: "user", text: "hi" }], [], [{ kind: "route", path: "/" }], null),
    ).rejects.toThrow(/llmUnavailable/);
  });
});
