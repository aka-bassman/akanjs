import "../../test/registerDom";
import { beforeEach, describe, expect, test } from "bun:test";
import { ScreenFlash } from "./ScreenFlash";

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe("ScreenFlash", () => {
  let target: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `<button id="save">Save</button>`;
    target = document.getElementById("save") as HTMLElement;
  });

  test("reveal scrolls the element into the middle of the screen", () => {
    let seen: ScrollIntoViewOptions | undefined;
    target.scrollIntoView = (options?: boolean | ScrollIntoViewOptions) => {
      seen = options as ScrollIntoViewOptions;
    };
    ScreenFlash.reveal(target);
    expect(seen).toEqual({ block: "center", behavior: "smooth" });
  });

  test("the ring waits for the element to hold still", async () => {
    let top = 0;
    // Moving for three frames, then parked — a smooth scroll landing.
    target.getBoundingClientRect = () => {
      if (top < 300) top += 100;
      return { top } as DOMRect;
    };
    ScreenFlash.ring(target);
    await frame();
    expect(target.classList.contains(ScreenFlash.ringClass)).toBe(false);
    await frame();
    await frame();
    expect(target.classList.contains(ScreenFlash.ringClass)).toBe(false);
    await frame();
    await frame();
    expect(target.classList.contains(ScreenFlash.ringClass)).toBe(true);
  });

  test("an element that is already parked rings without a scroll to wait out", async () => {
    ScreenFlash.ring(target);
    await frame();
    await frame();
    expect(target.classList.contains(ScreenFlash.ringClass)).toBe(true);
  });

  test("a page that never holds still still flashes", async () => {
    let top = 0;
    target.getBoundingClientRect = () => {
      top += 50;
      return { top } as DOMRect;
    };
    ScreenFlash.ring(target);
    for (let i = 0; i < 95; i += 1) await frame();
    expect(target.classList.contains(ScreenFlash.ringClass)).toBe(true);
  });
});
