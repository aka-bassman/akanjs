import type { ToolActivity } from "use-agentic";
import { AgentCursor } from "./AgentCursor";
import { ScreenFlash } from "./ScreenFlash";
import { ScreenTarget } from "./ScreenTarget";

export interface AgentVisualOption {
  /** Ring the control a call was published from, scrolling to it first when it is off screen. */
  reveal?: boolean;
  /** The pointer that travels to the control and presses it. */
  cursor?: boolean;
}

/**
 * What the page shows while the agent is driving it.
 *
 * The transcript already says what the agent did, and it is the wrong place to say it: the chat panel is closed
 * as often as it is open, and a form that fills itself or a tab that switches on its own is a change the user
 * watches happen with nothing anywhere attributing it. So this draws at the place the change landed, from the one
 * signal that knows a call is running — never from a store action, which cannot tell the agent's write from the
 * user's.
 *
 * Nothing here is ever waited on. A call starts the moment the event is handed over; the ring catching up a frame
 * later costs the turn nothing, and an animation that held a call would make the agent slower for a decoration.
 *
 * A call that lands on no control draws nothing, `navigate` included: the router is not an element, and the
 * top-of-page bar tried for it read as chrome the page had grown rather than as the agent doing something.
 */
export class AgentVisual {
  /**
   * Past this many calls in one turn, the reveal stops scrolling and only rings. A model that batches eight
   * writes is one screen-worth of work, and eight scrolls across the page for it is motion sickness rather than
   * attribution — the rings still say where each one landed.
   */
  static readonly revealCap = 4;
  /** How many of a form patch's fields are drawn. A patch of twenty is a form being filled, not twenty events. */
  static readonly fieldCap = 5;

  static #revealed = 0;
  static #idle: ReturnType<typeof setTimeout> | null = null;

  /** The handler `agentSessionOf` hands the session. `true` is every effect; an object turns one of them off. */
  static sink(option: boolean | AgentVisualOption = true): ((event: ToolActivity) => void) | undefined {
    if (option === false) return undefined;
    const settings = option === true ? {} : option;
    return (event) => AgentVisual.on(event, settings);
  }

  static on(event: ToolActivity, { reveal = true, cursor = true }: AgentVisualOption = {}) {
    if (typeof document === "undefined" || document.hidden) return;
    if (!reveal || event.phase !== "start") return;
    for (const target of AgentVisual.#targetsOf(event)) AgentVisual.#act(target, cursor);
  }

  /**
   * The elements one call landed on. Normally the single control that published the tool; for the form patch it
   * is one control per field named in the arguments, since `fill<Model>Form` is published by the form rather than
   * by any one of them and ringing the form as a whole would say nothing about what changed.
   */
  static #targetsOf(event: ToolActivity): HTMLElement[] {
    const form = AgentVisual.#formOf(event.name);
    if (!form) return AgentVisual.#only(ScreenTarget.controls(event.name));
    return Object.keys(event.args)
      .slice(0, AgentVisual.fieldCap)
      .flatMap((key) => AgentVisual.#only(ScreenTarget.controls(`${form}.${key}`)));
  }

  /**
   * One row's verb is registered once per row and every registration is interchangeable, so several matches means
   * the agent acted on a row nothing on screen identifies. Ringing a guessed one is worse than ringing none.
   */
  static #only(targets: HTMLElement[]): HTMLElement[] {
    return targets.length === 1 ? targets : [];
  }

  static #act(target: HTMLElement, cursor: boolean) {
    AgentVisual.#count();
    if (AgentVisual.#revealed <= AgentVisual.revealCap && !ScreenFlash.inView(target)) ScreenFlash.reveal(target);
    if (cursor) AgentCursor.press(target);
    ScreenFlash.ring(target, { className: ScreenFlash.actingClass, ms: ScreenFlash.actingMs });
  }

  /** `fillTaskForm` → `taskForm`, which is what the fields of that form carry in `data-akan-state`. */
  static #formOf(name: string) {
    const bare = name.slice(name.lastIndexOf(".") + 1);
    const match = /^fill([A-Z]\w*)Form$/.exec(bare);
    if (!match) return null;
    return `${match[1][0].toLowerCase()}${match[1].slice(1)}Form`;
  }

  /**
   * The batch is counted by the gap between calls rather than by a turn boundary, which no host reports here: a
   * model's calls arrive back to back through one serialized queue, so a quiet second is the end of the batch.
   */
  static #count() {
    AgentVisual.#revealed += 1;
    if (AgentVisual.#idle) clearTimeout(AgentVisual.#idle);
    AgentVisual.#idle = setTimeout(() => {
      AgentVisual.#revealed = 0;
      AgentVisual.#idle = null;
    }, 1000);
  }
}
