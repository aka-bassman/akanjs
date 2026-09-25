import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { codeAgentSessionName } from "akanjs/common";
import { CodeSessionIndex } from "./CodeSessionIndex";

const write = (dir: string, id: string, lines: unknown[]) => {
  const file = path.join(dir, `2026-09-20T10-00-00-000Z_${id}.jsonl`);
  writeFileSync(file, `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`);
  return file;
};

const session = (id: string) => ({ type: "session", version: 3, id, cwd: "/repo" });
const user = (text: string) => ({ type: "message", message: { role: "user", content: [{ type: "text", text }] } });
const assistant = (text: string) => ({
  type: "message",
  message: { role: "assistant", content: [{ type: "text", text }] },
});

describe("CodeSessionIndex", () => {
  test("reads the name, the opening ask and how many turns a session holds", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "akan-sessions-"));
    write(dir, "s1", [
      session("s1"),
      user("add a comment module"),
      assistant("done"),
      user("now wire it up"),
      { type: "session_info", name: "add-a-comment-module" },
      // A rename appends rather than editing, so the last entry has to win.
      { type: "session_info", name: "comment-module" },
    ]);
    const [entry] = CodeSessionIndex.list(dir);
    expect(entry?.id).toBe("s1");
    expect(entry?.name).toBe("comment-module");
    expect(entry?.opening).toBe("add a comment module");
    expect(entry?.turns).toBe(2);
  });

  test("a file that is not a session is skipped rather than listed as a blank one", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "akan-sessions-"));
    writeFileSync(path.join(dir, "notes.txt"), "not a session");
    write(dir, "s2", [{ type: "model_change", provider: "deepseek" }, user("hi")]);
    write(dir, "s3", [session("s3"), user("hi")]);
    expect(CodeSessionIndex.list(dir).map((entry) => entry.id)).toEqual(["s3"]);
  });

  test("an id resolves to its file, and an unknown one to nothing", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "akan-sessions-"));
    const file = write(dir, "s4", [session("s4"), user("hi")]);
    expect(CodeSessionIndex.fileOf(dir, "s4")).toBe(file);
    // Resuming a typo has to fail rather than open a new session that looks like one that lost its history.
    expect(CodeSessionIndex.fileOf(dir, "s5")).toBeUndefined();
  });

  test("a missing directory lists nothing instead of throwing", () => {
    expect(CodeSessionIndex.list(path.join(tmpdir(), "akan-sessions-missing"))).toEqual([]);
  });
});

describe("codeAgentSessionName", () => {
  test("names a session after what it was asked, in one glanceable line", () => {
    expect(codeAgentSessionName("Add a comment module to apps/minimal")).toBe("add-a-comment-module-to-apps-minimal");
    // Cut on a word, never mid-word: half a word reads as a typo rather than a shortening.
    expect(codeAgentSessionName("Add a comment module to apps/minimal and wire up its dictionary")).toBe(
      "add-a-comment-module-to-apps-minimal-and",
    );
    expect(codeAgentSessionName("안녕, 모듈 하나 만들어줘")).toBe("안녕-모듈-하나-만들어줘");
    // A prompt that is all code says nothing about itself; a name is still better than none.
    expect(codeAgentSessionName("```ts\nconst a = 1;\n```")).toBe("session");
  });
});
