import { describe, expect, test } from "bun:test";
import { evaluateAkanConsoleInput, isAkanConsoleInputComplete } from "./consoleEvaluator";

describe("Akan console evaluator", () => {
  test("treats an input that ends inside an open construct as incomplete", () => {
    expect(isAkanConsoleInputComplete("const a = {")).toBe(false);
    expect(isAkanConsoleInputComplete("if (true) {")).toBe(false);
    expect(isAkanConsoleInputComplete("await service('user').listAll(")).toBe(false);
    expect(isAkanConsoleInputComplete("`unterminated")).toBe(false);
    expect(isAkanConsoleInputComplete("/* unterminated")).toBe(false);
  });

  test("treats a finished input as complete even when it throws at runtime", () => {
    expect(isAkanConsoleInputComplete("")).toBe(true);
    expect(isAkanConsoleInputComplete("const a = { b: 1 };\nreturn a.b;")).toBe(true);
    expect(isAkanConsoleInputComplete("nothing.here()")).toBe(true);
    expect(isAkanConsoleInputComplete("}")).toBe(true);
    expect(isAkanConsoleInputComplete("a b c")).toBe(true);
  });

  test("evaluates a multi-line block as one command", async () => {
    const context = { seven: () => 7 };

    await expect(
      evaluateAkanConsoleInput("const a = 1;\nconst b = await Promise.resolve(2);\nreturn a + b + seven();", context),
    ).resolves.toBe(10);
  });
});
