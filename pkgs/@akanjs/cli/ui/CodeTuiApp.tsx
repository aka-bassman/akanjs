import { Box, Text, useInput } from "ink";
import { useEffect, useState } from "react";
import type { CodeTuiLine } from "../code/CodeTuiLines";

export interface CodeTuiOption {
  key: string;
  label: string;
  detail?: string;
}

export interface CodeTuiSnapshot {
  /** Session, model, context window, profile — the line that makes a wrong model descriptor visible. */
  header: string;
  headerDetail: string;
  /** Already windowed and wrapped by the controller: one entry is exactly one row. */
  lines: CodeTuiLine[];
  above: number;
  below: number;
  following: boolean;
  status: string;
  mode: "input" | "select" | "confirm";
  input: string;
  /** Lines of a pasted prompt above the one being edited, counted so the row can say they are there. */
  inputExtra: number;
  placeholder: string;
  prompt: string;
  options: CodeTuiOption[];
  selected: number;
  checked: string[];
  multiSelect: boolean;
  notice: string;
  hint: string;
  columns: number;
  terminalRows: number;
  bodyHeight: number;
}

export interface CodeTuiActions {
  subscribe: (listener: () => void) => () => void;
  snapshot: () => CodeTuiSnapshot;
  type: (text: string) => void;
  backspace: () => void;
  submit: () => void;
  historyPrev: () => void;
  historyNext: () => void;
  scroll: (delta: number) => void;
  move: (delta: number) => void;
  toggle: () => void;
  answerConfirm: (value: boolean) => void;
  cancel: () => void;
  interrupt: () => void;
}

interface TranscriptProps {
  lines: CodeTuiLine[];
  above: number;
  below: number;
  following: boolean;
  header: string;
  headerDetail: string;
  width: number;
  height: number;
}

const Transcript = ({ lines, above, below, following, header, headerDetail, width, height }: TranscriptProps) => (
  <Box
    flexDirection="column"
    width={width}
    height={height}
    borderStyle="round"
    borderColor={following ? "gray" : "cyan"}
    paddingX={1}
  >
    <Text wrap="truncate">
      <Text dimColor>{header}</Text>
      {headerDetail ? <Text color="cyan">{`  ${headerDetail}`}</Text> : null}
      {following ? null : <Text color="cyan">{`  ▲${above} ▼${below} paused`}</Text>}
    </Text>
    <Box flexDirection="column" flexGrow={1}>
      {lines.map((line) => (
        <Text key={line.key} wrap="truncate" color={line.color} dimColor={line.dim} bold={line.bold}>
          {line.text}
        </Text>
      ))}
    </Box>
  </Box>
);

interface AskProps {
  prompt: string;
  options: CodeTuiOption[];
  selected: number;
  checked: string[];
  multiSelect: boolean;
}

const Ask = ({ prompt, options, selected, checked, multiSelect }: AskProps) => (
  <Box flexDirection="column">
    <Text color="yellow" wrap="truncate">
      {prompt}
    </Text>
    {options.map((option, idx) => (
      <Text key={option.key} inverse={idx === selected} wrap="truncate">
        {multiSelect ? <Text>{checked.includes(option.key) ? "[x] " : "[ ] "}</Text> : null}
        {option.label}
        {option.detail ? <Text dimColor>{` — ${option.detail}`}</Text> : null}
      </Text>
    ))}
  </Box>
);

export const CodeTuiApp = ({ actions }: { actions: CodeTuiActions }) => {
  const [snapshot, setSnapshot] = useState(actions.snapshot);

  useEffect(() => {
    const unsubscribe = actions.subscribe(() => setSnapshot(actions.snapshot()));
    setSnapshot(actions.snapshot());
    return unsubscribe;
  }, [actions]);

  useInput((input, key) => {
    const page = Math.max(1, snapshot.bodyHeight - 3);
    if (key.ctrl && input === "c") return actions.interrupt();
    if (key.pageUp) return actions.scroll(-page);
    if (key.pageDown) return actions.scroll(page);
    if (key.ctrl && input === "u") return actions.scroll(-Math.ceil(page / 2));
    if (key.ctrl && input === "d") return actions.scroll(Math.ceil(page / 2));
    if (key.escape) return actions.cancel();
    if (snapshot.mode === "confirm") {
      if (input === "y" || input === "Y") return actions.answerConfirm(true);
      if (input === "n" || input === "N") return actions.answerConfirm(false);
      return;
    }
    if (snapshot.mode === "select") {
      if (key.upArrow) return actions.move(-1);
      if (key.downArrow) return actions.move(1);
      if (input === " " && snapshot.multiSelect) return actions.toggle();
      if (key.return) return actions.submit();
      return;
    }
    if (key.upArrow) return actions.historyPrev();
    if (key.downArrow) return actions.historyNext();
    if (key.return) return actions.submit();
    if (key.backspace || key.delete) return actions.backspace();
    if (input && !key.ctrl && !key.meta) return actions.type(input);
  });

  return (
    <Box flexDirection="column" width={snapshot.columns} height={snapshot.terminalRows}>
      <Transcript
        lines={snapshot.lines}
        above={snapshot.above}
        below={snapshot.below}
        following={snapshot.following}
        header={snapshot.header}
        headerDetail={snapshot.headerDetail}
        width={snapshot.columns}
        height={snapshot.bodyHeight}
      />
      {snapshot.mode === "input" ? (
        <Text wrap="truncate">
          <Text color={snapshot.status ? "yellow" : "cyan"}>{snapshot.status ? "◐ " : "› "}</Text>
          {snapshot.inputExtra ? <Text dimColor>{`+${snapshot.inputExtra} lines `}</Text> : null}
          {snapshot.input || snapshot.inputExtra ? (
            <Text>{snapshot.input}</Text>
          ) : (
            <Text dimColor>{snapshot.placeholder}</Text>
          )}
          <Text inverse> </Text>
        </Text>
      ) : (
        <Ask
          prompt={snapshot.prompt}
          options={snapshot.options}
          selected={snapshot.selected}
          checked={snapshot.checked}
          multiSelect={snapshot.multiSelect}
        />
      )}
      {snapshot.notice ? (
        <Text color="cyan" wrap="truncate">
          {snapshot.notice}
        </Text>
      ) : (
        <Text dimColor wrap="truncate">
          {snapshot.hint}
        </Text>
      )}
    </Box>
  );
};
