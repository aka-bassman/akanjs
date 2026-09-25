import { describe, expect, test } from "bun:test";
import { CodeTuiCommands } from "./CodeTuiCommands";

describe("CodeTuiCommands", () => {
  test("the menu opens only while a bare command is being typed", () => {
    expect(CodeTuiCommands.prefixOf("/mo", 3)).toBe("mo");
    expect(CodeTuiCommands.prefixOf("/", 1)).toBe("");
    // Once the command is chosen the rest is its argument, and a menu there covers the transcript for nothing.
    expect(CodeTuiCommands.prefixOf("/model deepseek/x", 17)).toBeUndefined();
    expect(CodeTuiCommands.prefixOf("add a comment module", 5)).toBeUndefined();
    // The caret is what decides, not the text: editing back into the command reopens the menu.
    expect(CodeTuiCommands.prefixOf("/model deepseek/x", 3)).toBe("mo");
  });

  test("a prefix filters, and an unknown one offers nothing rather than everything", () => {
    expect(CodeTuiCommands.matches("co").map((entry) => entry.name)).toEqual(["compact"]);
    expect(CodeTuiCommands.matches("")).toHaveLength(CodeTuiCommands.all.length);
    expect(CodeTuiCommands.matches("zzz")).toEqual([]);
  });

  test("help is generated from the same list, so it cannot go stale", () => {
    const help = CodeTuiCommands.help();
    for (const command of CodeTuiCommands.all) expect(help).toContain(`/${command.name}`);
  });

  test("every command the controller handles is offered, and every offered one is handled", async () => {
    const source = await Bun.file(`${import.meta.dir}/CodeTui.tsx`).text();
    const handled = new Set([...source.matchAll(/case "([a-z]+)":/g)].map((match) => match[1] ?? ""));
    for (const command of CodeTuiCommands.all) expect(handled.has(command.name)).toBe(true);
  });
});
