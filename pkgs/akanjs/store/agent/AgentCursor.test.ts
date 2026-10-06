import "../../test/registerDom";
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { AgentCursor } from "./AgentCursor";
import { ScreenFlash } from "./ScreenFlash";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const cursors = () => document.querySelectorAll(`.${AgentCursor.className}`);

describe("AgentCursor", () => {
  let target: HTMLElement;
  const stubs: { mockRestore: () => void }[] = [];

  beforeEach(() => {
    document.body.innerHTML = `<button id="save">Save</button>`;
    target = document.getElementById("save") as HTMLElement;
    stubs.push(
      spyOn(ScreenFlash, "onTop").mockImplementation(() => true),
      spyOn(ScreenFlash, "whenStill").mockImplementation((_target, done) => done()),
    );
  });

  afterEach(() => {
    for (const stub of stubs.splice(0)) stub.mockRestore();
  });

  test("a pointer shown again before a hide settles is still removed when the turn ends", async () => {
    AgentCursor.hold();
    await AgentCursor.press(target);
    AgentCursor.think();
    AgentCursor.hide();
    await AgentCursor.press(target);
    await wait(20);
    AgentCursor.think();
    await wait(450);
    expect(cursors().length).toBe(1);
    AgentCursor.release();
    await wait(450);
    expect(cursors().length).toBe(0);
  });
});
