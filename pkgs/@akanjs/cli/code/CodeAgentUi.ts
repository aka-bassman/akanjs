import type { ExtensionUIContext } from "@earendil-works/pi-coding-agent";

export interface CodeAgentUiHandlers {
  ask(prompt: string, kind: "text" | "select" | "confirm", choices?: string[]): Promise<string | undefined>;
  notify(level: "info" | "warning" | "error", message: string): void;
}

/**
 * The engine's UI port, answered by the akan wire instead of by a terminal.
 *
 * Only the four dialog calls and `notify` mean anything off a TUI; the rest of the port paints widgets, footers
 * and editors that exist solely inside the engine's own interactive shell. They are no-ops here rather than
 * throws — an extension that sets a status line should not take the turn down with it.
 */
export class CodeAgentUi {
  readonly #handlers: CodeAgentUiHandlers;

  constructor(handlers: CodeAgentUiHandlers) {
    this.#handlers = handlers;
  }

  context(): ExtensionUIContext {
    const noop = () => {};
    const ui = {
      select: async (title: string, options: string[]) => await this.#handlers.ask(title, "select", options),
      confirm: async (title: string, message: string) => {
        const answer = await this.#handlers.ask(message ? `${title}: ${message}` : title, "confirm");
        return answer === "yes" || answer === "true";
      },
      input: async (title: string) => await this.#handlers.ask(title, "text"),
      notify: (message: string, type: "info" | "warning" | "error" = "info") => this.#handlers.notify(type, message),
      editor: async (title: string, prefill?: string) => (await this.#handlers.ask(title, "text")) ?? prefill,
      onTerminalInput: () => noop,
      setStatus: noop,
      setWorkingMessage: noop,
      setWorkingVisible: noop,
      setWorkingIndicator: noop,
      setHiddenThinkingLabel: noop,
      setWidget: noop,
      setFooter: noop,
      setHeader: noop,
      setTitle: noop,
      custom: async () => undefined,
      pasteToEditor: noop,
      setEditorText: noop,
      getEditorText: () => "",
      addAutocompleteProvider: noop,
      setCustomEditorComponent: noop,
    };
    return ui as unknown as ExtensionUIContext;
  }
}
