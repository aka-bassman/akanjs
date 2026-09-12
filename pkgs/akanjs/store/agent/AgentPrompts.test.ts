import { describe, expect, test } from "bun:test";
import { AgentPrompts } from "./AgentPrompts";

describe("AgentPrompts", () => {
  test("parses a slash command into name and positional args", () => {
    expect(AgentPrompts.parseCommand("/reviewTask t1  urgent")).toEqual({
      name: "reviewTask",
      args: ["t1", "urgent"],
    });
    expect(AgentPrompts.parseCommand("/planWeek")).toEqual({ name: "planWeek", args: [] });
    expect(AgentPrompts.parseCommand("plain text")).toBeNull();
    expect(AgentPrompts.parseCommand("/bad!")).toBeNull();
    expect(AgentPrompts.parseCommand("/reviewTask free-form arg!")).toEqual({
      name: "reviewTask",
      args: ["free-form", "arg!"],
    });
  });

  test("normalizes a prompt result into chat messages, one per protocol content kind", () => {
    expect(AgentPrompts.messagesOf("Just review it.")).toEqual([{ role: "user", text: "Just review it." }]);
    expect(
      AgentPrompts.messagesOf([
        { role: "user", content: { type: "text", text: "Review this." } },
        {
          role: "user",
          content: {
            type: "resource",
            resource: { uri: "akan://task/1", mimeType: "application/json", text: '{"id":"1"}' },
          },
        },
        { role: "assistant", content: { type: "resource_link", uri: "akan://task/2", name: "next" } },
        { role: "user", content: { type: "image", data: "abc", mimeType: "image/png" } },
      ]),
    ).toEqual([
      { role: "user", text: "Review this." },
      { role: "user", text: '[resource akan://task/1]\n{"id":"1"}' },
      { role: "assistant", text: "[link next: akan://task/2]" },
      { role: "user", attachments: [{ name: "image.png", mimeType: "image/png", data: "abc" }] },
    ]);
  });
});

describe("AgentPrompts.parseCommand", () => {
  test("splits on whitespace and keeps a quoted argument whole", () => {
    expect(AgentPrompts.parseCommand("/reviewTask t1 urgent")).toEqual({ name: "reviewTask", args: ["t1", "urgent"] });
    expect(AgentPrompts.parseCommand('/reviewTask t1 "the whole sentence"')).toEqual({
      name: "reviewTask",
      args: ["t1", "the whole sentence"],
    });
    expect(AgentPrompts.parseCommand("/reviewTask 'single quoted'")).toEqual({
      name: "reviewTask",
      args: ["single quoted"],
    });
    expect(AgentPrompts.parseCommand("/planWeek")).toEqual({ name: "planWeek", args: [] });
    expect(AgentPrompts.parseCommand("not a command")).toBeNull();
  });

  test("an explicitly empty argument is an argument", () => {
    expect(AgentPrompts.parseCommand('/reviewTask t1 ""')).toEqual({ name: "reviewTask", args: ["t1", ""] });
  });
});
