/** Scrolls an element into view, then rings it once the scroll has landed. */
export class ScreenFlash {
  /** Defined in `akanjs/ui/styles.css`, so the flash follows the app's own theme tokens. */
  static readonly ringClass = "akan-agent-highlight";
  /** Mirrors the animation length in that stylesheet. */
  static readonly ringMs = 2400;
  /** The lighter, shorter ring for a control the agent just drove. */
  static readonly actingClass = "akan-agent-acting";
  static readonly actingMs = 1000;

  static show(target: HTMLElement) {
    ScreenFlash.reveal(target);
    ScreenFlash.ring(target);
  }

  static reveal(target: HTMLElement): "up" | "down" {
    const { top, height } = target.getBoundingClientRect();
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    const way = top + height / 2 < viewHeight / 2 ? "up" : "down";
    target.scrollIntoView({ block: "center", behavior: "smooth" });
    return way;
  }

  /** Inside the viewport with `margin` px to spare vertically, not merely intersecting it. */
  static inView(target: HTMLElement, margin = 24) {
    const { top, bottom, left, right, height, width } = target.getBoundingClientRect();
    if (!height && !width) return false;
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewWidth = window.innerWidth || document.documentElement.clientWidth;
    return top >= margin && left >= 0 && bottom <= viewHeight - margin && right <= viewWidth;
  }

  /** Painted at its own centre, not just laid out — `checkVisibility` passes a control under a modal backdrop. */
  static onTop(target: HTMLElement) {
    if (!ScreenFlash.inView(target)) return false;
    if (typeof document.elementFromPoint !== "function") return true;
    const { top, left, width, height } = target.getBoundingClientRect();
    const hit = document.elementFromPoint(left + width / 2, top + height / 2);
    return !!hit && (hit === target || target.contains(hit) || hit.contains(target));
  }

  /** Added once the element stops moving, so it is not already fading when a smooth scroll arrives. */
  static ring(target: HTMLElement, { className = ScreenFlash.ringClass, ms = ScreenFlash.ringMs } = {}) {
    ScreenFlash.whenStill(target, () => {
      target.classList.add(className);
      setTimeout(() => target.classList.remove(className), ms);
    });
  }

  /** Runs `done` once the element's position holds (no browser fires a consistent scroll end); capped at 90 frames. */
  static whenStill(target: HTMLElement, done: () => void) {
    let last: number | null = null;
    let frames = 0;
    const settle = () => {
      const { top } = target.getBoundingClientRect();
      frames += 1;
      // Seeded null, not NaN: every comparison with NaN is false, which would settle on the first frame.
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
