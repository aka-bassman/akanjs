import { Err } from "akanjs/dictionary";
import { adapt } from "../adapt";
import type { LlmAdaptor, LlmOption, LlmTurnAnswer, LlmTurnRequest } from "./llm.adaptor";
import { type OpenaiAnswer, OpenaiDialect } from "./openaiDialect";

/**
 * The framework's default provider, and the one an app gets without choosing.
 *
 * `accepts` is left undeclared, so by the time an attachment reaches the dialect `AgentService.readable` has
 * reduced it to its text and turned everything else into a note. That is deliberate rather than pending: DeepSeek's
 * chat API is text, and an adaptor that claimed otherwise would hand it bytes it answers about having never seen.
 * An app that wants vision swaps the role — `option.applyAdaptor(LlmAdaptorRole, OpenaiLlm)` or `AnthropicLlm`.
 */
export class DeepseekLlm
  extends adapt("deepseekLlm" as const, ({ use }) => ({
    llmOption: use<LlmOption>(),
  }))
  implements LlmAdaptor
{
  get #model() {
    return this.llmOption.model ?? "deepseek-v4-flash";
  }
  get #host() {
    return this.llmOption.host ?? "https://api.deepseek.com";
  }

  async chat(request: LlmTurnRequest, onDelta?: (delta: string) => void): Promise<LlmTurnAnswer | null> {
    if (!this.llmOption.apiKey) {
      this.logger.warn("No LLM API key is configured — set one with option.setLlm(). Agent turns are unavailable.");
      return null;
    }
    try {
      if (!onDelta) {
        const answer = await this.#api<OpenaiAnswer>(
          "/chat/completions",
          OpenaiDialect.requestBody(this.#model, request),
        );
        return OpenaiDialect.turnAnswer(answer);
      }
      const body = await this.#apiStream(
        "/chat/completions",
        OpenaiDialect.requestBody(this.#model, request, { stream: true }),
      );
      return await OpenaiDialect.consumeStream(body, onDelta);
    } catch (error) {
      // Logged here and rethrown rather than answered as `null`: a refusal the provider explained — a transcript
      // past the context window is the common one — is the whole of what the user needs to read in the chat, and
      // `null` would reach them as the one sentence that says a model is not configured.
      this.logger.error(`DeepSeek turn failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async #api<T>(path: string, body: object): Promise<T> {
    const response = await fetch(`${this.#host}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.llmOption.apiKey}` },
      body: JSON.stringify(body),
      // A model turn regularly outlives the usual 20s adapter budget; long tool turns finish well within this.
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw await DeepseekLlm.refusal(response);
    return (await response.json()) as T;
  }

  async #apiStream(path: string, body: object): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${this.#host}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.llmOption.apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok || !response.body) throw await DeepseekLlm.refusal(response);
    return response.body;
  }

  /** Carried on the `Err` so the chat prints the provider's own sentence rather than a status number. */
  static async refusal(response: Response): Promise<Error> {
    return new Err("agent.error.deepseekRequestFailed", {
      status: String(response.status),
      reason: await OpenaiDialect.reasonOf(response),
    });
  }
}
