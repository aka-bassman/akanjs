import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export interface AkanContextFile {
  path: string;
  content: string;
}

export interface AkanContextFilesOptions {
  workspaceRoot: string;
  cwd: string;
}

/**
 * The workspace-authored rules the engine's own discovery leaves behind.
 *
 * It walks the ancestors of `cwd` and takes **one** file per directory, first match of
 * `AGENTS.override.md · AGENTS.md · AGENTS.MD · CLAUDE.md · CLAUDE.MD` — so a repo carrying both an `AGENTS.md`
 * and a `CLAUDE.md` has the second one silently dropped, and a `.cursor/rules` tree is never looked at. Both
 * are files a developer wrote expecting an agent to obey them, and an agent that reads one editor's copy and
 * not another's follows rules that disagree with the repo it is in.
 *
 * Added rather than replaced: the base list keeps its order and its precedence, and these land after it.
 */
export class AkanContextFiles {
  /** Cursor's frontmatter block, which is metadata for its own rule picker and not instruction for a model. */
  static readonly #frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

  static extend(base: AkanContextFile[], options: AkanContextFilesOptions): AkanContextFile[] {
    const seen = new Set(base.map((file) => file.path));
    // Keyed by content as well as by path, because the usual way to carry both names is to make one a symlink
    // to the other or a one-line pointer at it — and the same guide twice is the same guide twice.
    const contents = new Set(base.map((file) => file.content.trim()));
    const added: AkanContextFile[] = [];
    for (const file of [...AkanContextFiles.#claude(base), ...AkanContextFiles.#cursor(options)]) {
      if (seen.has(file.path) || contents.has(file.content.trim()) || !file.content.trim()) continue;
      seen.add(file.path);
      contents.add(file.content.trim());
      added.push(file);
    }
    return [...base, ...added];
  }

  /**
   * The `CLAUDE.md` beside an `AGENTS.md` the engine already took.
   *
   * Not beside an `AGENTS.override.md`: that name means "ignore what this directory would otherwise say", so
   * reinstating the file it was written to displace is the one case where loading both is wrong.
   */
  static #claude(base: AkanContextFile[]) {
    const files: AkanContextFile[] = [];
    for (const file of base) {
      if (!/^AGENTS\.(md|MD)$/.test(path.basename(file.path))) continue;
      for (const name of ["CLAUDE.md", "CLAUDE.MD"]) {
        const candidate = path.join(path.dirname(file.path), name);
        const content = AkanContextFiles.#read(candidate);
        if (content !== undefined) files.push({ path: candidate, content });
      }
    }
    return files;
  }

  /**
   * Cursor's always-on rules, from the workspace root and from the session's own directory.
   *
   * Only `alwaysApply: true` is taken. Cursor's other three kinds are conditional — `globs` attaches a rule to
   * the files it names, a bare `description` offers it for the model to ask for, and neither means the rule is
   * loaded manually — so putting them in a system prompt applies rules their author scoped away. A file with
   * no frontmatter at all is the `.cursorrules` shape, which was never conditional.
   */
  static #cursor(options: AkanContextFilesOptions) {
    const files: AkanContextFile[] = [];
    const roots = [...new Set([options.workspaceRoot, options.cwd])];
    for (const root of roots) {
      const legacy = AkanContextFiles.#read(path.join(root, ".cursorrules"));
      if (legacy !== undefined) files.push({ path: path.join(root, ".cursorrules"), content: legacy });
      for (const file of AkanContextFiles.#mdcFiles(path.join(root, ".cursor", "rules"))) {
        const raw = AkanContextFiles.#read(file);
        if (raw === undefined) continue;
        const body = AkanContextFiles.#applied(raw);
        if (body !== undefined) files.push({ path: file, content: body });
      }
    }
    return files;
  }

  /** The rule body when the rule applies unconditionally, and nothing when its author scoped it. */
  static #applied(raw: string) {
    const match = AkanContextFiles.#frontmatter.exec(raw);
    if (!match) return raw;
    if (!/^\s*alwaysApply\s*:\s*true\s*$/m.test(match[1] ?? "")) return undefined;
    return raw.slice(match[0].length);
  }

  /** Sorted, because the order rules reach the model in is otherwise the order a directory happens to list. */
  static #mdcFiles(dir: string) {
    if (!existsSync(dir)) return [];
    try {
      return readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".mdc"))
        .map((entry) => path.join(entry.parentPath ?? dir, entry.name))
        .sort();
    } catch {
      return [];
    }
  }

  static #read(file: string) {
    try {
      if (!existsSync(file) || !statSync(file).isFile()) return undefined;
      return readFileSync(file, "utf8").replace(/^﻿/, "");
    } catch {
      // A rule file that cannot be read costs its own rules. It must not cost the session its start.
      return undefined;
    }
  }
}
