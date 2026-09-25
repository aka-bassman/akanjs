import { describe, expect, test } from "bun:test";
import { $createParagraphNode, $createTextNode, $getRoot, COLLABORATION_TAG, createEditor } from "lexical";

// What useLocalOnlyTrigger depends on. If lexical ever fired update listeners out of registration order, or
// stopped tagging collaborative updates, the gate would stop opening the menu at all rather than fail loudly.
describe("update listener ordering the typeahead gate relies on", () => {
  const runTwoUpdates = () => {
    const editor = createEditor({ namespace: "test", onError: () => {} });
    let isRemoteUpdate = false;
    const observed: boolean[] = [];
    editor.registerUpdateListener(({ tags }) => {
      isRemoteUpdate = tags.has(COLLABORATION_TAG);
    });
    // A block body on purpose: lexical stores whatever an update listener returns and calls it as a teardown
    // before the next update, so a concise `observed.push(...)` hands it the array length.
    editor.registerUpdateListener(() => {
      observed.push(isRemoteUpdate);
    });
    const append = (text: string) => $getRoot().append($createParagraphNode().append($createTextNode(text)));
    editor.update(() => append("local"), { discrete: true });
    editor.update(() => append("remote"), { discrete: true, tag: COLLABORATION_TAG });
    return observed;
  };

  test("the listener registered first has already written the flag when the next one runs", () => {
    expect(runTwoUpdates()).toEqual([false, true]);
  });
});
