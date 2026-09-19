/**
 * Puts one element in front of the user: scroll it into view, then ring it once the scroll lands.
 *
 * Apart from whoever asked for it, because the same two steps are what `highlight` performs for the model and what
 * a call being attributed to the agent performs for the user — and the ring has to go on *after* the scroll in
 * both, which is the part that is easy to lose in a second copy.
 */
export class ScreenFlash {
  /** Defined in `akanjs/ui/styles.css`, so the flash follows the app's own theme tokens. */
  static readonly ringClass = "akan-agent-highlight";
  /** Mirrors the animation in that stylesheet: the class outlives the ring by nothing. */
  static readonly ringMs = 2400;
  /**
   * The lighter ring, for a control the agent just drove rather than one the user asked to be shown. It holds for
   * about a second instead of two and a half: `highlight` is an answer the user is reading, while this one is a
   * receipt beside a change they can already see, and a batch of calls would otherwise leave five long rings up
   * at once.
   */
  static readonly actingClass = "akan-agent-acting";
  static readonly actingMs = 1000;

  static show(target: HTMLElement) {
    ScreenFlash.reveal(target);
    ScreenFlash.ring(target);
  }

  /** Answers which way the view travels, for whoever has to say that the scroll is the agent's doing. */
  static reveal(target: HTMLElement): "up" | "down" {
    const { top, height } = target.getBoundingClientRect();
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    const way = top + height / 2 < viewHeight / 2 ? "up" : "down";
    target.scrollIntoView({ block: "center", behavior: "smooth" });
    return way;
  }

  /**
   * Whether the element is far enough inside the viewport to be looked at, not merely intersecting it: a button
   * whose bottom pixel is on screen is one the user cannot read, and a ring there points at nothing.
   */
  static inView(target: HTMLElement, margin = 24) {
    const { top, bottom, left, right, height, width } = target.getBoundingClientRect();
    if (!height && !width) return false;
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewWidth = window.innerWidth || document.documentElement.clientWidth;
    return top >= margin && left >= 0 && bottom <= viewHeight - margin && right <= viewWidth;
  }

  /**
   * Whether the element is the one actually painted at its own centre, rather than merely present in the layout.
   * `checkVisibility` answers about the element alone, so a control under a modal's backdrop, inside a drawer that
   * has slid off, or faded to nothing all pass it while being invisible — and a pointer sent to one of those lands
   * on a blank patch of overlay, which reads as the effect being broken rather than as the agent acting.
   *
   * An ancestor counts as a hit: a `<label>` wrapping its input is what the point belongs to, not an occlusion.
   */
  static onTop(target: HTMLElement) {
    if (!ScreenFlash.inView(target)) return false;
    if (typeof document.elementFromPoint !== "function") return true;
    const { top, left, width, height } = target.getBoundingClientRect();
    const hit = document.elementFromPoint(left + width / 2, top + height / 2);
    return !!hit && (hit === target || target.contains(hit) || hit.contains(target));
  }

  /**
   * The ring goes on once the scroll lands, not when it starts: a smooth scroll across a long page takes most of a
   * second, and a flash begun at the top is already fading by the time the user's eye arrives. Removed on a timer
   * — a React re-render that drops the class early only ends it sooner.
   */
  static ring(target: HTMLElement, { className = ScreenFlash.ringClass, ms = ScreenFlash.ringMs } = {}) {
    ScreenFlash.whenStill(target, () => {
      target.classList.add(className);
      setTimeout(() => target.classList.remove(className), ms);
    });
  }

  /**
   * Runs `done` once the element stops moving. Settles on the element's own position rather than a scroll event,
   * which no browser fires consistently, and is capped so a page that never holds still still gets its callback.
   *
   * Shared rather than inlined into `ring`, because a cursor that has to arrive *at* a control needs the same
   * answer to the same question — where it finally is — and two copies of this loop would settle on two frames.
   */
  static whenStill(target: HTMLElement, done: () => void) {
    let last: number | null = null;
    let frames = 0;
    const settle = () => {
      const { top } = target.getBoundingClientRect();
      frames += 1;
      // The first frame has a position and nothing to compare it to. Seeded with `NaN` instead, every comparison
      // against it was `false` and the ring went on at frame one — at the moment the smooth scroll *started*.
      if ((last === null || Math.abs(top - last) >= 1) && frames < 90) {
        last = top;
        requestAnimationFrame(settle);
        return;
      }
      done();
    };
    requestAnimationFrame(settle);
  }
}
