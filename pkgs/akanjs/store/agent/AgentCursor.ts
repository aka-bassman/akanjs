import { ScreenFlash } from "./ScreenFlash";

/** A plain DOM element, not a React one: it outlives route changes, exists once, and is created on first use. */
export class AgentCursor {
  static readonly className = "akan-agent-cursor";
  /** Matches the transform transition in `akanjs/ui/styles.css`. */
  static readonly travelMs = 320;
  /** Pixels below which the pointer jumps instead of gliding. */
  static readonly travelFrom = 200;
  /** Pixels the pointer drifts off a pressed control while it waits. */
  static readonly driftBy = 18;
  /** Fade delay after the last call, for a host that reports no turn boundary (one that does calls `hold`). */
  static readonly idleMs = 1400;
  static readonly thinkingClass = "akan-agent-cursor-thinking";
  static readonly scrollingClass = "akan-agent-cursor-scrolling";

  static #el: HTMLElement | null = null;
  static #at: { x: number; y: number } | null = null;
  static #idle: ReturnType<typeof setTimeout> | null = null;
  static #held = false;
  static #pressed: { top: number; left: number; right: number; bottom: number } | null = null;

  /** Travels to the control once it has stopped moving, then presses it. Resolves when the press has landed. */
  static press(target: HTMLElement): Promise<void> {
    if (typeof document === "undefined") return Promise.resolve();
    AgentCursor.#el?.classList.remove(AgentCursor.thinkingClass);
    return new Promise((resolve) => {
      ScreenFlash.whenStill(target, () => {
        if (!ScreenFlash.onTop(target)) {
          AgentCursor.hide();
          resolve();
          return;
        }
        const { top, left, width, height, right, bottom } = target.getBoundingClientRect();
        AgentCursor.#pressed = { top, left, right, bottom };
        const travel = AgentCursor.#moveTo(left + width / 2, top + height / 2);
        // Tap after the travel: tapping on departure reads as a click on whatever the pointer was still over.
        if (travel)
          setTimeout(() => {
            AgentCursor.#tap();
            resolve();
          }, travel);
        else {
          AgentCursor.#tap();
          resolve();
        }
      });
    });
  }

  static scroll(way: "up" | "down") {
    const el = AgentCursor.#el;
    if (!el?.isConnected) return;
    el.classList.remove(AgentCursor.thinkingClass);
    el.classList.add(AgentCursor.scrollingClass);
    el.classList.toggle(`${AgentCursor.scrollingClass}-up`, way === "up");
  }

  /** Keeps the pointer up for as long as the turn runs, instead of for `idleMs` after the last call. */
  static hold() {
    AgentCursor.#held = true;
    if (AgentCursor.#idle) clearTimeout(AgentCursor.#idle);
    AgentCursor.#idle = null;
  }

  static release() {
    AgentCursor.#held = false;
    AgentCursor.hide();
  }

  /** Drifts clear of the last pressed control and shows the waiting spinner; a no-op before the first press. */
  static think() {
    const el = AgentCursor.#el;
    if (!el?.isConnected) return;
    el.classList.remove(`${AgentCursor.className}-tap`);
    AgentCursor.#driftOff();
    el.classList.add(AgentCursor.thinkingClass);
  }

  static #driftOff() {
    const el = AgentCursor.#el;
    const box = AgentCursor.#pressed;
    AgentCursor.#pressed = null;
    if (!el || !box) return;
    const gap = AgentCursor.driftBy;
    const x = box.right + gap <= window.innerWidth - gap ? box.right + gap : box.left - gap;
    const y = box.bottom + gap <= window.innerHeight - gap ? box.bottom + gap : box.top - gap;
    const at = { x: Math.max(gap, Math.round(x)), y: Math.max(gap, Math.round(y)) };
    el.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
    AgentCursor.#at = at;
  }

  static hide() {
    AgentCursor.#pressed = null;
    AgentCursor.#stopScrolling();
    AgentCursor.#el?.classList.remove(AgentCursor.thinkingClass);
    AgentCursor.#el?.classList.remove(`${AgentCursor.className}-shown`);
    AgentCursor.#at = null;
    const el = AgentCursor.#el;
    setTimeout(() => {
      if (el && !el.classList.contains(`${AgentCursor.className}-shown`)) el.remove();
      if (AgentCursor.#el === el) AgentCursor.#el = null;
    }, 400);
  }

  static #stopScrolling() {
    AgentCursor.#el?.classList.remove(AgentCursor.scrollingClass, `${AgentCursor.scrollingClass}-up`);
  }

  static #moveTo(x: number, y: number): number {
    const el = AgentCursor.#mounted();
    AgentCursor.#stopScrolling();
    el.classList.remove(AgentCursor.thinkingClass);
    const at = AgentCursor.#at;
    // The first placement teleports: gliding from the corner the element was created at flies across the page.
    const travel = at && Math.hypot(x - at.x, y - at.y) >= AgentCursor.travelFrom ? AgentCursor.travelMs : 0;
    // The forced reflow commits the untransitioned position; dropping the class in a rAF would still glide.
    if (!travel) el.classList.add(`${AgentCursor.className}-placing`);
    el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    if (!travel) {
      void el.offsetWidth;
      el.classList.remove(`${AgentCursor.className}-placing`);
    }
    requestAnimationFrame(() => el.classList.add(`${AgentCursor.className}-shown`));
    AgentCursor.#at = { x, y };
    AgentCursor.#keep();
    return travel;
  }

  static #tap() {
    const el = AgentCursor.#el;
    if (!el) return;
    el.classList.remove(`${AgentCursor.className}-tap`);
    void el.offsetWidth;
    el.classList.add(`${AgentCursor.className}-tap`);
  }

  static #keep() {
    if (AgentCursor.#idle) clearTimeout(AgentCursor.#idle);
    AgentCursor.#idle = null;
    if (AgentCursor.#held) return;
    AgentCursor.#idle = setTimeout(() => {
      AgentCursor.#idle = null;
      AgentCursor.hide();
    }, AgentCursor.idleMs);
  }

  static #mounted(): HTMLElement {
    if (AgentCursor.#el?.isConnected) return AgentCursor.#el;
    const el = document.createElement("div");
    el.className = AgentCursor.className;
    el.setAttribute("data-agent-ui", "");
    el.setAttribute("aria-hidden", "true");
    el.append(document.createElement("i"), document.createElement("b"));
    document.body.append(el);
    AgentCursor.#el = el;
    AgentCursor.#at = null;
    return el;
  }
}
