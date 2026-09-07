import type { DevLogLine } from "./devLogBuffer";

export interface DevLogWindow {
  lines: DevLogLine[];
  /** Lines hidden above the window, and below it — the latter is nonzero only while paused. */
  above: number;
  below: number;
  following: boolean;
}

/**
 * Which slice of a filtered log the pane shows.
 *
 * The scroll position is a **line seq**, not an offset from the tail. An offset would move under the
 * reader: lines keep arriving while they read, and the ring drops old ones from the front, so the same
 * offset names a different line a second later. A seq names the line itself, survives both, and makes
 * "following" simply mean there is no anchor.
 */
export const windowOf = (lines: DevLogLine[], rows: number, anchor: number | null): DevLogWindow => {
  const height = Math.max(1, Math.trunc(rows));
  const end = anchor === null ? lines.length : endOf(lines, height, anchor);
  const start = Math.max(0, end - height);
  return {
    lines: lines.slice(start, end),
    above: start,
    below: lines.length - end,
    following: anchor === null,
  };
};

/**
 * Where the anchor lands after a scroll. Negative goes toward older lines, positive toward newer, and
 * reaching the newest end drops the anchor so the pane resumes following instead of pinning to what is
 * momentarily the last line.
 */
export const scrollAnchor = (
  lines: DevLogLine[],
  rows: number,
  anchor: number | null,
  delta: number,
): number | null => {
  const height = Math.max(1, Math.trunc(rows));
  if (lines.length <= height) return null;
  const end = anchor === null ? lines.length : endOf(lines, height, anchor);
  const next = Math.min(lines.length, Math.max(height, end + Math.trunc(delta)));
  if (next >= lines.length) return null;
  return lines[next - 1]?.seq ?? null;
};

/** The anchored line's index + 1, or a full first page when the anchored line has been evicted. */
const endOf = (lines: DevLogLine[], height: number, anchor: number): number => {
  for (let idx = lines.length - 1; idx >= 0; idx -= 1) {
    const line = lines[idx];
    if (line && line.seq <= anchor) return idx + 1;
  }
  return Math.min(lines.length, height);
};
