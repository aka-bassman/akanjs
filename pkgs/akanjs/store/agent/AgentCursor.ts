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
  /** How long after the last call the pointer stays before fading — one batch's gap, not one call's. */
  static readonly idleMs = 1400;

  static #el: HTMLElement | null = null;
  static #at: { x: number; y: number } | null = null;
  static #idle: ReturnType<typeof setTimeout> | null = null;

  /** Travels to the control once it has stopped moving, then presses it. */
  static press(target: HTMLElement) {
    if (typeof document === "undefined") return;
    ScreenFlash.whenStill(target, () => {
      const { top, left, width, height } = target.getBoundingClientRect();
      const travel = AgentCursor.#moveTo(left + width / 2, top + height / 2);
      // After the travel, not with it: a press that fires on departure is a click on whatever the pointer was
      // still over. A pointer that did not travel presses at once.
      if (travel) setTimeout(() => AgentCursor.#tap(), travel);
      else AgentCursor.#tap();
    });
  }

  static hide() {
    AgentCursor.#el?.classList.remove(`${AgentCursor.className}-shown`);
    AgentCursor.#at = null;
    const el = AgentCursor.#el;
    setTimeout(() => {
      if (el && !el.classList.contains(`${AgentCursor.className}-shown`)) el.remove();
      if (AgentCursor.#el === el) AgentCursor.#el = null;
    }, 400);
  }

  /** How long the move will take, so the caller knows when the pointer has arrived. */
  static #moveTo(x: number, y: number): number {
    const el = AgentCursor.#mounted();
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
