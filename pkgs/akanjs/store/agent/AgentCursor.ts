import { ScreenFlash } from "./ScreenFlash";

/**
 * A pointer the agent moves, so a control being driven reads as something acting on the screen rather than as the
 * screen changing on its own.
 *
 * The ring beside it already says *where*; this says *who*. That is the whole of what it adds, which is why it is
 * opt-in: on a screen whose changes are obvious it is decoration, and on one where a form fills itself field by
 * field it is the difference between a bug and an agent.
 *
 * Built in the DOM and never rendered. It has to survive a route change and a React tree it is pointing into, it
 * must exist exactly once however many chats are mounted, and it must cost a page that never runs an agent
 * nothing at all — the element does not exist until the first call.
 */
export class AgentCursor {
  static readonly className = "akan-agent-cursor";
  /** Matches the transform transition in `akanjs/ui/styles.css`. */
  static readonly travelMs = 320;
  /** Under this far, the glide is skipped: a third of a second to cross fifty pixels reads as lag, not motion. */
  static readonly travelFrom = 200;
  /** How far off the control the pointer drifts before it starts waiting — just clear of its box. */
  static readonly driftBy = 18;
  /**
   * How long after the last call the pointer stays before fading, for a host that reports no turn boundary. A
   * host that does calls `hold` instead, because this is the wrong unit: between two calls of one turn the model
   * is writing, which takes longer than this, and the pointer used to vanish and come back for every call.
   */
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
        // A control the screen is not actually showing has no place on it to point at, so the pointer goes instead
        // of travelling to a spot the user sees nothing at.
        if (!ScreenFlash.onTop(target)) {
          AgentCursor.hide();
          resolve();
          return;
        }
        const { top, left, width, height, right, bottom } = target.getBoundingClientRect();
        AgentCursor.#pressed = { top, left, right, bottom };
        const travel = AgentCursor.#moveTo(left + width / 2, top + height / 2);
        // After the travel, not with it: a press that fires on departure is a click on whatever the pointer was
        // still over. A pointer that did not travel presses at once.
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

  /**
   * The page is being scrolled and the pointer is what is doing it. It stays put while the content moves, the way
   * a person's does — what the chevron adds is who asked, since a pointer standing still over a page that slides
   * under it otherwise reads as one that has come loose from the screen.
   */
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

  /**
   * Waiting rather than acting: the pointer drifts clear of what it just pressed and the arrow gives way to a
   * spinner. Does nothing before the first press — an agent that drives no control has no place on the screen to
   * be, and a pointer parked in a corner for a turn that only answered a question would be saying something untrue.
   */
  static think() {
    const el = AgentCursor.#el;
    if (!el?.isConnected) return;
    el.classList.remove(`${AgentCursor.className}-tap`);
    AgentCursor.#driftOff();
    el.classList.add(AgentCursor.thinkingClass);
  }

  /**
   * Off the control before the waiting starts. A person clicks and then takes the hand away to think; a spinner
   * left on the button it just pressed reads as one stuck to it, and it covers the change it caused.
   */
  static #driftOff() {
    const el = AgentCursor.#el;
    const box = AgentCursor.#pressed;
    AgentCursor.#pressed = null;
    if (!el || !box) return;
    const gap = AgentCursor.driftBy;
    // Down and to the right unless the edge is there, which is the direction a hand leaves a control in.
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

  /** How long the move will take, so the caller knows when the pointer has arrived. */
  static #stopScrolling() {
    AgentCursor.#el?.classList.remove(AgentCursor.scrollingClass, `${AgentCursor.scrollingClass}-up`);
  }

  static #moveTo(x: number, y: number): number {
    const el = AgentCursor.#mounted();
    AgentCursor.#stopScrolling();
    el.classList.remove(AgentCursor.thinkingClass);
    const at = AgentCursor.#at;
    // The first placement is a teleport: transitioning from the corner the element was created at would fly the
    // pointer across the page for no reason anybody watching could read.
    const travel = at && Math.hypot(x - at.x, y - at.y) >= AgentCursor.travelFrom ? AgentCursor.travelMs : 0;
    // The class has to be on the element *while the browser computes the new transform*, and a rAF callback runs
    // before paint — dropping it there would restore the transition first and glide anyway. The reflow is what
    // commits the untransitioned position, so the class can come straight back off.
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
