import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export interface CodeSessionEntry {
  id: string;
  file: string;
  /** What the session calls itself, when it was named. */
  name: string | undefined;
  /** The first thing the person asked, which is what a list of sessions is actually scanned for. */
  opening: string;
  updatedAt: number;
  turns: number;
}

/**
 * The sessions on disk, read as files rather than through the engine.
 *
 * The engine's session manager addresses one session at a time — it can open a file and append to it, and has
 * nothing that enumerates the directory. The format is self-describing JSONL, so the listing is a read of
 * lines we already own the shape of, and it costs no engine instance to produce.
 */
export class CodeSessionIndex {
  /** Past this, a file is a session long enough that its opening lines are far from the interesting part. */
  static readonly readLimit = 512 * 1024;

  static list(dir: string, limit = 30): CodeSessionEntry[] {
    if (!existsSync(dir)) return [];
    const files = readdirSync(dir)
      .filter((entry) => entry.endsWith(".jsonl"))
      .map((entry) => path.join(dir, entry))
      .map((file) => ({ file, updatedAt: CodeSessionIndex.#mtime(file) }))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, limit);
    return files
      .map((entry) => CodeSessionIndex.#read(entry.file, entry.updatedAt))
      .filter((entry): entry is CodeSessionEntry => !!entry);
  }

  static fileOf(dir: string, id: string) {
    if (!existsSync(dir)) return undefined;
    // The file name carries the id after its timestamp, so the directory is searched without reading anything.
    const match = readdirSync(dir).find((entry) => entry.endsWith(`${id}.jsonl`) || entry === `${id}.jsonl`);
    return match ? path.join(dir, match) : undefined;
  }

  static #mtime(file: string) {
    try {
      return statSync(file).mtimeMs;
    } catch {
      return 0;
    }
  }

  static #read(file: string, updatedAt: number): CodeSessionEntry | undefined {
    const lines = CodeSessionIndex.#lines(file);
    if (!lines.length) return undefined;
    const entry: CodeSessionEntry = { id: "", file, name: undefined, opening: "", updatedAt, turns: 0 };
    for (const line of lines) {
      const record = CodeSessionIndex.#parse(line);
      if (!record) continue;
      if (record.type === "session" && typeof record.id === "string") entry.id = record.id;
      // A rename appends a second entry rather than editing the first, so the last one on the file wins.
      if (record.type === "session_info" && typeof record.name === "string") entry.name = record.name;
      if (record.type !== "message") continue;
      const message = record.message as { role?: string; content?: unknown } | undefined;
      if (message?.role !== "user") continue;
      entry.turns += 1;
      if (!entry.opening) entry.opening = CodeSessionIndex.#text(message.content);
    }
    return entry.id ? entry : undefined;
  }

  static #lines(file: string) {
    try {
      if (statSync(file).size > CodeSessionIndex.readLimit) return [];
      return readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => !!line.trim());
    } catch {
      return [];
    }
  }

  static #parse(line: string): { [key: string]: unknown; type?: string } | undefined {
    try {
      return JSON.parse(line) as { type?: string };
    } catch {
      return undefined;
    }
  }

  /** One line, always: the opening ask is a label in a list, and a pasted stack trace is not a label. */
  static #text(content: unknown) {
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content
              .map((part) => (typeof part === "object" && part && "text" in part ? String(part.text) : ""))
              .join(" ")
          : "";
    return text.replace(/\s+/g, " ").trim();
  }
}
