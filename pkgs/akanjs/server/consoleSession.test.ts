import { afterEach, describe, expect, test } from "bun:test";
import { PassThrough } from "node:stream";
import { AkanConsoleSession } from "./consoleSession";

const pasteStart = "\u001b[200~";
const pasteEnd = "\u001b[201~";

class Harness {
  readonly context: Record<string, unknown> = { seven: () => 7 };
  readonly #input = new PassThrough();
  readonly #output = new PassThrough();
  readonly #chunks: string[] = [];
  readonly #done: Promise<void>;

  constructor() {
    this.#output.on("data", (chunk: Buffer | string) => this.#chunks.push(String(chunk)));
    const session = new AkanConsoleSession({
      context: this.context,
      prompt: "akan> ",
      input: this.#input as unknown as typeof process.stdin,
      output: this.#output as unknown as typeof process.stdout,
    });
    this.#done = session.run();
  }

  get output() {
    return this.#chunks.join("");
  }

  async send(...chunks: string[]) {
    for (const chunk of chunks) {
      this.#input.write(chunk);
      await this.settle();
    }
  }

  async settle() {
    for (let turn = 0; turn < 20; turn += 1) await new Promise((resolve) => setTimeout(resolve, 1));
  }

  async close() {
    this.#input.end();
    await this.#done;
  }
}

describe("Akan console session", () => {
  let harness: Harness | null = null;

  afterEach(async () => {
    await harness?.close();
    harness = null;
  });

  test("runs a pasted block as one command", async () => {
    harness = new Harness();
    await harness.send("const a = 1;\nconst b = 2;\nreturn a + b + seven();\n");

    expect(harness.output).toContain("10");
    expect(harness.output).not.toContain("SyntaxError");
    expect(harness.output).not.toContain("ReferenceError");
  });

  test("keeps a bracketed paste together across chunks and marker splits", async () => {
    harness = new Harness();
    await harness.send(`${pasteStart}const x = 41;\r`, "return x + 1;\r\u001b[20", `1~`);

    expect(harness.output).toContain("42");
    expect(harness.output).not.toContain("ReferenceError");
  });

  test("waits for enter when a paste has no trailing newline", async () => {
    harness = new Harness();
    await harness.send(`${pasteStart}const y = 5;\nreturn y * 2${pasteEnd}`);

    expect(harness.output).not.toContain("10");

    await harness.send("\r");
    expect(harness.output).toContain("10");
  });

  test("reads an unfinished line at the continuation prompt", async () => {
    harness = new Harness();
    await harness.send("if (true) {\n");

    expect(harness.output).toContain("... ");
    expect(harness.output).not.toContain("SyntaxError");

    await harness.send("  return seven();\n", "}\n");
    expect(harness.output).toContain("7");
  });

  test("discards the pending buffer on .clear and on SIGINT", async () => {
    harness = new Harness();
    await harness.send("const broken = {\n", ".clear\n", "return 1;\n");

    expect(harness.output).toContain("1");
    expect(harness.output).not.toContain("SyntaxError");

    await harness.send("const alsoBroken = {\n", "\u0003", "return 2;\n");
    expect(harness.output).toContain("2");
    expect(harness.output).not.toContain("SyntaxError");
  });

  test("prints help and globals", async () => {
    harness = new Harness();
    await harness.send(".help\n", ".globals\n");

    expect(harness.output).toContain("Multi-line input:");
    expect(harness.output).toContain("seven");
  });

  test("evaluates the last line when the input ends without a newline", async () => {
    const ending = new Harness();
    await ending.send("const piped = 3;\nreturn piped + 4");
    await ending.close();

    expect(ending.output).toContain("7");
  });

  test("closes on .exit", async () => {
    const closing = new Harness();
    await closing.send(".exit\n");
    await closing.close();

    expect(closing.output).toContain("akan> ");
  });
});
