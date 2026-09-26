// Types only: devkit's fs watcher sends these batches over IPC without pulling node:fs into the server.
export type ChangeKind = "code" | "css" | "config" | "ignore";

export interface ChangeBatch {
  files: string[];
  kinds: Set<Exclude<ChangeKind, "ignore">>;
}
