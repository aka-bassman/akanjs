import { adapt } from "../adapt";
import type { LlmAccepts, LlmAdaptor, LlmLimits, LlmOption, LlmTurnAnswer, LlmTurnRequest } from "./llm.adaptor";
import { LlmOverflow } from "./llmOverflow";
import { type OpenaiAnswer, OpenaiDialect } from "./openaiDialect";

/**
 * The default `LlmAdaptorRole` fill, for every host serving the chat-completions wire. `model` has no default: one
 * would age into a 404 and decide the vision claim on the app's behalf.
 */
export class OpenaiLlm
  extends adapt("akanOpenaiLlm" as const, ({ use }) => ({
    llmOption: use<LlmOption>(),
  }))
  implements LlmAdaptor
{
  static readonly defaultHost = "https://api.openai.com/v1";

  get #host() {
    return this.llmOption.host ?? OpenaiLlm.defaultHost;
  }

  /** No answer ceiling: the dialect sends none, so the provider's own default is the one that applies. */
  get limits(): LlmLimits {
    return this.llmOption.contextWindow ? { window: this.llmOption.contextWindow } : {};
  }

  /** A named host is text-only until `setLlm({ accepts })` says otherwise: undecodable bytes fail the whole turn. */
  get accepts(): LlmAccepts | undefined {
    if (this.llmOption.accepts) return this.llmOption.accepts;
    return this.llmOption.host ? undefined : { image: true };
  }

  async chat(request: LlmTurnRequest, onDelta?: (delta: string) => void): Promise<LlmTurnAnswer | null> {
    const model = this.llmOption.model;
    if (!this.llmOption.apiKey || !model) {
      this.logger.warn(
        "OpenaiLlm needs both apiKey and model — set them with option.setLlm(). Agent turns are unavailable.",
      );
      return null;
    }
    try {
      const { accepts } = this;
      if (!onDelta) {
        const answer = await this.#api<OpenaiAnswer>(
          "/chat/completions",
          OpenaiDialect.requestBody(model, request, { accepts }),
        );
        return { ...OpenaiDialect.turnAnswer(answer), model };
      }
      const body = await this.#apiStream(
        "/chat/completions",
        OpenaiDialect.requestBody(model, request, { accepts, stream: true }),
      );
      return { ...(await OpenaiDialect.consumeStream(body, onDelta)), model };
    } catch (error) {
      // Rethrown, not `null`: the user needs the provider's refusal, and `null` reads as "no model is configured".
      this.logger.error(`LLM turn failed: ${error instanceof Error ? error.message : String(error)}`);
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
    if (!response.ok) throw await OpenaiLlm.refusal(this.#host, response);
    return (await response.json()) as T;
  }

  async #apiStream(path: string, body: object): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${this.#host}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.llmOption.apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok || !response.body) throw await OpenaiLlm.refusal(this.#host, response);
    return response.body;
  }

  static async refusal(host: string, response: Response): Promise<Error> {
    return LlmOverflow.refusal(host, response.status, await OpenaiDialect.reasonOf(response));
  }
}
