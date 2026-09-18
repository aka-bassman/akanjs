import "../../test/registerDom";
import { beforeEach, describe, expect, test } from "bun:test";
import type { ToolActivity } from "use-agentic";
import { AgentCursor } from "./AgentCursor";
import { AgentVisual } from "./AgentVisual";
import { ScreenFlash } from "./ScreenFlash";

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const settled = async () => {
  for (let i = 0; i < 4; i += 1) await frame();
};

const start = (name: string, args: Record<string, unknown> = {}): ToolActivity => ({
  callId: "c1",
  name,
  args,
  phase: "start",
});

describe("AgentVisual", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button data-akan-action="submitTask">Save</button>
      <input data-akan-action="setTitleOnTask" data-akan-state="taskForm.title" value="Draft" />
      <button data-akan-action="removeRow">x</button>
      <button data-akan-action="removeRow">x</button>
    `;
  });

  test("rings the control a call was published from, with the acting weight rather than highlight's", async () => {
    AgentVisual.on(start("submitTask"));
    await settled();
    const target = document.querySelector('[data-akan-action="submitTask"]') as HTMLElement;
    expect(target.classList.contains(ScreenFlash.actingClass)).toBe(true);
    expect(target.classList.contains(ScreenFlash.ringClass)).toBe(false);
  });

  // A form control publishes its setter and is annotated with the same name, so a field the agent filled rings
  // without the app writing anything — the whole point of passing the setter by reference.
  test("a field the agent filled rings, found by the setter's own name", async () => {
    AgentVisual.on(start("setTitleOnTask", { value: "Ship it" }));
    await settled();
    expect(document.querySelector('[data-akan-state="taskForm.title"]')?.className).toContain(ScreenFlash.actingClass);
  });

  // `fillTaskForm` writes several fields and is published by the form rather than by any one control.
  test("a tool no single control carries draws nothing until it names its fields", async () => {
    AgentVisual.on(start("fillTaskForm", { patch: { title: "Ship it" } }));
    await settled();
    expect(document.querySelectorAll(`.${ScreenFlash.actingClass}`)).toHaveLength(0);
  });

  test("a name several rows answer to rings nothing, rather than guessing a row", async () => {
    AgentVisual.on(start("removeRow"));
    await settled();
    expect(document.querySelectorAll(`.${ScreenFlash.actingClass}`)).toHaveLength(0);
  });

  test("a name nothing on screen carries draws nothing", async () => {
    AgentVisual.on(start("refreshEverything"));
    await settled();
    expect(document.querySelectorAll(`.${ScreenFlash.actingClass}`)).toHaveLength(0);
  });

  // `navigate` drives the router, which is not an element — so it falls through and draws nothing, by the same
  // rule as any other call that lands on no control.
  test("a call that lands on no control draws nothing, navigate included", async () => {
    AgentVisual.on(start("navigate", { path: "/docs/intro" }));
    await settled();
    expect(document.querySelectorAll(`.${ScreenFlash.actingClass}`)).toHaveLength(0);
    expect(document.querySelector(`.${AgentCursor.className}`)).toBeNull();
  });

  test("each effect is turned off on its own", async () => {
    AgentVisual.on(start("submitTask"), { reveal: false });
    await settled();
    expect(document.querySelectorAll(`.${ScreenFlash.actingClass}`)).toHaveLength(0);
    AgentVisual.on(start("submitTask"), { cursor: false });
    await settled();
    expect(document.querySelector(`.${ScreenFlash.actingClass}`)).not.toBeNull();
    expect(document.querySelector(`.${AgentCursor.className}`)).toBeNull();
  });

  test("sink answers nothing at all when the host turned the whole thing off", () => {
    expect(AgentVisual.sink(false)).toBeUndefined();
    expect(typeof AgentVisual.sink(true)).toBe("function");
    expect(typeof AgentVisual.sink()).toBe("function");
  });
});

describe("AgentVisual form patches", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input data-akan-action="setTitleOnTask" data-akan-state="taskForm.title" />
      <input data-akan-action="setStatusOnTask" data-akan-state="taskForm.status" />
      <input data-akan-action="setNoteOnTask" data-akan-state="taskForm.note" />
      <input data-akan-state="otherForm.title" />
    `;
  });

  // The form publishes one tool for every field, so ringing the form would say nothing about what changed.
  test("a patch rings one control per field it named, and nothing for a field it did not", async () => {
    AgentVisual.on(start("fillTaskForm", { title: "Ship it", status: "done" }));
    await settled();
    const lit = [...document.querySelectorAll(`.${ScreenFlash.actingClass}`)].map((el) =>
      el.getAttribute("data-akan-state"),
    );
    expect(lit).toEqual(["taskForm.title", "taskForm.status"]);
  });

  test("a patch of many fields is one form being filled, not many events", async () => {
    const wide = Object.fromEntries(Array.from({ length: 12 }, (_, idx) => [`f${idx}`, idx]));
    AgentVisual.on(start("fillTaskForm", { title: "a", status: "b", note: "c", ...wide }));
    await settled();
    expect(document.querySelectorAll(`.${ScreenFlash.actingClass}`).length).toBeLessThanOrEqual(AgentVisual.fieldCap);
  });

  test("a zone's form patch names the zone's own form, never a sibling's", async () => {
    AgentVisual.on(start("wizard.fillTaskForm", { title: "Ship it" }));
    await settled();
    expect(document.querySelector('[data-akan-state="taskForm.title"]')?.className).toContain(ScreenFlash.actingClass);
    expect(document.querySelector('[data-akan-state="otherForm.title"]')?.className).not.toContain(
      ScreenFlash.actingClass,
    );
  });

  // `fillTask` is a tool an app wrote; only the generated `fill<Model>Form` fans out over state annotations.
  test("a hand-written tool whose name merely starts with fill is not a form patch", async () => {
    AgentVisual.on(start("fillTask", { title: "Ship it" }));
    await settled();
    expect(document.querySelectorAll(`.${ScreenFlash.actingClass}`)).toHaveLength(0);
  });
});

describe("AgentCursor", () => {
  beforeEach(() => {
    document.body.innerHTML = `<button data-akan-action="submitTask">Save</button>`;
    document.querySelector(`.${AgentCursor.className}`)?.remove();
  });

  test("the pointer is what the default draws, and nothing draws one before a call", async () => {
    expect(document.querySelector(`.${AgentCursor.className}`)).toBeNull();
    AgentVisual.on(start("submitTask"));
    await settled();
    expect(document.querySelector(`.${AgentCursor.className}`)).not.toBeNull();
  });

  test("the pointer travels to the control's centre and taps it", async () => {
    const target = document.querySelector('[data-akan-action="submitTask"]') as HTMLElement;
    target.getBoundingClientRect = () => ({ top: 100, left: 200, width: 80, height: 40 }) as DOMRect;
    AgentVisual.on(start("submitTask"));
    await settled();
    const cursor = document.querySelector(`.${AgentCursor.className}`) as HTMLElement;
    expect(cursor).not.toBeNull();
    expect(cursor.style.transform).toBe("translate3d(240px, 120px, 0)");
    expect(cursor.hasAttribute("data-agent-ui")).toBe(true);
    expect(cursor.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("AgentCursor travel", () => {
  const at = (el: HTMLElement, box: { top: number; left: number }) => {
    el.getBoundingClientRect = () => ({ ...box, width: 0, height: 0 }) as DOMRect;
  };
  const hop = async (from: { top: number; left: number }, to: { top: number; left: number }) => {
    const near = document.querySelector('[data-akan-action="near"]') as HTMLElement;
    const far = document.querySelector('[data-akan-action="far"]') as HTMLElement;
    at(near, from);
    at(far, to);
    AgentVisual.on(start("near"));
    await settled();
    const cursor = document.querySelector(`.${AgentCursor.className}`) as HTMLElement;
    cursor.classList.remove(`${AgentCursor.className}-tap`);
    AgentVisual.on(start("far"));
    await settled();
    return cursor;
  };
  const tapped = (cursor: HTMLElement) => cursor.classList.contains(`${AgentCursor.className}-tap`);

  beforeEach(() => {
    document.body.innerHTML = `
      <button data-akan-action="near">a</button>
      <button data-akan-action="far">b</button>
    `;
    document.querySelector(`.${AgentCursor.className}`)?.remove();
    AgentCursor.hide();
  });

  // The press is what has to wait for the arrival, so whether it waited is how a test sees the glide at all —
  // the class that disables the transition is committed and dropped inside one frame, by design.
  test("a hop shorter than a glide is worth presses at once", async () => {
    const cursor = await hop({ top: 0, left: 0 }, { top: 0, left: 40 });
    expect(cursor.style.transform).toBe("translate3d(40px, 0px, 0)");
    expect(tapped(cursor)).toBe(true);
  });

  test("a hop across the screen presses only once the pointer has arrived", async () => {
    const cursor = await hop({ top: 0, left: 0 }, { top: 0, left: 600 });
    expect(cursor.style.transform).toBe("translate3d(600px, 0px, 0)");
    expect(tapped(cursor)).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, AgentCursor.travelMs + 50));
    expect(tapped(cursor)).toBe(true);
  });
});
