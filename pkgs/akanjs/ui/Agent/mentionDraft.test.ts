import { describe, expect, test } from "bun:test";
import { $getRoot, $isElementNode, createEditor, type LexicalEditor } from "lexical";
import { $isMentionNode, MentionNode } from "./MentionNode";
import { MentionDraft } from "./mentionDraft";

const editorOf = (): LexicalEditor =>
  createEditor({
    namespace: "mentionDraftTest",
    nodes: [MentionNode],
    onError: (error: Error) => {
      throw error;
    },
  });

const written = (text: string) => {
  const editor = editorOf();
  editor.update(() => MentionDraft.write(text), { discrete: true });
  return editor;
};

const read = (editor: LexicalEditor) => editor.getEditorState().read(() => MentionDraft.read());

const labels = (editor: LexicalEditor) =>
  editor.getEditorState().read(() => {
    const paragraph = $getRoot().getLastChild();
    if (!$isElementNode(paragraph)) return [];
    return paragraph.getChildren().flatMap((child) => ($isMentionNode(child) ? [child.reference.label] : []));
  });

const karina = "@[Karina](mention:videoCharacter/c1)";
const body = "@[Cut 3 body](mention:videoCut/6a1f#cutFrames.2.content)";

describe("MentionDraft", () => {
  test("a draft comes back out of the editor exactly as it went in", () => {
    for (const text of [
      "",
      "plain text",
      `compare ${karina} and this`,
      `${karina}${body}`,
      `fix ${body}\nthen tell me why`,
      "an @ on its own, and an email@example.com",
    ])
      expect(read(written(text))).toBe(text);
  });

  test("a pointer is one node drawn as its label, and the token is what it reads as", () => {
    const editor = written(`compare ${karina} and ${body}`);
    expect(labels(editor)).toEqual(["Karina", "Cut 3 body"]);
  });

  // Every offset the chat hands over is an offset into the draft string, tokens counted in full, because that is
  // the text its `@` menu and its recall both measure against.
  test("the caret round-trips through a draft-string offset", () => {
    const editor = written(`compare ${karina} and this`);
    for (const at of [0, 3, 8, 8 + karina.length, `compare ${karina} and this`.length]) {
      editor.update(() => MentionDraft.place(at), { discrete: true });
      expect(editor.getEditorState().read(() => MentionDraft.caret())).toBe(at);
    }
  });

  test("an offset inside a pointer lands on its far edge rather than splitting it", () => {
    const editor = written(`compare ${karina} and this`);
    editor.update(() => MentionDraft.place(20), { discrete: true });
    expect(editor.getEditorState().read(() => MentionDraft.caret())).toBe(8 + karina.length);
  });

  test("a line break survives the trip, because Shift+Enter writes one", () => {
    const editor = written("first\nsecond");
    expect(read(editor)).toBe("first\nsecond");
    editor.update(() => MentionDraft.place(6), { discrete: true });
    expect(editor.getEditorState().read(() => MentionDraft.caret())).toBe(6);
  });
});
