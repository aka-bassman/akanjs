import { describe, expect, test } from "bun:test";
import { DeepseekLlm } from "./deepseekLlm";

describe("DeepseekLlm refusals", () => {
  test("carries the provider's own sentence, which is where a context overflow says so", async () => {
    const body = JSON.stringify({ error: { message: "This model's maximum context length is 65536 tokens" } });
    const error = (await DeepseekLlm.refusal(new Response(body, { status: 400 }))) as Error & {
      data?: Record<string, string>;
    };
    expect(error.message).toBe("agent.error.deepseekRequestFailed");
    expect(error.data).toEqual({
      status: "400",
      reason: "This model's maximum context length is 65536 tokens",
    });
  });

  test("a body that is not the dialect's JSON falls back to the status line", async () => {
    const error = (await DeepseekLlm.refusal(new Response("<html>gateway</html>", { status: 502 }))) as Error & {
      data?: Record<string, string>;
    };
    expect(error.data?.status).toBe("502");
    expect(error.data?.reason).toBeTruthy();
  });
});
