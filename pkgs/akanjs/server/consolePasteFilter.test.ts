import { describe, expect, test } from "bun:test";
import { ConsolePasteFilter } from "./consolePasteFilter";

const pasteStart = "\u001b[200~";
const pasteEnd = "\u001b[201~";

interface Run {
  forwarded: string;
  boundaries: { pasting: boolean; endsWithNewline: boolean }[];
}

const run = (chunks: string[]): Run => {
  const forwarded: string[] = [];
  const boundaries: Run["boundaries"] = [];
  const filter: ConsolePasteFilter = new ConsolePasteFilter(() =>
    boundaries.push({ pasting: filter.isPasting, endsWithNewline: filter.endsWithNewline }),
  );
  filter.on("data", (chunk: Buffer) => forwarded.push(chunk.toString("utf8")));
  for (const chunk of chunks) filter.write(chunk);
  filter.end();
  return { forwarded: forwarded.join(""), boundaries };
};

describe("Console paste filter", () => {
  test("strips paste markers and reports the paste boundary", () => {
    const { forwarded, boundaries } = run([`${pasteStart}const a = 1;\rreturn a;\r${pasteEnd}`]);

    expect(forwarded).toBe("const a = 1;\rreturn a;\r");
    expect(boundaries[0]).toEqual({ pasting: false, endsWithNewline: true });
  });

  test("holds a marker split across chunks", () => {
    const { forwarded, boundaries } = run([`${pasteStart}f()\r\u001b[20`, "1~"]);

    expect(forwarded).toBe("f()\r");
    expect(boundaries.some((boundary) => boundary.pasting)).toBe(true);
    expect(boundaries.at(-1)).toEqual({ pasting: false, endsWithNewline: true });
  });

  test("reports a paste that ends mid-line as unterminated", () => {
    const { boundaries } = run([`${pasteStart}return 1${pasteEnd}`]);

    expect(boundaries.every((boundary) => !boundary.endsWithNewline)).toBe(true);
  });

  test("passes other escape sequences through untouched", () => {
    const { forwarded } = run(["\u001b[A\u001b[B\r"]);

    expect(forwarded).toBe("\u001b[A\u001b[B\r");
  });
});
