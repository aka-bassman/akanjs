import type { LogHub, LogHubEntry } from "./logHub";

export interface LogStdoutWriterOptions {
  minSev: number;
  write?: (line: string) => void;
}

/**
 * The container's stdout in an ndjson deployment: one JSON record per line for everything the hub sees at or
 * above the stdout level, from this process and every one it fronts. It is the only writer — `Logger.consoleOutput`
 * is off in every server process — so a collector's parser is `json` and nothing else.
 */
export class LogStdoutWriter {
  readonly #write: (line: string) => void;
  #subscription: { unsubscribe(): void } | null;

  constructor(hub: LogHub, { minSev, write }: LogStdoutWriterOptions) {
    this.#write =
      write ??
      ((line) => {
        process.stdout.write(line);
      });
    this.#subscription = hub.subscribe({ minSev }, (entry) => this.#write(LogStdoutWriter.line(entry)));
  }

  /** `seq` rides along: `at` comes from several clocks, so it is what orders records from different processes. */
  static json(entry: LogHubEntry) {
    return { seq: entry.seq, ...entry.record };
  }

  static line(entry: LogHubEntry): string {
    return `${JSON.stringify(LogStdoutWriter.json(entry))}\n`;
  }

  close() {
    this.#subscription?.unsubscribe();
    this.#subscription = null;
  }
}
