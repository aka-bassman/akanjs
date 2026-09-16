import { Err } from "akanjs/dictionary";
import type {
  AgentWireAttachment,
  AgentWireMessage,
  LlmAccepts,
  LlmTurnRequest,
} from "./predefinedAdaptor/llm.adaptor";
import { LlmAdaptorRole } from "./predefinedAdaptor/role.adaptor";
import { serve } from "./serve";
import { ToolNames } from "./toolNames";

export class AgentService extends serve("agent" as const, ({ plug }) => ({
  llm: plug(LlmAdaptorRole),
})) {
  async runTurn(request: LlmTurnRequest, onDelta?: (delta: string) => void) {
    // A zone's tools are scope-prefixed with a `.`, which no provider's function schema accepts — renamed on the
    // way out and read back on the way in, so the browser is answered with the name its surface registered.
    const names = ToolNames.of(request);
    const prepared = names.encode(
      AgentService.instructed(AgentService.readable(AgentService.explained(request), this.llm.accepts)),
    );
    const answer = await this.llm.chat(prepared, onDelta);
    if (!answer) throw new Err("agent.error.llmUnavailable");
    return { text: answer.text ?? "", toolCalls: names.decode(answer.toolCalls ?? []), stop: answer.stop };
  }

  /**
   * The framework's half of the system prompt, ahead of whatever the app said so the app's text stays the more
   * specific one. Composed here rather than in an adaptor for the reason `explained` is: every adaptor would
   * otherwise have to remember it, and forgetting is silent.
   *
   * The last two sentences are the load-bearing ones, and both were measured against the provider rather than
   * guessed at (8 runs a cell, one screen, tools stubbed):
   *
   * - Batching. One call per turn costs a full model round trip and a resend of the whole transcript per call, and
   *   the turn cap then parks the run on a question halfway through. Asking for it took "approve these eight" from
   *   1.5 turns with three runs in eight that did nothing at all, to one turn in eight runs out of eight.
   * - Not re-reading. A model that has just written something goes back to look at what it did, one read per turn,
   *   which is where a chain of ten calls actually comes from — the change report it was already handed says the
   *   same thing. Saying so took "read the screen, then approve what is pending" from 3.0 turns to 2.0, its floor,
   *   in every run. It is scoped to confirmation on purpose: the read a fresh route needs after `navigate` is
   *   acquisition, and it survived the sentence in every run of that scenario.
   */
  static readonly preamble = [
    "You are an in-page assistant. Use the published tools to read and drive the screen the user is looking at.",
    "Issue every tool call that does not need another call's result in the same turn, rather than one call per turn.",
    "Prefer the tool that does the whole job in one call, such as a form's fill tool over one call per field.",
    "A tool result already reports what it changed, so never call a read afterwards to confirm work you have just done — answer the user from the results you already have.",
  ].join(" ");

  static instructed(request: LlmTurnRequest): LlmTurnRequest {
    return { ...request, instructions: [AgentService.preamble, request.instructions].filter(Boolean).join("\n\n") };
  }

  /**
   * Folds a failed turn into the message text. `error` is a field only this wire has, so a provider mapping reads
   * `text` and drops it — leaving the model an assistant turn that says nothing, with no hint that the attempt
   * failed, and every reason to make the same one again. Done here rather than per adaptor because every adaptor
   * would otherwise have to remember, and forgetting is silent.
   */
  static explained(request: LlmTurnRequest): LlmTurnRequest {
    if (!request.messages.some((message) => message.error)) return request;
    return { ...request, messages: request.messages.map((message) => AgentService.explainedMessage(message)) };
  }

  private static explainedMessage(message: AgentWireMessage): AgentWireMessage {
    const { error, ...rest } = message;
    if (!error) return message;
    return { ...rest, text: [message.text, `[The turn failed: ${error}]`].filter(Boolean).join("\n\n") };
  }

  /**
   * Replaces every attachment the provider cannot read with a note naming it, so no adaptor has to think about
   * attachments it does not support and none can lose one quietly. The model has to be *told*, not merely spared:
   * a file that vanishes on the way in is one it answers about from the filename, confidently and wrongly.
   *
   * The note rides in the message text because that is the one field every provider mapping already reads.
   */
  static readable(request: LlmTurnRequest, accepts: LlmAccepts | undefined): LlmTurnRequest {
    if (!request.messages.some((message) => message.attachments?.length)) return request;
    const messages = request.messages.map((message) => AgentService.readableMessage(message, accepts ?? {}));
    return { ...request, messages };
  }

  private static readableMessage(message: AgentWireMessage, accepts: LlmAccepts): AgentWireMessage {
    const { attachments = [], ...rest } = message;
    if (!attachments.length) return message;
    const kept = attachments.filter((attachment) => AgentService.isReadable(attachment, accepts));
    if (kept.length === attachments.length) return message;
    const notes = attachments.filter((attachment) => !kept.includes(attachment)).map(AgentService.note);
    return {
      ...rest,
      ...(kept.length ? { attachments: kept } : {}),
      text: [message.text, ...notes].filter(Boolean).join("\n\n"),
    };
  }

  /** Extracted text is readable by every model there is; bytes and links need the provider to say so. */
  private static isReadable(attachment: AgentWireAttachment, accepts: LlmAccepts): boolean {
    if (attachment.text) return true;
    if (!attachment.data && !attachment.url) return false;
    // The host builds this object itself and the type only claims a string, so the value is whatever it put there.
    // Unreadable is the fail-closed answer and costs the model a note naming the file; a deref takes the turn down
    // with a TypeError that names nothing, and every other attachment of the message with it.
    if (typeof attachment.mimeType !== "string") return false;
    return attachment.mimeType.startsWith("image/") ? !!accepts.image : !!accepts.document;
  }

  private static note(attachment: AgentWireAttachment): string {
    const why =
      !attachment.data && !attachment.url
        ? "its content is no longer available, as a reloaded conversation keeps the name and not the bytes"
        : typeof attachment.mimeType === "string"
          ? "this model cannot read that type"
          : "it names no type it could be read as";
    return `[Attachment not read: ${attachment.name} (${attachment.mimeType}) — ${why}. Tell the user it was not read instead of guessing what it holds, and ask for the text if the answer needs it.]`;
  }
}
