import { router } from "akanjs/client";
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
 * A call that lands on no control draws nothing. That still covers most of `navigate` — the router is not an
 * element, and the top-of-page bar tried for it read as chrome the page had grown rather than as the agent doing
 * something — but a destination the screen already offers as a link is an element, and that one is pressed.
 *
 * The pointer's unit is the **turn**, not the call. A model's calls arrive with its own writing between them, so
 * a pointer that lived for a call's length spent every turn disappearing and coming back; between calls it waits
 * where it last acted, as a spinner, and goes when the turn does.
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
  /**
   * The longest a call is held for the drawing that has to precede it. Every millisecond here is one the agent
   * spends on a decoration, so the press is given time to land and the call goes either way.
   */
  static readonly leadMs = 600;

  static #revealed = 0;
  static #idle: ReturnType<typeof setTimeout> | null = null;
  static #turning = false;
  static #acting = 0;

  /** The handlers `agentSessionOf` hands the session. `true` is every effect; an object turns one of them off. */
  static sink(option: boolean | AgentVisualOption = true) {
    if (option === false) return undefined;
    const settings = option === true ? {} : option;
    return {
      onActivity: (event: ToolActivity) => AgentVisual.on(event, settings),
      onTurn: (running: boolean) => AgentVisual.turn(running, settings),
    };
  }

  /**
   * The boundary the pointer lives between, and the one the scroll budget is spent in. Raising a pointer here
   * would be a pointer with nowhere to point yet, so the turn's start only resets what the last turn used.
   */
  static turn(running: boolean, { cursor = true }: AgentVisualOption = {}) {
    if (typeof document === "undefined") return;
    AgentVisual.#turning = running;
    AgentVisual.#revealed = 0;
    if (AgentVisual.#idle) clearTimeout(AgentVisual.#idle);
    AgentVisual.#idle = null;
    if (!running) AgentVisual.#acting = 0;
    if (!cursor) return;
    if (running) AgentCursor.hold();
    else AgentCursor.release();
  }

  static on(event: ToolActivity, { reveal = true, cursor = true }: AgentVisualOption = {}): void | Promise<void> {
    if (typeof document === "undefined" || document.hidden) return;
    if (!reveal && !cursor) return;
    if (event.phase === "end") {
      AgentVisual.#acting = Math.max(0, AgentVisual.#acting - 1);
      if (cursor && AgentVisual.#turning && !AgentVisual.#acting) AgentCursor.think();
      return;
    }
    AgentVisual.#acting += 1;
    const pressed = AgentVisual.#targetsOf(event).map((target) => AgentVisual.#act(target, { reveal, cursor }));
    // The one call that is waited on. A navigation replaces the tree the link is in, so a press that has not
    // landed by the time the router runs is a press on an element that is already gone — and a click the user
    // never sees is the same as no click at all. Everything else draws while the call is already running.
    if (!cursor || !pressed.length || !AgentVisual.#navigating(event.name)) return;
    return AgentVisual.#capped(Promise.all(pressed));
  }

  /** Resolves when the drawing has landed or when its budget runs out, whichever comes first. */
  static #capped(drawing: Promise<unknown>): Promise<void> {
    return new Promise((resolve) => {
      const done = () => resolve();
      setTimeout(done, AgentVisual.leadMs);
      void drawing.then(done, done);
    });
  }

  /**
   * The elements one call landed on. Normally the single control that published the tool; for the form patch it
   * is one control per field named in the arguments, since `fill<Model>Form` is published by the form rather than
   * by any one of them and ringing the form as a whole would say nothing about what changed.
   */
  static #targetsOf(event: ToolActivity): HTMLElement[] {
    if (AgentVisual.#navigating(event.name)) return AgentVisual.#linkTo(event.args.path);
    const form = AgentVisual.#formOf(event.name);
    if (!form) return AgentVisual.#only(ScreenTarget.controls(event.name), event.args);
    return Object.keys(event.args)
      .slice(0, AgentVisual.fieldCap)
      .flatMap((key) => AgentVisual.#only(ScreenTarget.controls(`${form}.${key}`)));
  }

  /**
   * One verb is registered once per row and every registration carries the same name, so several matches means the
   * agent acted somewhere the name alone cannot place. The call's own arguments break the tie when a control says
   * which one it is (`data-akan-key`, from `agentAttrs(handler, key)`) — that is how a tab's menus are told apart.
   * Short of exactly one answer nothing is drawn: ringing a guessed control is worse than ringing none.
   */
  static #only(targets: HTMLElement[], args?: Record<string, unknown>): HTMLElement[] {
    if (targets.length === 1) return targets;
    if (!targets.length || !args) return [];
    const named = new Set(
      Object.values(args)
        .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
        .map(String),
    );
    const keyed = targets.filter((target) => {
      const key = target.getAttribute("data-akan-key");
      return !!key && named.has(key);
    });
    return keyed.length === 1 ? keyed : [];
  }

  static #act(target: HTMLElement, { reveal, cursor }: Required<AgentVisualOption>): Promise<void> {
    AgentVisual.#count();
    const scrolled =
      reveal && AgentVisual.#revealed <= AgentVisual.revealCap && !ScreenFlash.inView(target)
        ? ScreenFlash.reveal(target)
        : null;
    if (cursor && scrolled) AgentCursor.scroll(scrolled);
    const pressed = cursor ? AgentCursor.press(target) : Promise.resolve();
    if (reveal) ScreenFlash.ring(target, { className: ScreenFlash.actingClass, ms: ScreenFlash.actingMs });
    return pressed;
  }

  /**
   * The link on screen that goes where a `navigate` call is going, when exactly one does and the user can already
   * see it. Off-screen links are left alone deliberately: scrolling to a link and then leaving the page it is on
   * is two motions for one act, and the destination is where the attention belongs by then.
   *
   * Addresses are compared through `router.routeOf`, which strips the locale and base-path segments an `<a>`
   * carries and a tool argument does not — `/en/docs/intro` and `/docs/intro` are the same route.
   */
  static #linkTo(path: unknown): HTMLElement[] {
    const wanted = AgentVisual.#routeOf(typeof path === "string" ? path : "");
    if (!wanted || !document.body) return [];
    const links = [...document.body.querySelectorAll<HTMLAnchorElement>("a[href]")].filter(
      (link) =>
        AgentVisual.#routeOf(link.getAttribute("href") ?? "") === wanted &&
        ScreenTarget.visible(link) &&
        ScreenFlash.inView(link),
    );
    return AgentVisual.#only(links);
  }

  static #routeOf(href: string) {
    if (!href || href.startsWith("#")) return "";
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return "";
      return router.routeOf(url.pathname);
    } catch {
      return "";
    }
  }

  static #navigating(name: string) {
    return name.slice(name.lastIndexOf(".") + 1) === "navigate";
  }

  /** `fillTaskForm` → `taskForm`, which is what the fields of that form carry in `data-akan-state`. */
  static #formOf(name: string) {
    const bare = name.slice(name.lastIndexOf(".") + 1);
    const match = /^fill([A-Z]\w*)Form$/.exec(bare);
    if (!match) return null;
    return `${match[1][0].toLowerCase()}${match[1].slice(1)}Form`;
  }

  /**
   * The turn is the batch, and `turn` resets this. The quiet-second timer stays as the fallback for a host that
   * reports no turn at all — a model's calls arrive back to back through one serialized queue, so a second of
   * quiet is the end of a batch even when nothing said so.
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
