import { describe, expect, test } from "bun:test";
import { SubspaceConfig } from "@akanjs/devkit/subspaceConfig";
import { SubspaceRunner } from "./subspace.runner";

const config = new SubspaceConfig({
  subspaces: [
    { name: "acme", repo: "git@github.com:acme/app.git", apps: ["acme"] },
    { name: "globex", repo: "git@github.com:globex/app.git", apps: ["globex", "globex-admin"] },
  ],
});

interface PromptCall {
  kind: "checkbox" | "select";
  message: string;
  choices: { name: string; value: string; description?: string }[];
  required?: boolean;
}

const fakePrompts = (answer: string | string[]) => {
  const calls: PromptCall[] = [];
  const prompts = {
    checkbox: (async (options: Omit<PromptCall, "kind">) => {
      calls.push({ kind: "checkbox", ...options });
      return answer;
    }) as never,
    select: (async (options: Omit<PromptCall, "kind">) => {
      calls.push({ kind: "select", ...options });
      return answer;
    }) as never,
  };
  return { prompts, calls };
};

describe("SubspaceRunner.chooseNames", () => {
  test("asks for several subspaces for status and push", async () => {
    const { prompts, calls } = fakePrompts(["acme", "globex"]);

    const names = await SubspaceRunner.chooseNames(config, "push", { interactive: true, prompts });

    expect(names).toEqual(["acme", "globex"]);
    expect(calls).toEqual([
      {
        kind: "checkbox",
        message: "Select subspaces to push",
        required: true,
        choices: [
          { name: "acme", value: "acme", description: "git@github.com:acme/app.git · acme" },
          { name: "globex", value: "globex", description: "git@github.com:globex/app.git · globex, globex-admin" },
        ],
      },
    ]);
  });

  test("asks for exactly one subspace for diff and pull", async () => {
    const { prompts, calls } = fakePrompts("globex");

    expect(await SubspaceRunner.chooseNames(config, "pull", { interactive: true, prompts })).toEqual(["globex"]);
    expect(await SubspaceRunner.chooseNames(config, "diff", { interactive: true, prompts })).toEqual(["globex"]);
    expect(calls.map((call) => [call.kind, call.message])).toEqual([
      ["select", "Select a subspace to pull"],
      ["select", "Select a subspace to diff"],
    ]);
  });

  test("refuses to guess without a terminal and names the -all form only where one exists", async () => {
    await expect(SubspaceRunner.chooseNames(config, "push", { interactive: false })).rejects.toThrow(
      "run `akan subspace push-all`",
    );
    await expect(SubspaceRunner.chooseNames(config, "status", { interactive: false })).rejects.toThrow(
      "run `akan subspace status-all`",
    );
    await expect(SubspaceRunner.chooseNames(config, "pull", { interactive: false })).rejects.toThrow(
      "reviewed one repo at a time",
    );
  });

  test("refuses an empty declaration before prompting", async () => {
    const { prompts, calls } = fakePrompts([]);
    const empty = new SubspaceConfig({ subspaces: [] });

    await expect(SubspaceRunner.chooseNames(empty, "push", { interactive: true, prompts })).rejects.toThrow(
      "declares no subspaces",
    );
    expect(calls).toEqual([]);
  });
});
