export type DevUiMode = "stream" | "tui";

export interface DevUiResolution {
  mode: DevUiMode;
  /** Set when the TUI was wanted but cannot draw, so the caller can say so once instead of failing. */
  downgraded: boolean;
}

/**
 * How `akan start` renders. The full-screen view is the default at every app count — it is what makes a
 * dev session readable — and `--plain` is the way back to prefixed lines on stdout.
 *
 * Ink draws by repainting a frame, so it needs a terminal that reports a size. A pipe, a redirect and a
 * CI runner have none, and there the TUI is not a preference that can be honoured: it downgrades and
 * names itself rather than failing, because the request is almost always an alias or a script.
 */
export const resolveDevUi = (
  plain: boolean,
  { isTty = !!process.stdout.isTTY, columns = process.stdout.columns ?? 0 }: { isTty?: boolean; columns?: number } = {},
): DevUiResolution => {
  if (plain) return { mode: "stream", downgraded: false };
  if (!isTty || columns <= 0) return { mode: "stream", downgraded: true };
  return { mode: "tui", downgraded: false };
};
