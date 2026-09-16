import { describe, expect, test } from "bun:test";
import type { LlmTurnRequest } from "akanjs/service";
import { OpenaiDialect } from "./openaiDialect";
import { OpenaiLlm } from "./openaiLlm";

const shot = { name: "shot.png", mimeType: "image/png", data: "QUJD" };

const asked = (attachments: LlmTurnRequest["messages"][number]["attachments"]): LlmTurnRequest => ({
  context: [],
  tools: [],
  messages: [{ role: "user", text: "what is in this", attachments }],
});

describe("OpenaiLlm content parts", () => {
  test("an image rides as its own part once the provider says it reads one", () => {
    const body = OpenaiDialect.requestBody("gpt-vision", asked([shot]), { accepts: { image: true } });
    expect(body.messages[1]).toEqual({
      role: "user",
      content: [
        { type: "text", text: "what is in this" },
        { type: "image_url", image_url: { url: "data:image/png;base64,QUJD" } },
      ],
    });
  });

  test("a url carrier is handed over as the address, not re-encoded", () => {
    const stored = { name: "hero.jpg", mimeType: "image/jpeg", url: "https://cdn/hero.jpg" };
    const body = OpenaiDialect.requestBody("gpt-vision", asked([stored]), { accepts: { image: true } });
    expect(body.messages[1]).toMatchObject({
      content: [
        { type: "text", text: "what is in this" },
        { type: "image_url", image_url: { url: "https://cdn/hero.jpg" } },
      ],
    });
  });

  test("an image carrying both is read from its bytes, so a display-only address cannot answer for it", () => {
    const both = { name: "shot.png", mimeType: "image/png", data: "QUJD", url: "blob:local/shot.png" };
    const body = OpenaiDialect.requestBody("gpt-vision", asked([both]), { accepts: { image: true } });
    expect(body.messages[1]).toMatchObject({
      content: [
        { type: "text", text: "what is in this" },
        { type: "image_url", image_url: { url: "data:image/png;base64,QUJD" } },
      ],
    });
  });

  test("a text attachment stays labelled in the text part beside the image", () => {
    const spec = { name: "spec.md", mimeType: "text/markdown", text: "page one" };
    const body = OpenaiDialect.requestBody("gpt-vision", asked([spec, shot]), { accepts: { image: true } });
    const parts = body.messages[1].content as { type: string; text?: string }[];
    expect(parts[0].text).toBe("what is in this\n\n--- attachment: spec.md (text/markdown) ---\npage one");
    expect(parts[1].type).toBe("image_url");
  });

  test("an image type the API does not read is named in the text, not sent as a part", () => {
    const body = OpenaiDialect.requestBody(
      "gpt-vision",
      asked([{ name: "IMG_0421.heic", mimeType: "image/heic", data: "QUJD" }]),
      { accepts: { image: true } },
    );
    expect(body.messages[1]).toEqual({
      role: "user",
      content:
        "what is in this\n\n[Attachment not read: IMG_0421.heic (image/heic) — this API reads no image of that type.]",
    });
  });

  test("with no accepts the turn is one string, exactly as the text-only default sends it", () => {
    const body = OpenaiDialect.requestBody("deepseek-v4-flash", asked([shot]));
    expect(body.messages[1]).toEqual({ role: "user", content: "what is in this" });
  });

  test("a message with no image is one string even where images are accepted", () => {
    const body = OpenaiDialect.requestBody("gpt-vision", asked([]), { accepts: { image: true } });
    expect(body.messages[1]).toEqual({ role: "user", content: "what is in this" });
  });
});

describe("OpenaiLlm refusals", () => {
  test("carries the provider's own sentence under its own key", async () => {
    const body = JSON.stringify({ error: { message: "context_length_exceeded" } });
    const error = (await OpenaiLlm.refusal(new Response(body, { status: 400 }))) as Error & {
      data?: Record<string, string>;
    };
    expect(error.message).toBe("agent.error.openaiRequestFailed");
    expect(error.data).toEqual({ status: "400", reason: "context_length_exceeded" });
  });
});
