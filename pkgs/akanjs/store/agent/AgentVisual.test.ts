import "../../test/registerDom";
import { beforeEach, describe, expect, test } from "bun:test";
import type { ToolActivity } from "use-agentic";
import { AgentCursor } from "./AgentCursor";
import { AgentVisual } from "./AgentVisual";
import { ScreenFlash } from "./ScreenFlash";

// Every `router.*` access resolves through a Proxy whose getter calls `getEnv()`, and that refuses to answer
// without the three public names a build injects. Matching a link's address to a navigate argument needs it.
process.env.AKAN_PUBLIC_APP_NAME ??= "visualtest";
process.env.AKAN_PUBLIC_REPO_NAME ??= "visualtest";
process.env.AKAN_PUBLIC_SERVE_DOMAIN ??= "visualtest.local";
// A registered DOM starts on `about:blank`, which `new URL(href, base)` refuses to resolve a rooted href against.
(window as unknown as { happyDOM?: { setURL?: (url: string) => void } }).happyDOM?.setURL?.(
  "http://localhost:8282/en/docs/arch/agentic",
);

// happy-dom lays nothing out, so `elementFromPoint` cannot answer what is painted where. Hit-test against the
// boxes each test stubs instead — an element with no box is not on screen, which is what the real check says too.
document.elementFromPoint = ((x: number, y: number) =>
  // Reversed, because the real one answers with what is painted on top and later siblings paint over earlier ones.
  [...document.body.querySelectorAll<HTMLElement>("*")].reverse().find((el) => {
    const { top, left, right, bottom } = el.getBoundingClientRect();
    return right - left > 0 && bottom - top > 0 && x >= left && x <= right && y >= top && y <= bottom;
  }) ?? null) as typeof document.elementFromPoint;

/** Puts a fixture somewhere the user can see, which nothing in a headless DOM does on its own. */
const boxed = (el: Element | null, top = 100, left = 40, width = 120, height = 24) => {
  (el as HTMLElement).getBoundingClientRect = () =>
    ({ top, left, width, height, bottom: top + height, right: left + width }) as DOMRect;
  return el as HTMLElement;
};

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

const end = (name: string, args: Record<string, unknown> = {}): ToolActivity => ({
  ...start(name, args),
  phase: "end",
});

describe("AgentVisual", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button data-akan-action="submitTask">Save</button>
      <input data-akan-action="setTitleOnTask" data-akan-state="taskForm.title" value="Draft" />
      <button data-akan-action="removeRow">x</button>
      <button data-akan-action="removeRow">x</button>
    `;
    for (const [idx, el] of [...document.body.children].entries()) boxed(el, 60 + idx * 40);
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

  // A tab registers one tool for the whole strip, so its menus are told apart by the key each one carries.
  test("namesakes are told apart by the key the call named", async () => {
    document.body.innerHTML = `
      <button data-akan-action="switchTabInDocs" data-akan-key="overview">Overview</button>
      <button data-akan-action="switchTabInDocs" data-akan-key="usage">Usage</button>
    `;
    AgentVisual.on(start("switchTabInDocs", { menu: "usage" }));
    await settled();
    const lit = [...document.querySelectorAll(`.${ScreenFlash.actingClass}`)].map((el) =>
      el.getAttribute("data-akan-key"),
    );
    expect(lit).toEqual(["usage"]);
  });

  test("an argument naming none of the keys still rings nothing", async () => {
    document.body.innerHTML = `
      <button data-akan-action="switchTabInDocs" data-akan-key="overview">Overview</button>
      <button data-akan-action="switchTabInDocs" data-akan-key="usage">Usage</button>
    `;
    AgentVisual.on(start("switchTabInDocs", { menu: "nope" }));
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
    expect(document.querySelector(`.${AgentCursor.className}`)).not.toBeNull();

    document.querySelector(`.${AgentCursor.className}`)?.remove();
    AgentCursor.hide();
    AgentVisual.on(start("submitTask"), { cursor: false });
    await settled();
    expect(document.querySelector(`.${ScreenFlash.actingClass}`)).not.toBeNull();
    expect(document.querySelector(`.${AgentCursor.className}`)).toBeNull();
  });

  test("sink answers nothing at all when the host turned the whole thing off", () => {
    expect(AgentVisual.sink(false)).toBeUndefined();
    expect(typeof AgentVisual.sink(true)?.onActivity).toBe("function");
    expect(typeof AgentVisual.sink()?.onTurn).toBe("function");
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

describe("AgentVisual navigation", () => {
  const seen = (el: Element | null, box: { top: number; left: number }) => boxed(el, box.top, box.left);

  beforeEach(() => {
    document.body.innerHTML = `
      <a href="/en/docs/intro/quickstart">Quickstart</a>
      <a href="/en/docs/other">Other</a>
    `;
    AgentVisual.turn(false);
    document.querySelector(`.${AgentCursor.className}`)?.remove();
    seen(document.querySelector('a[href="/en/docs/intro/quickstart"]'), { top: 100, left: 40 });
    seen(document.querySelector('a[href="/en/docs/other"]'), { top: 200, left: 40 });
  });

  // The locale segment is on the href and never on the tool argument, so the two are compared as routes.
  test("navigate presses the link on screen that goes where it is going", async () => {
    await AgentVisual.on(start("navigate", { path: "/docs/intro/quickstart" }));
    await settled();
    expect(document.querySelector('a[href="/en/docs/intro/quickstart"]')?.className).toContain(ScreenFlash.actingClass);
    expect(document.querySelector('a[href="/en/docs/other"]')?.className).not.toContain(ScreenFlash.actingClass);
    expect(document.querySelector(`.${AgentCursor.className}`)).not.toBeNull();
  });

  test("navigate to a path no link on screen offers draws nothing, as before", async () => {
    await AgentVisual.on(start("navigate", { path: "/docs/nowhere" }));
    await settled();
    expect(document.querySelectorAll(`.${ScreenFlash.actingClass}`)).toHaveLength(0);
    expect(document.querySelector(`.${AgentCursor.className}`)).toBeNull();
  });

  test("two links to the same place press neither, rather than guessing one", async () => {
    document.body.innerHTML = `
      <a href="/en/docs/intro/quickstart">In the nav</a>
      <a href="/docs/intro/quickstart">In the body</a>
    `;
    for (const link of document.querySelectorAll("a")) seen(link, { top: 100, left: 40 });
    await AgentVisual.on(start("navigate", { path: "/docs/intro/quickstart" }));
    await settled();
    expect(document.querySelectorAll(`.${ScreenFlash.actingClass}`)).toHaveLength(0);
  });

  // Scrolling to a link and then leaving the page it is on is two motions for one act.
  test("a link the user cannot see yet is left alone", async () => {
    const link = document.querySelector('a[href="/en/docs/intro/quickstart"]');
    (link as HTMLElement).getBoundingClientRect = () => ({ top: 0, left: 0, width: 0, height: 0 }) as DOMRect;
    await AgentVisual.on(start("navigate", { path: "/docs/intro/quickstart" }));
    await settled();
    expect(document.querySelectorAll(`.${ScreenFlash.actingClass}`)).toHaveLength(0);
  });

  test("only a navigation is waited on, and never past its budget", async () => {
    expect(AgentVisual.on(start("submitTask"))).toBeUndefined();
    const began = Date.now();
    await AgentVisual.on(start("navigate", { path: "/docs/intro/quickstart" }));
    expect(Date.now() - began).toBeLessThanOrEqual(AgentVisual.leadMs + 200);
  });

  test("the pointer is not waited on when the host turned it off", async () => {
    expect(AgentVisual.on(start("navigate", { path: "/docs/intro/quickstart" }), { cursor: false })).toBeUndefined();
  });
});

describe("AgentCursor", () => {
  beforeEach(() => {
    document.body.innerHTML = `<button data-akan-action="submitTask">Save</button>`;
    boxed(document.querySelector("button"));
    AgentVisual.turn(false);
    document.querySelector(`.${AgentCursor.className}`)?.remove();
  });

  test("the pointer is what the default draws, and nothing draws one before a call", async () => {
    expect(document.querySelector(`.${AgentCursor.className}`)).toBeNull();
    AgentVisual.on(start("submitTask"));
    await settled();
    expect(document.querySelector(`.${AgentCursor.className}`)).not.toBeNull();
  });

  // The gap between two calls of one turn is a model turn long, and the pointer used to expire inside it.
  test("the pointer waits out the gap between two calls of one turn, and goes when the turn does", async () => {
    AgentVisual.turn(true);
    AgentVisual.on(start("submitTask"));
    await settled();
    AgentVisual.on(end("submitTask"));
    const cursor = document.querySelector(`.${AgentCursor.className}`) as HTMLElement;
    expect(cursor).not.toBeNull();
    expect(cursor.classList.contains(AgentCursor.thinkingClass)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, AgentCursor.idleMs + 50));
    expect(cursor.classList.contains(`${AgentCursor.className}-shown`)).toBe(true);

    AgentVisual.turn(false);
    expect(cursor.classList.contains(`${AgentCursor.className}-shown`)).toBe(false);
    expect(cursor.classList.contains(AgentCursor.thinkingClass)).toBe(false);
  });

  test("a turn that drove no control draws no pointer at all", async () => {
    AgentVisual.turn(true);
    await settled();
    expect(document.querySelector(`.${AgentCursor.className}`)).toBeNull();
    AgentVisual.turn(false);
    expect(document.querySelector(`.${AgentCursor.className}`)).toBeNull();
  });

  test("the next call takes the pointer out of waiting before it travels", async () => {
    AgentVisual.turn(true);
    AgentVisual.on(start("submitTask"));
    await settled();
    AgentVisual.on(end("submitTask"));
    const cursor = document.querySelector(`.${AgentCursor.className}`) as HTMLElement;
    expect(cursor.classList.contains(AgentCursor.thinkingClass)).toBe(true);
    AgentVisual.on(start("submitTask"));
    expect(cursor.classList.contains(AgentCursor.thinkingClass)).toBe(false);
    AgentVisual.turn(false);
  });

  test("the pointer travels to the control's centre and taps it", async () => {
    boxed(document.querySelector('[data-akan-action="submitTask"]'), 100, 200, 80, 40);
    AgentVisual.on(start("submitTask"));
    await settled();
    const cursor = document.querySelector(`.${AgentCursor.className}`) as HTMLElement;
    expect(cursor).not.toBeNull();
    expect(cursor.style.transform).toBe("translate3d(240px, 120px, 0)");
    expect(cursor.hasAttribute("data-agent-ui")).toBe(true);
    expect(cursor.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("AgentCursor out of sight", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button data-akan-action="submitTask">Save</button>
      <div data-cover>overlay</div>
    `;
    boxed(document.querySelector("button"));
    AgentVisual.turn(false);
    document.querySelector(`.${AgentCursor.className}`)?.remove();
    AgentCursor.hide();
  });

  // `checkVisibility` answers about the element alone, so a control under a backdrop passes it while being
  // invisible — and a pointer sent there lands on a blank patch of overlay.
  test("a control under something else is not pointed at", async () => {
    boxed(document.querySelector("[data-cover]"), 0, 0, 800, 600);
    AgentVisual.on(start("submitTask"));
    await settled();
    expect(document.querySelector(`.${AgentCursor.className}`)).toBeNull();
  });

  test("a control the layout has put off screen is not pointed at", async () => {
    boxed(document.querySelector("button"), 4000, 40);
    AgentVisual.on(start("submitTask"), { reveal: false });
    await settled();
    expect(document.querySelector(`.${AgentCursor.className}`)).toBeNull();
  });

  test("a pointer already on screen goes when the next call lands somewhere hidden", async () => {
    AgentVisual.turn(true);
    AgentVisual.on(start("submitTask"));
    await settled();
    const cursor = document.querySelector(`.${AgentCursor.className}`) as HTMLElement;
    expect(cursor.classList.contains(`${AgentCursor.className}-shown`)).toBe(true);
    boxed(document.querySelector("[data-cover]"), 0, 0, 800, 600);
    AgentVisual.on(start("submitTask"));
    await settled();
    expect(cursor.classList.contains(`${AgentCursor.className}-shown`)).toBe(false);
    AgentVisual.turn(false);
  });
});

describe("AgentCursor waiting", () => {
  beforeEach(() => {
    document.body.innerHTML = `<button data-akan-action="submitTask">Save</button>`;
    boxed(document.querySelector("button"), 100, 200, 80, 40);
    AgentVisual.turn(false);
    document.querySelector(`.${AgentCursor.className}`)?.remove();
    AgentCursor.hide();
  });

  // A person clicks and takes the hand away; a spinner left on the button covers the change it just caused.
  test("the pointer drifts clear of what it pressed before it starts waiting", async () => {
    AgentVisual.turn(true);
    AgentVisual.on(start("submitTask"));
    await settled();
    const cursor = document.querySelector(`.${AgentCursor.className}`) as HTMLElement;
    expect(cursor.style.transform).toBe("translate3d(240px, 120px, 0)");

    AgentVisual.on(end("submitTask"));
    // Clear of the box (200..280 x 100..140) by `driftBy`, down and to the right.
    expect(cursor.style.transform).toBe("translate3d(298px, 158px, 0)");
    expect(cursor.classList.contains(AgentCursor.thinkingClass)).toBe(true);
    AgentVisual.turn(false);
  });

  test("the drift stays on screen when the control sits against the edge", async () => {
    boxed(document.querySelector("button"), 100, window.innerWidth - 60, 60, 40);
    AgentVisual.turn(true);
    AgentVisual.on(start("submitTask"));
    await settled();
    AgentVisual.on(end("submitTask"));
    const cursor = document.querySelector(`.${AgentCursor.className}`) as HTMLElement;
    const x = Number(/translate3d\((-?\d+)px/.exec(cursor.style.transform)?.[1]);
    expect(x).toBeLessThan(window.innerWidth - 60);
    AgentVisual.turn(false);
  });
});

describe("AgentCursor scrolling", () => {
  const box = (name: string, top: number) => boxed(document.querySelector(`[data-akan-action="${name}"]`), top);
  const scrolling = () => {
    const el = document.querySelector(`.${AgentCursor.className}`);
    if (!el) return "none";
    if (!el.classList.contains(AgentCursor.scrollingClass)) return "still";
    return el.classList.contains(`${AgentCursor.scrollingClass}-up`) ? "up" : "down";
  };
  // The pointer has to already be somewhere for the scroll to be attributed to it, which is the case that
  // motivated this: a pointer left over from the previous call, holding still while the page slides under it.
  const afterFirstCall = async () => {
    box("here", 100);
    AgentVisual.on(start("here"));
    await settled();
  };

  beforeEach(() => {
    document.body.innerHTML = `
      <button data-akan-action="here">a</button>
      <button data-akan-action="below">b</button>
      <button data-akan-action="above">c</button>
    `;
    AgentVisual.turn(false);
    document.querySelector(`.${AgentCursor.className}`)?.remove();
    AgentCursor.hide();
  });

  test("a reveal that scrolls down says so on the pointer, and stops saying it on arrival", async () => {
    await afterFirstCall();
    box("below", 2000);
    AgentVisual.on(start("below"));
    expect(scrolling()).toBe("down");
    box("below", 400);
    await settled();
    expect(scrolling()).toBe("still");
  });

  test("a reveal that scrolls up points the other way", async () => {
    await afterFirstCall();
    box("above", -800);
    AgentVisual.on(start("above"));
    expect(scrolling()).toBe("up");
  });

  test("a target already on screen is not a scroll", async () => {
    await afterFirstCall();
    box("below", 300);
    AgentVisual.on(start("below"));
    expect(scrolling()).toBe("still");
  });

  // Nothing to attribute the scroll to yet, so nothing claims it.
  test("the first call of all scrolls with no pointer to say so", async () => {
    box("below", 2000);
    AgentVisual.on(start("below"));
    expect(scrolling()).toBe("none");
  });
});

describe("AgentCursor travel", () => {
  // Centred on the given point, and inside the viewport: a control the user cannot see is one the pointer skips.
  const at = (el: HTMLElement, box: { top: number; left: number }) => boxed(el, box.top - 10, box.left - 10, 20, 20);
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
    AgentVisual.turn(false);
    document.querySelector(`.${AgentCursor.className}`)?.remove();
    AgentCursor.hide();
  });

  // The press is what has to wait for the arrival, so whether it waited is how a test sees the glide at all —
  // the class that disables the transition is committed and dropped inside one frame, by design.
  test("a hop shorter than a glide is worth presses at once", async () => {
    const cursor = await hop({ top: 100, left: 100 }, { top: 100, left: 140 });
    expect(cursor.style.transform).toBe("translate3d(140px, 100px, 0)");
    expect(tapped(cursor)).toBe(true);
  });

  test("a hop across the screen presses only once the pointer has arrived", async () => {
    const cursor = await hop({ top: 100, left: 100 }, { top: 100, left: 700 });
    expect(cursor.style.transform).toBe("translate3d(700px, 100px, 0)");
    expect(tapped(cursor)).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, AgentCursor.travelMs + 50));
    expect(tapped(cursor)).toBe(true);
  });
});
