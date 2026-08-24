import { describe, expect, test } from "bun:test";
import { AgentService } from "./agent.service";
import type { LlmTurnRequest } from "./predefinedAdaptor/llm.adaptor";

const turn = (): LlmTurnRequest => ({
  tools: [],
  context: [],
  messages: [
    {
      role: "user",
      text: "what do these say?",
      attachments: [
        { name: "shot.png", mimeType: "image/png", data: "AAAA" },
        { name: "spec.pdf", mimeType: "application/pdf", data: "JVBER" },
        { name: "notes.md", mimeType: "text/markdown", text: "# hi" },
        { name: "gone.png", mimeType: "image/png" },
      ],
    },
  ],
});

describe("AgentService.readable", () => {
  test("a text-only provider keeps extracted text and is told about the rest", () => {
    const [message] = AgentService.readable(turn(), undefined).messages;
    expect(message.attachments).toEqual([{ name: "notes.md", mimeType: "text/markdown", text: "# hi" }]);
    expect(message.text).toContain("what do these say?");
    expect(message.text).toContain("Attachment not read: shot.png (image/png)");
    expect(message.text).toContain("Attachment not read: spec.pdf (application/pdf)");
    expect(message.text).toContain("this model cannot read that type");
    expect(message.text).toContain("Attachment not read: gone.png");
    expect(message.text).toContain("no longer available");
  });

  test("a vision provider keeps its images and still loses the document", () => {
    const [message] = AgentService.readable(turn(), { image: true }).messages;
    expect(message.attachments?.map((one) => one.name)).toEqual(["shot.png", "notes.md"]);
    expect(message.text).toContain("Attachment not read: spec.pdf");
    expect(message.text).not.toContain("Attachment not read: shot.png");
  });

  test("an attachment carrying nothing is unreadable however much the provider accepts", () => {
    const [message] = AgentService.readable(turn(), { image: true, document: true }).messages;
    expect(message.attachments?.map((one) => one.name)).toEqual(["shot.png", "spec.pdf", "notes.md"]);
    expect(message.text).toContain("Attachment not read: gone.png");
    expect(message.text).toContain("no longer available");
  });

  test("a transcript with no attachment is the same object, so the common turn allocates nothing", () => {
    const request: LlmTurnRequest = { tools: [], context: [], messages: [{ role: "user", text: "hi" }] };
    expect(AgentService.readable(request, undefined)).toBe(request);
  });
});
