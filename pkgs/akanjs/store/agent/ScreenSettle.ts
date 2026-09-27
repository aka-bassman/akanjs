export interface ScreenSettleOptions {
  /** How long the DOM must hold still before the screen counts as settled. */
  quietMs?: number;
  /** How long to wait for a change that has not started yet — a navigation whose payload is still in flight. */
  appearMs?: number;
  timeoutMs?: number;
}

/** Resolves once the DOM stops mutating, always bounded; no single router or store signal says "settled". */
export class ScreenSettle {
  static wait({ quietMs = 120, appearMs = 0, timeoutMs = 3000 }: ScreenSettleOptions = {}): Promise<void> {
    const body = typeof document === "undefined" ? null : (document.body ?? document.documentElement);
    if (!body || typeof MutationObserver === "undefined") return Promise.resolve();
    return new Promise((resolve) => {
      let quiet: ReturnType<typeof setTimeout> | null = null;
      const done = () => {
        if (quiet) clearTimeout(quiet);
        clearTimeout(deadline);
        observer.disconnect();
        resolve();
      };
      const rearm = () => {
        if (quiet) clearTimeout(quiet);
        quiet = setTimeout(done, quietMs);
      };
      const observer = new MutationObserver(rearm);
      const deadline = setTimeout(done, timeoutMs);
      observer.observe(body, { attributes: true, characterData: true, childList: true, subtree: true });
      if (appearMs) quiet = setTimeout(done, appearMs);
      else rearm();
    });
  }
}
