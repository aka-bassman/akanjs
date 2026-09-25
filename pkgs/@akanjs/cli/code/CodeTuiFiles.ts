/**
 * The workspace's files, for completing an `@` mention.
 *
 * Listed once through git rather than walked: `--cached --others --exclude-standard` is the tracked files plus
 * the untracked ones git would show, minus everything `.gitignore` covers — which is the same set a person
 * means by "a file in this repo", and excludes `node_modules` and `dist` without a denylist of our own.
 *
 * The listing is async and the menu is drawn synchronously, so matching answers from whatever has landed. An
 * empty answer before the first listing is a menu that opens one frame later, not a blocked keystroke.
 */
export class CodeTuiFiles {
  static readonly limit = 8;

  readonly #root: string;
  #all: string[] = [];
  #loaded = false;

  constructor(root: string) {
    this.#root = root;
  }

  get ready() {
    return this.#loaded;
  }

  async load() {
    this.#all = await CodeTuiFiles.#list(this.#root);
    this.#loaded = true;
  }

  /**
   * Paths matching the query, shortest first.
   *
   * Shortest wins because a query is nearly always the file's own name, and the shortest match is the one
   * whose name *is* the query rather than one that merely contains it somewhere down a deep path.
   */
  match(query: string, limit = CodeTuiFiles.limit) {
    const needle = query.toLowerCase();
    if (!needle) return this.#all.slice(0, limit);
    const hits = this.#all.filter((file) => file.toLowerCase().includes(needle));
    return hits.sort((left, right) => left.length - right.length).slice(0, limit);
  }

  static async #list(root: string) {
    try {
      const proc = Bun.spawn(["git", "ls-files", "--cached", "--others", "--exclude-standard"], {
        cwd: root,
        stdout: "pipe",
        stderr: "ignore",
      });
      const text = await new Response(proc.stdout).text();
      if ((await proc.exited) !== 0) return [];
      return text.split("\n").filter((line) => !!line.trim());
    } catch {
      // No git, or no git repo: mentions then complete nothing rather than the whole disk.
      return [];
    }
  }
}
