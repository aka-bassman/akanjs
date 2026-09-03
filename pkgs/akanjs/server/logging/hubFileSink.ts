import { Logger } from "akanjs/common";
import type { LogHub, LogHubEntry } from "./logHub";
import { LogStdoutWriter } from "./logStdoutWriter";
import type { RotatingLogWriter } from "./rotatingLogWriter";

export interface HubFileSinkOptions {
  minSev: number;
  /** `ndjson-only` writes the file as JSON lines too; plain `ndjson` keeps the text file a human reads. */
  json: boolean;
}

/**
 * The rotating log file fed from the hub instead of from this process's own Logger. In an ndjson deployment a
 * child writes no text line the owner could relay, so the file is written from the records that reached the
 * hub — every process in one place, keyed the way the text-mode files were.
 */
export class HubFileSink {
  #subscription: { unsubscribe(): void } | null;

  constructor(hub: LogHub, writer: RotatingLogWriter, { minSev, json }: HubFileSinkOptions) {
    this.#subscription = hub.subscribe({ minSev }, (entry) => {
      writer.write(
        HubFileSink.processKey(entry),
        json ? LogStdoutWriter.line(entry) : Logger.stripAnsi(Logger.render(entry.record)),
      );
    });
  }

  static processKey({ record }: LogHubEntry): string {
    const role = record.role ?? "app";
    if (role === "gateway" || record.replicaIdx === null) return role;
    return `${record.replicaIdx}-${role}`;
  }

  close() {
    this.#subscription?.unsubscribe();
    this.#subscription = null;
  }
}
