export type DevUiMode = "stream" | "tui";

export interface DevUiResolution {
  mode: DevUiMode;
  downgraded: boolean;
}

// Ink needs a terminal that reports a size; a pipe, a redirect or CI downgrades (and says so) rather than failing.
export const resolveDevUi = (
  plain: boolean,
  { isTty = !!process.stdout.isTTY, columns = process.stdout.columns ?? 0 }: { isTty?: boolean; columns?: number } = {},
): DevUiResolution => {
  if (plain) return { mode: "stream", downgraded: false };
  if (!isTty || columns <= 0) return { mode: "stream", downgraded: true };
  return { mode: "tui", downgraded: false };
};
