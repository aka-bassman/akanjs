export interface CodeTuiCommand {
  name: string;
  /** What it does, shown beside the name in the menu. */
  desc: string;
  /** Shown after the name when it takes something, so the menu doubles as the usage line. */
  arg?: string;
}

/**
 * The slash commands, and the menu that offers them.
 *
 * Kept apart from the controller because the list is also the help text and the completion source: three
 * copies of "what commands exist" is how one of them ends up stale, and the stale one is always the help.
 */
export class CodeTuiCommands {
  static readonly all: CodeTuiCommand[] = [
    { name: "help", desc: "list these commands and the keys" },
    { name: "tools", desc: "what this session can call" },
    { name: "model", desc: "switch model, or list what is available", arg: "[<provider>/<id>]" },
    { name: "effort", desc: "how hard the model thinks before it answers", arg: "<level>" },
    { name: "thinking", desc: "show the model's reasoning, or fold it away again" },
    { name: "compact", desc: "summarise the conversation to free the window", arg: "[notes]" },
    { name: "abort", desc: "stop the running turn" },
    { name: "clear", desc: "wipe the screen; the model keeps the conversation" },
    { name: "name", desc: "name this session", arg: "<text>" },
    { name: "fork", desc: "continue this conversation twice; the copy takes over here", arg: "[name]" },
    { name: "agents", desc: "what a sub-agent may be, and what one may spend" },
    { name: "mcp", desc: "the MCP servers this session reached", arg: "[add|remove|login|reload]" },
    { name: "peers", desc: "the other akan code sessions running here" },
    { name: "msg", desc: "hand a message to another session", arg: "<peer> <text>" },
    { name: "quit", desc: "leave the session" },
  ];

  /**
   * The prefix being completed, or undefined when the input is not a bare command.
   *
   * Only while the caret sits inside the first word: once a space is typed the command has been chosen and the
   * rest is its argument, so a menu there would cover the transcript for nothing.
   */
  static prefixOf(text: string, caret: number) {
    if (!text.startsWith("/")) return undefined;
    const head = text.slice(0, caret);
    if (/\s/.test(head) || head.includes("\n")) return undefined;
    return head.slice(1);
  }

  static matches(prefix: string) {
    const needle = prefix.toLowerCase();
    return CodeTuiCommands.all.filter((command) => command.name.startsWith(needle));
  }

  static help() {
    const usage = (command: CodeTuiCommand) => `/${command.name}${command.arg ? ` ${command.arg}` : ""}`;
    const column = Math.max(...CodeTuiCommands.all.map((command) => usage(command).length)) + 2;
    const list = CodeTuiCommands.all.map((command) => `${usage(command).padEnd(column)}${command.desc}`).join("\n");
    return [
      list,
      "",
      "Keys: enter send · shift+enter newline · ↑↓ move (history at the edges) · ←→ move",
      "esc interrupt · pgup/pgdn scroll · ^c quit",
      "@ completes a file in this repo · ← at the start of the prompt lists past sessions",
      "",
      // The wheel reaches an application only while mouse tracking is on, and a terminal hands a drag to
      // whoever is tracking — so the way back to a native selection has to be said, not discovered.
      "Scroll: the wheel scrolls this transcript · hold shift to select text with the mouse instead",
      "",
      // cmd+v is the terminal's own paste and the key event never reaches an application. What reaches us is
      // the paste itself — a copied file's path, or, for a screenshot, an empty one, because the clipboard
      // held no text. Both are handled; ^v skips the terminal and asks the OS directly.
      "Images: cmd+v attaches what is on the clipboard · ^v does too, without the terminal in the way",
      "",
      // Most terminals send the same byte for enter and shift+enter, so the key only reaches us where the
      // terminal can say which was pressed. VS Code needs the binding written out; iTerm2 calls it "Send Text".
      // Both spellings of that sequence are read, and the backslash a shell takes as a line continuation is
      // removed again rather than typed — see `CodeTuiApp`.
      'shift+enter needs a terminal that reports it — in VS Code bind it to send "\\\\u001b\\r".',
    ].join("\n");
  }
}
