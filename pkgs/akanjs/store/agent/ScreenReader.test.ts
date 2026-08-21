import "../../test/registerDom";
import { beforeAll, describe, expect, test } from "bun:test";

let ScreenReader: typeof import("./ScreenReader").ScreenReader;

beforeAll(async () => {
  ({ ScreenReader } = await import("./ScreenReader"));
});

const readOf = (html: string) => {
  document.body.innerHTML = html;
  return ScreenReader.read();
};

describe("ScreenReader", () => {
  test("keeps heading levels, list bullets, and the page title", () => {
    document.title = "Quickstart";
    const text = readOf("<h1>Intro</h1><h3>Steps</h3><p>Read this.</p><ul><li>one</li><li>two</li></ul>");
    expect(text.startsWith("Page: Quickstart")).toBe(true);
    expect(text).toContain("\n# Intro");
    expect(text).toContain("\n### Steps");
    expect(text).toContain("\nRead this.");
    expect(text).toContain("\n- one");
    expect(text).toContain("\n- two");
  });

  test("keeps a link's href inline in its sentence", () => {
    const text = readOf('<p>See <a href="/docs">the docs</a> now</p><a href="/docs">/docs</a>');
    expect(text).toContain("See the docs (/docs) now");
    // A link whose text is its href gains nothing from repeating it.
    expect(text).not.toContain("/docs (/docs)");
  });

  test("skips scripts, hidden subtrees, and the agent's own UI", () => {
    const text = readOf(
      '<p>visible</p><script>secretCode()</script><div hidden>gone</div><div aria-hidden="true">gone too</div>' +
        '<div style="display:none">styled away</div><aside data-agent-ui=""><p>transcript</p></aside>',
    );
    expect(text).toContain("visible");
    expect(text).not.toContain("secretCode");
    expect(text).not.toContain("gone");
    expect(text).not.toContain("styled away");
    expect(text).not.toContain("transcript");
  });

  test("reads controls by their akan annotation and never a password's value", () => {
    const text = readOf(
      '<input data-akan-state="task.title" value="Draft plan" />' +
        '<input type="password" value="hunter2" placeholder="pw" />' +
        '<input type="checkbox" name="done" checked />' +
        '<button data-akan-action="submitTask">Save</button>',
    );
    expect(text).toContain('[input task.title: "Draft plan"]');
    expect(text).not.toContain("hunter2");
    expect(text).toContain("[checkbox done: on]");
    expect(text).toContain("[button: Save → submitTask]");
  });

  test("truncates past the limit and says so", () => {
    const text = readOf(`<p>${"a".repeat(ScreenReader.limit + 500)}</p>`);
    expect(text.length).toBeLessThan(ScreenReader.limit + 100);
    expect(text).toContain("truncated");
  });
});
