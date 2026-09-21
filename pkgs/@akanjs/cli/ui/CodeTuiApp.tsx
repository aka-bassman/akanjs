import { Box, Text, useCursor, useInput } from "ink";
import { useEffect, useRef, useState } from "react";
import type { CodeTuiLine, CodeTuiSpan } from "../code/CodeTuiLines";
import { CodeTuiMouse } from "../code/CodeTuiMouse";

export interface CodeTuiOption {
  key: string;
  label: string;
  detail?: string;
}

export interface CodeTuiSnapshot {
  /** The rules the prompt sits between, each carrying a label at either end. */
  topRule: CodeTuiSpan[];
  bottomRule: CodeTuiSpan[];
  /** Already windowed and wrapped by the controller: one entry is exactly one row. */
  lines: CodeTuiLine[];
  above: number;
  below: number;
  following: boolean;
  /**
   * A command's answer or the session list, held over the transcript until it is dismissed. Windowed by the
   * controller, which also draws the chosen row — `selectable` only says whether enter picks or closes.
   */
  overlay: { title: string; lines: CodeTuiLine[]; above: number; below: number; selectable: boolean } | null;
  status: string;
  /**
   * The sub-agent rail drawn under the prompt: this session's row, then one per child running right now.
   *
   * Already built to one line each by the controller, which counts them into the frame's height before the
   * transcript gets what is left — see `CodeTui.layout`.
   */
  subagents: CodeTuiLine[];
  mode: "input" | "select" | "confirm";
  /** The prompt buffer as the rows it draws on. */
  input: string[];
  placeholder: string;
  /** The clipboard holds a picture nothing else can offer — `cmd+v` never reaches an application. */
  offered: boolean;
  /**
   * Where the terminal cursor goes, in frame cells, so an IME draws its composing text in the right place.
   *
   * The controller works it out rather than this file: it owns the row split, and a caret placed from two
   * halves of the same arithmetic is a caret that drifts the moment one half changes.
   */
  cursor: { x: number; y: number } | null;
  prompt: string;
  options: CodeTuiOption[];
  selected: number;
  checked: string[];
  multiSelect: boolean;
  /** The slash-command menu, open only while a bare command is being typed. */
  menu: CodeTuiOption[];
  menuSelected: number;
  notice: string;
  hint: string;
  columns: number;
  /** The whole frame, which is one row short of the terminal — see `CodeTui.frameRowsOf`. */
  frameRows: number;
  bodyHeight: number;
}

export interface CodeTuiActions {
  subscribe: (listener: () => void) => () => void;
  snapshot: () => CodeTuiSnapshot;
  type: (text: string) => void;
  edit: (key: CodeTuiEditKey) => void;
  submit: () => void;
  newline: () => void;
  paste: () => void;
  pasted: (text: string) => void;
  complete: () => void;
  vertical: (delta: -1 | 1) => void;
  scroll: (delta: number) => void;
  move: (delta: number) => void;
  toggle: () => void;
  answerConfirm: (value: boolean) => void;
  cancel: () => void;
  interrupt: () => void;
}

export type CodeTuiEditKey =
  | "backspace"
  | "delete"
  | "left"
  | "right"
  | "wordLeft"
  | "wordRight"
  | "home"
  | "end"
  | "deleteWord"
  | "deleteToStart";

/** Width of the `› ` / `◐ ` marker every prompt row carries, which the caret sits after. */
export const promptMarkWidth = 2;

/**
 * What a terminal in bracketed-paste mode wraps a paste in, as Ink hands it over.
 *
 * The real bytes are `ESC[200~` and `ESC[201~`; Ink parses them as unknown escape sequences and strips the
 * leading escape before the handler sees them, so these are what to match on.
 */
const pasteOpen = "[200~";
const pasteClose = "[201~";

const Styled = ({ span }: { span: CodeTuiSpan }) => (
  <Text
    bold={span.bold}
    color={span.color}
    dimColor={span.dim}
    italic={span.italic}
    strikethrough={span.strikethrough}
    underline={span.underline}
  >
    {span.text}
  </Text>
);

const Line = ({ line }: { line: CodeTuiLine }) => (
  <Text wrap="truncate">
    {line.spans.map((span, at) => (
      <Styled key={`${line.key}:${at}`} span={span} />
    ))}
  </Text>
);

const Transcript = ({ lines, width, height }: { lines: CodeTuiLine[]; width: number; height: number }) => (
  <Box flexDirection="column" width={width} height={height} paddingX={1}>
    {lines.map((line) => (
      <Line key={line.key} line={line} />
    ))}
  </Box>
);

const Overlay = ({
  overlay,
  width,
  height,
}: {
  overlay: NonNullable<CodeTuiSnapshot["overlay"]>;
  width: number;
  height: number;
}) => (
  <Box borderDimColor borderStyle="round" flexDirection="column" height={height} paddingX={1} width={width}>
    <Text wrap="truncate">
      <Text bold color="cyan">
        {overlay.title}
      </Text>
      {overlay.above || overlay.below ? <Text dimColor>{`  ▲${overlay.above} ▼${overlay.below}`}</Text> : null}
    </Text>
    {overlay.lines.map((line) => (
      <Line key={line.key} line={line} />
    ))}
  </Box>
);

const Rule = ({ spans }: { spans: CodeTuiSpan[] }) => (
  <Text wrap="truncate">
    {spans.map((span, at) => (
      <Styled key={`${at}:${span.text}`} span={span} />
    ))}
  </Text>
);

interface MenuProps {
  options: CodeTuiOption[];
  selected: number;
  marker: boolean;
  checked?: string[];
}

const Menu = ({ options, selected, marker, checked }: MenuProps) => (
  <Box flexDirection="column">
    {options.map((option, idx) => (
      <Text key={option.key} wrap="truncate">
        <Text color={idx === selected ? "cyan" : undefined}>{idx === selected ? "❯ " : "  "}</Text>
        {checked ? <Text>{checked.includes(option.key) ? "[x] " : "[ ] "}</Text> : null}
        <Text bold={idx === selected && marker}>{option.label}</Text>
        {option.detail ? <Text dimColor>{`  ${option.detail}`}</Text> : null}
      </Text>
    ))}
  </Box>
);

export const CodeTuiApp = ({ actions }: { actions: CodeTuiActions }) => {
  const [snapshot, setSnapshot] = useState(actions.snapshot);
  const pasting = useRef<string[] | null>(null);
  const mouse = useRef(new CodeTuiMouse());
  const { setCursorPosition } = useCursor();

  useEffect(() => {
    const unsubscribe = actions.subscribe(() => setSnapshot(actions.snapshot()));
    setSnapshot(actions.snapshot());
    return unsubscribe;
  }, [actions]);

  /**
   * The real terminal cursor is parked on the caret.
   *
   * Without it the cursor stays where Ink finished drawing — the bottom of the frame — and a terminal draws an
   * IME's composing text at the cursor. Typing Korean then shows the syllable being composed at the end of the
   * whole view, jumping into the input only once it is committed.
   *
   * Set during render, not from an effect: `useCursor` only stores the value and hands it to Ink from an
   * insertion effect of the *next* render, so a position written after commit is one frame stale — the cursor
   * trails a character behind while typing, which is exactly where an IME draws.
   */
  setCursorPosition(snapshot.cursor ?? undefined);

  useInput((input, key) => {
    const page = Math.max(1, snapshot.bodyHeight - 3);
    // Everything between the two markers is text the person did not type, so it is collected here and handed
    // over in one piece: a pasted newline that reached the enter binding would send half a paste, and a
    // pasted `/` would open the command menu. An empty one is the whole point — see `CodeTui.pasted`.
    if (input === pasteOpen) {
      pasting.current = [];
      return;
    }
    if (input === pasteClose) {
      const text = pasting.current?.join("") ?? "";
      pasting.current = null;
      return actions.pasted(text);
    }
    if (pasting.current) {
      pasting.current.push(key.return ? "\n" : key.tab ? "\t" : input);
      return;
    }
    // Read after the paste buffer and before every key: a wheel report is a CSI sequence that would otherwise
    // reach the last branch of this handler and be typed into the prompt one notch at a time.
    const wheel = mouse.current.read(input);
    if (wheel) {
      if (wheel.rows) actions.scroll(wheel.rows);
      if (wheel.rest) actions.type(wheel.rest);
      return;
    }
    if (key.ctrl && input === "c") return actions.interrupt();
    if (key.pageUp) return actions.scroll(-page);
    if (key.pageDown) return actions.scroll(page);
    if (key.escape) return actions.cancel();
    // An open overlay takes the keys it uses and swallows the rest: it is a modal, and a key that typed into
    // the prompt behind it would be typing somewhere the caret is not drawn.
    if (snapshot.overlay) {
      if (key.upArrow) return actions.scroll(-1);
      if (key.downArrow) return actions.scroll(1);
      if (key.return) return snapshot.overlay.selectable ? actions.submit() : actions.cancel();
      return;
    }
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
    if (key.tab) return actions.complete();
    if (key.upArrow) return actions.vertical(-1);
    if (key.downArrow) return actions.vertical(1);
    if (key.leftArrow) return actions.edit(key.meta ? "wordLeft" : "left");
    if (key.rightArrow) return actions.edit(key.meta ? "wordRight" : "right");
    // Shift+enter is the newline key. It only arrives as itself under the kitty keyboard protocol, so the two
    // sequences a terminal sends in its place are bound too and nothing advertises them: ESC+CR, which is what
    // a VS Code or iTerm2 key binding is written as, and a bare line feed, which is byte-identical to ^j.
    if (key.return && (key.shift || key.meta)) return actions.newline();
    if (key.ctrl && input === "j") return actions.newline();
    if (key.return) return actions.submit();
    if (key.backspace || key.delete) return actions.edit(key.meta ? "deleteWord" : "backspace");
    if (key.ctrl && input === "w") return actions.edit("deleteWord");
    if (key.ctrl && input === "u") return actions.edit("deleteToStart");
    if (key.ctrl && input === "a") return actions.edit("home");
    if (key.ctrl && input === "e") return actions.edit("end");
    if (key.ctrl && input === "d") return actions.edit("delete");
    // The terminal has already pasted whatever text the clipboard held by the time this runs; what it cannot
    // deliver is an image, which is the only thing the handler goes looking for.
    if (key.ctrl && input === "v") return actions.paste();
    if (input && !key.ctrl && !key.meta) return actions.type(input);
  });

  const paneWidth = snapshot.columns;
  return (
    <Box flexDirection="column" width={paneWidth} height={snapshot.frameRows}>
      {snapshot.overlay ? (
        <Overlay height={snapshot.bodyHeight} overlay={snapshot.overlay} width={paneWidth} />
      ) : (
        <Transcript height={snapshot.bodyHeight} lines={snapshot.lines} width={paneWidth} />
      )}
      {snapshot.menu.length ? <Menu marker options={snapshot.menu} selected={snapshot.menuSelected} /> : null}
      <Rule spans={snapshot.topRule} />
      {snapshot.mode === "input" ? (
        <Box flexDirection="column">
          {snapshot.offered ? (
            <Text dimColor wrap="truncate">
              {"  ⧉ an image is on your clipboard — cmd+v or ^v attaches it"}
            </Text>
          ) : null}
          {snapshot.input.map((row, at) => (
            <Text key={`in:${at}`} wrap="truncate">
              <Text color={snapshot.status ? "yellow" : "cyan"}>
                {at === 0 ? (snapshot.status ? "◐ " : "› ") : "  "}
              </Text>
              {at === 0 && !row && snapshot.input.length === 1 ? (
                <Text dimColor>{snapshot.placeholder}</Text>
              ) : (
                <Text>{row}</Text>
              )}
            </Text>
          ))}
        </Box>
      ) : (
        <Box flexDirection="column">
          <Text color="yellow" wrap="truncate">
            {snapshot.prompt}
          </Text>
          {snapshot.options.length ? (
            <Menu
              checked={snapshot.multiSelect ? snapshot.checked : undefined}
              marker={false}
              options={snapshot.options}
              selected={snapshot.selected}
            />
          ) : null}
        </Box>
      )}
      {snapshot.subagents.length ? (
        <Box flexDirection="column">
          {snapshot.subagents.map((line) => (
            <Line key={line.key} line={line} />
          ))}
        </Box>
      ) : null}
      <Rule spans={snapshot.bottomRule} />
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
