import { Box, Text, useInput } from "ink";
import { useEffect, useState } from "react";
import type { DevLogLine } from "../application/devLogBuffer";
import type { DevAppStatus } from "../application/devSupervisor";

/** One selectable row of the rail: the merged view, an app, or one source inside an app. */
export interface DevTuiRailRow {
  app: string | null;
  source: string | null;
  label: string;
  state: DevAppStatus["state"] | null;
  port: number | null;
  depth: number;
  /** The digit that jumps to this app, shown so the shortcut is visible. Only apps 1-9 have one. */
  appIndex: number | null;
}

export interface DevTuiSnapshot {
  rows: DevTuiRailRow[];
  selected: number;
  title: string;
  lines: DevLogLine[];
  above: number;
  below: number;
  following: boolean;
  /** Which field prefixes each line: the app when apps are merged, the source within one app. */
  prefix: "app" | "source" | "none";
  prefixWidth: number;
  grep: string;
  errorsOnly: boolean;
  editingGrep: boolean;
  /** A copy result, holding the footer in place of the key hints until it expires. */
  notice: string;
  /** Whether any app has a public share, which is what puts the `s` hint in the footer. */
  hasShare: boolean;
  readyCount: number;
  appCount: number;
  logRows: number;
  bodyHeight: number;
  railWidth: number;
  columns: number;
  terminalRows: number;
}

export interface DevTuiActions {
  subscribe: (listener: () => void) => () => void;
  snapshot: () => DevTuiSnapshot;
  moveSelection: (delta: number) => void;
  selectApp: (index: number) => void;
  scroll: (delta: number) => void;
  follow: () => void;
  setGrep: (grep: string) => void;
  setEditingGrep: (editing: boolean) => void;
  toggleErrorsOnly: () => void;
  clear: () => void;
  copyLines: () => void;
  copyPath: () => void;
  copyShareUrl: () => void;
  openSelected: () => void;
  restartSelected: () => void;
  quit: () => void;
}

const stateGlyph = {
  starting: { glyph: "◐", color: "yellow" },
  ready: { glyph: "●", color: "green" },
  restarting: { glyph: "◐", color: "yellow" },
  recovering: { glyph: "◐", color: "yellow" },
  suspended: { glyph: "◌", color: "blue" },
  failed: { glyph: "✗", color: "red" },
  stopped: { glyph: "○", color: "gray" },
} as const satisfies { [key in DevAppStatus["state"]]: { glyph: string; color: string } };

interface RailProps {
  rows: DevTuiRailRow[];
  selected: number;
  readyCount: number;
  appCount: number;
  width: number;
  height: number;
}

const Rail = ({ rows, selected, readyCount, appCount, width, height }: RailProps) => (
  <Box flexDirection="column" width={width} height={height} borderStyle="round" borderColor="gray" paddingX={1}>
    <Text dimColor>
      apps {readyCount}/{appCount}
    </Text>
    <Box flexDirection="column" flexGrow={1}>
      {rows.map((row, idx) => {
        const marker = row.state ? stateGlyph[row.state] : null;
        return (
          <Text key={`${row.app ?? "*"}/${row.source ?? "*"}`} inverse={idx === selected} wrap="truncate">
            {marker ? <Text color={marker.color}>{marker.glyph}</Text> : <Text dimColor>◇</Text>}
            <Text dimColor>{" ".repeat(row.depth * 2 + 1)}</Text>
            {row.appIndex === null ? null : <Text dimColor>{`${row.appIndex} `}</Text>}
            {row.label}
            {row.port === null ? null : <Text dimColor>{` ${row.port}`}</Text>}
          </Text>
        );
      })}
    </Box>
  </Box>
);

interface LogPaneProps {
  lines: DevLogLine[];
  title: string;
  above: number;
  below: number;
  following: boolean;
  prefix: "app" | "source" | "none";
  prefixWidth: number;
  width: number;
  height: number;
}

const LogPane = ({ lines, title, above, below, following, prefix, prefixWidth, width, height }: LogPaneProps) => (
  <Box
    flexDirection="column"
    width={width}
    height={height}
    borderStyle="round"
    borderColor={following ? "gray" : "cyan"}
    paddingX={1}
  >
    <Text wrap="truncate">
      {title}
      {following ? null : <Text color="cyan">{`  ▲${above} ▼${below} paused`}</Text>}
    </Text>
    {/* `flexGrow` claims the rest of the fixed-height pane, so the frame never grows with the log. */}
    <Box flexDirection="column" flexGrow={1}>
      {lines.map((line) => (
        <Text key={line.seq} wrap="truncate">
          {prefix === "none" ? null : (
            <Text dimColor>{`${(prefix === "app" ? line.app : line.source).padEnd(prefixWidth)} │ `}</Text>
          )}
          {line.text}
        </Text>
      ))}
    </Box>
  </Box>
);

export const DevTuiApp = ({ actions }: { actions: DevTuiActions }) => {
  const [snapshot, setSnapshot] = useState(actions.snapshot);

  useEffect(() => {
    const unsubscribe = actions.subscribe(() => setSnapshot(actions.snapshot()));
    // Catches anything published between this component's first render and the subscribe above.
    setSnapshot(actions.snapshot());
    return unsubscribe;
  }, [actions]);

  useInput((input, key) => {
    if (snapshot.editingGrep) {
      if (key.escape) {
        actions.setGrep("");
        actions.setEditingGrep(false);
      } else if (key.return) actions.setEditingGrep(false);
      else if (key.backspace || key.delete) actions.setGrep(snapshot.grep.slice(0, -1));
      else if (input && !key.ctrl && !key.meta) actions.setGrep(snapshot.grep + input);
      return;
    }
    const page = Math.max(1, snapshot.logRows - 1);
    if (input === "q" || (key.ctrl && input === "c")) actions.quit();
    else if (key.upArrow) actions.scroll(key.shift ? -page : -1);
    else if (key.downArrow) actions.scroll(key.shift ? page : 1);
    else if (key.pageUp) actions.scroll(-page);
    else if (key.pageDown) actions.scroll(page);
    else if (input === "G" || input === "f") actions.follow();
    else if (key.tab) actions.moveSelection(key.shift ? -1 : 1);
    else if (input === "/") actions.setEditingGrep(true);
    else if (input === "e") actions.toggleErrorsOnly();
    else if (input === "c") actions.clear();
    else if (input === "y") actions.copyLines();
    else if (input === "Y") actions.copyPath();
    else if (input === "s") actions.copyShareUrl();
    else if (input === "o") actions.openSelected();
    else if (input === "r") actions.restartSelected();
    else if (/^[1-9]$/.test(input)) actions.selectApp(Number(input) - 1);
  });

  return (
    <Box flexDirection="column" width={snapshot.columns} height={snapshot.terminalRows}>
      <Box flexDirection="row" height={snapshot.bodyHeight}>
        <Rail
          rows={snapshot.rows}
          selected={snapshot.selected}
          readyCount={snapshot.readyCount}
          appCount={snapshot.appCount}
          width={snapshot.railWidth}
          height={snapshot.bodyHeight}
        />
        <LogPane
          lines={snapshot.lines}
          title={snapshot.title}
          above={snapshot.above}
          below={snapshot.below}
          following={snapshot.following}
          prefix={snapshot.prefix}
          prefixWidth={snapshot.prefixWidth}
          width={Math.max(20, snapshot.columns - snapshot.railWidth)}
          height={snapshot.bodyHeight}
        />
      </Box>
      {snapshot.editingGrep ? (
        <Text>
          <Text color="cyan">grep </Text>
          {snapshot.grep}
          <Text inverse> </Text>
          <Text dimColor> enter to apply · esc to clear</Text>
        </Text>
      ) : snapshot.notice ? (
        <Text color="cyan" wrap="truncate">
          {snapshot.notice}
        </Text>
      ) : (
        <Text dimColor wrap="truncate">
          {/* `s share` leads because the hint line truncates well before its end on an ordinary terminal. */}
          {`${snapshot.hasShare ? "s share · " : ""}Tab next · 1-9 app · ↑↓ scroll (shift page) · G follow${snapshot.following ? "" : " (paused)"} · / grep${snapshot.grep ? ` (${snapshot.grep})` : ""} · e errors${snapshot.errorsOnly ? " on" : ""} · c clear · y copy · Y path · o open · r restart · q quit`}
        </Text>
      )}
    </Box>
  );
};
