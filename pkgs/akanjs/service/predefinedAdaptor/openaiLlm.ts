import { Err } from "akanjs/dictionary";
import { adapt } from "../adapt";
import type { LlmAccepts, LlmAdaptor, LlmOption, LlmTurnAnswer, LlmTurnRequest } from "./llm.adaptor";
import { type OpenaiAnswer, OpenaiDialect } from "./openaiDialect";

/**
 * OpenAI's chat-completions endpoint, and every gateway that serves the same dialect — `host` is what points it
 * at one. It is `DeepseekLlm`'s sibling rather than its replacement: same wire, and the difference that earns a
 * second class is that this one declares `accepts`, so an attached image reaches the model as an image part
 * instead of a note saying it could not be read.
 *
 * `model` is required and has no default. A default would be a model name that ages out of the provider's
 * catalogue into a 404 at the first turn, and — worse here than for a text-only adaptor — it would decide the
 * vision claim below on the app's behalf. Name the model in `option.setLlm({ model })`, and name
 * `accepts: { image: false }` beside it when that model is one of the provider's text-only ones.
 */
export class OpenaiLlm
  extends adapt("openaiLlm" as const, ({ use }) => ({
    llmOption: use<LlmOption>(),
  }))
  implements LlmAdaptor
{
  get #host() {
    return this.llmOption.host ?? "https://api.openai.com/v1";
  }

  /** The endpoint takes image parts, so that is the provider's answer; a model that does not takes the override. */
  get accepts(): LlmAccepts {
    return this.llmOption.accepts ?? { image: true };
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
        return OpenaiDialect.turnAnswer(answer);
      }
      const body = await this.#apiStream(
        "/chat/completions",
        OpenaiDialect.requestBody(model, request, { accepts, stream: true }),
      );
      return await OpenaiDialect.consumeStream(body, onDelta);
    } catch (error) {
      // Logged and rethrown rather than answered as `null` — see `DeepseekLlm.chat` for why the two differ.
      this.logger.error(`OpenAI turn failed: ${error instanceof Error ? error.message : String(error)}`);
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
    if (!response.ok) throw await OpenaiLlm.refusal(response);
    return (await response.json()) as T;
  }

  async #apiStream(path: string, body: object): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${this.#host}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.llmOption.apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok || !response.body) throw await OpenaiLlm.refusal(response);
    return response.body;
  }

  /** Carried on the `Err` so the chat prints the provider's own sentence rather than a status number. */
  static async refusal(response: Response): Promise<Error> {
    return new Err("agent.error.openaiRequestFailed", {
      status: String(response.status),
      reason: await OpenaiDialect.reasonOf(response),
    });
  }
}
