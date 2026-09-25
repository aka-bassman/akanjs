import { clearLine, createInterface, cursorTo, type Interface } from "node:readline";
import { inspect } from "node:util";
import { evaluateAkanConsoleInput, isAkanConsoleInputComplete } from "./consoleEvaluator";
import { ConsolePasteFilter } from "./consolePasteFilter";

export interface AkanConsoleCommand {
  desc: string;
  run: (args: string, session: AkanConsoleSession) => Promise<void> | void;
}

export interface AkanConsoleSessionOptions {
  context: Record<string, unknown>;
  prompt: string;
  banner?: string;
  input?: typeof process.stdin;
  output?: typeof process.stdout;
  /** Dot-commands beyond the built-ins, keyed with their leading dot (`.tail`). */
  commands?: Record<string, AkanConsoleCommand>;
}

const commandNames = new Set([".help", ".globals", ".clear", ".exit", ".quit"]);

export class AkanConsoleSession {
  readonly #context: Record<string, unknown>;
  readonly #prompt: string;
  readonly #continuation: string;
  readonly #banner: string;
  readonly #input: typeof process.stdin;
  readonly #output: typeof process.stdout;
  readonly #filter = new ConsolePasteFilter(() => this.#onBoundary());
  readonly #commands: Record<string, AkanConsoleCommand>;
  readonly #disposers: (() => void)[] = [];
  #interface: Interface | null = null;
  #lines: string[] = [];
  #lineSeen = false;
  #closed = false;
  #chain: Promise<void> = Promise.resolve();
  #rawMode = false;

  constructor(options: AkanConsoleSessionOptions) {
    this.#context = options.context;
    this.#prompt = options.prompt;
    this.#continuation = "... ".padStart(Math.max(options.prompt.length, 4));
    this.#banner = options.banner ?? "";
    this.#input = options.input ?? process.stdin;
    this.#output = options.output ?? process.stdout;
    this.#commands = options.commands ?? {};
  }

  /** Runs when the session closes; what a command that holds a connection uses to let go of it. */
  onClose(dispose: () => void) {
    this.#disposers.push(dispose);
  }

  /** Output that arrives between keystrokes: the prompt line is cleared, the text lands, the prompt redraws. */
  write(text: string) {
    if (this.#closed || !this.#interface) {
      this.#output.write(text);
      return;
    }
    clearLine(this.#output, 0);
    cursorTo(this.#output, 0);
    this.#output.write(text);
    this.#interface.prompt(true);
  }

  async run() {
    const rl = createInterface({ input: this.#filter, output: this.#output, terminal: true });
    this.#interface = rl;
    this.#enableTerminal();
    this.#input.pipe(this.#filter);
    rl.on("line", (line) => {
      this.#lineSeen = true;
      this.#enqueue(() => this.#consume(line));
    });
    rl.on("SIGINT", () => this.#interrupt());

    if (this.#banner) this.#output.write(this.#banner);
    this.#reprompt();

    try {
      await new Promise<void>((resolve) =>
        rl.once("close", () => {
          this.#closed = true;
          // readline emits its last line right before closing, and that line is still queued at this point.
          this.#enqueue(() => this.#flush(false));
          resolve();
        }),
      );
      await this.#chain;
    } finally {
      this.#disableTerminal();
      for (const dispose of this.#disposers.splice(0)) dispose();
    }
  }

  #enqueue(task: () => Promise<void>) {
    this.#chain = this.#chain.then(task).catch((error: unknown) => this.#report(error));
  }

  // Fires after every input chunk and at the end of a paste: a whole pasted block reaches the buffer before the
  // first flush attempt, so it is evaluated as one command instead of line by line.
  #onBoundary() {
    if (!this.#lineSeen || this.#filter.isPasting || !this.#filter.endsWithNewline) return;
    this.#lineSeen = false;
    this.#enqueue(() => this.#flush(false));
  }

  async #consume(line: string) {
    const trimmed = line.trim();
    const word = trimmed.split(/\s+/, 1)[0] ?? "";
    if (!commandNames.has(trimmed) && !(word.startsWith(".") && word in this.#commands)) {
      if (!this.#lines.length && !trimmed) return;
      this.#lines.push(line);
      return;
    }
    if (trimmed === ".clear") {
      this.#lines = [];
      return;
    }
    if (this.#lines.length) await this.#flush(true);
    await this.#runCommand(trimmed);
  }

  async #flush(force: boolean) {
    const source = this.#lines.join("\n");
    if (!source.trim()) {
      this.#lines = [];
      this.#reprompt();
      return;
    }
    if (!force && !isAkanConsoleInputComplete(source)) {
      this.#promptContinuation();
      return;
    }
    this.#lines = [];
    try {
      const value = await evaluateAkanConsoleInput(source, this.#context);
      if (value !== undefined)
        this.#output.write(`${inspect(value, { colors: true, depth: 5, maxArrayLength: 100 })}\n`);
    } catch (error) {
      this.#report(error);
    }
    this.#reprompt();
  }

  async #runCommand(command: string) {
    if (command === ".exit" || command === ".quit") {
      this.#interface?.close();
      return;
    }
    if (command === ".globals") {
      this.#output.write(
        `${Object.keys(this.#context)
          .sort((a, b) => a.localeCompare(b))
          .join(", ")}\n`,
      );
      return;
    }
    if (command === ".help") {
      this.#printHelp();
      return;
    }
    const word = command.split(/\s+/, 1)[0] ?? "";
    const extension = this.#commands[word];
    if (!extension) {
      this.#printHelp();
      return;
    }
    try {
      await extension.run(command.slice(word.length).trim(), this);
    } catch (error) {
      this.#report(error);
    }
  }

  #printHelp() {
    this.#output.write(
      [
        "Akan console commands:",
        "  .help       Show this help",
        "  .globals    Show available global names",
        "  .clear      Discard the pending multi-line input",
        "  .exit       Close the console",
        ...Object.entries(this.#commands).map(([name, command]) => `  ${name.padEnd(11)} ${command.desc}`),
        "",
        "Multi-line input:",
        "  A pasted block runs as one command, and an unfinished line keeps reading at the ... prompt.",
        "  Ctrl+C discards the pending input, Ctrl+D closes the console.",
        "  const / let live for one command only, so assign without a keyword to keep a value.",
        "  End a block with `return <expr>` to print its value.",
        "",
        "Examples:",
        "  debug()",
        '  methods(service("user"))',
        '  await service("user").__count()',
        '  userService = service("user")',
        "",
      ].join("\n"),
    );
  }

  #interrupt() {
    this.#output.write("\n");
    if (!this.#lines.length) {
      this.#interface?.close();
      return;
    }
    this.#lines = [];
    this.#reprompt();
  }

  #report(error: unknown) {
    this.#output.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  }

  #reprompt() {
    if (this.#closed || !this.#interface) return;
    this.#interface.setPrompt(this.#prompt);
    this.#interface.prompt();
  }

  #promptContinuation() {
    if (this.#closed || !this.#interface) return;
    this.#interface.setPrompt(this.#continuation);
    this.#interface.prompt();
  }

  // readline puts its input in raw mode, but its input here is the paste filter rather than the tty.
  #enableTerminal() {
    if (!this.#input.isTTY) return;
    this.#input.setRawMode(true);
    this.#rawMode = true;
    this.#output.write(ConsolePasteFilter.enableSequence);
  }

  #disableTerminal() {
    this.#input.unpipe(this.#filter);
    this.#input.pause();
    if (!this.#rawMode) return;
    this.#rawMode = false;
    this.#output.write(ConsolePasteFilter.disableSequence);
    this.#input.setRawMode(false);
  }
}
