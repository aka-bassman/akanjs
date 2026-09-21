import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * The OS clipboard's image, written where the agent can read it.
 *
 * A terminal never delivers one by paste. `ctrl+v` is handled by the terminal emulator, which puts the
 * clipboard's **text** on stdin and has no way to hand over bytes — so an image on the clipboard reaches a TUI
 * only if the TUI goes and asks the OS for it, which is what this does.
 */
export class CodeTuiClipboard {
  static readonly imageTypes = [".png", ".jpg", ".jpeg", ".gif", ".webp"] as const;

  /**
   * The images a paste carried, and whatever else was in it.
   *
   * A terminal never writes bytes to stdin. What it writes for a copied, dragged — or **screenshotted** —
   * image is that file's **path**: on macOS a clipboard screenshot also leaves a file under
   * `…/TemporaryItems/…screencaptureui…/Screenshot ….png`, and pasting hands over that path. This is the whole
   * reason `cmd+v` appears to attach an image in a terminal app; nothing ever receives the picture itself.
   *
   * The split is on a space that **starts a new absolute path**, never on every space: one screenshot's name
   * has spaces in it, and two pasted paths have a space between them.
   */
  static imagePathsIn(text: string) {
    const pieces = text.split("\n").flatMap((line) => line.split(/ (?=\/)/));
    const images: string[] = [];
    const rest: string[] = [];
    for (const piece of pieces) {
      const file = CodeTuiClipboard.imagePathIn(piece);
      if (file) images.push(file);
      else if (piece.trim()) rest.push(piece);
    }
    return { images, rest: rest.join(" ") };
  }

  static imagePathIn(text: string) {
    const file = text
      .trim()
      .replace(/^['"]|['"]$/g, "")
      .replace(/\\ /g, " ");
    if (!file || file.includes("\n")) return undefined;
    const lower = file.toLowerCase();
    if (!CodeTuiClipboard.imageTypes.some((ext) => lower.endsWith(ext))) return undefined;
    return existsSync(file) ? file : undefined;
  }

  /** The PNG on the clipboard as a file, or undefined when the clipboard holds no image. */
  static async image(): Promise<string | undefined> {
    const png = await CodeTuiClipboard.#read();
    if (!png?.length) return undefined;
    const file = path.join(tmpdir(), `akan-code-${Date.now()}.png`);
    await Bun.write(file, png);
    return file;
  }

  /** Whether there is an image to fetch, which is cheap enough to ask on a timer. */
  static has() {
    try {
      return Bun.Image.hasClipboardImage();
    } catch {
      return false;
    }
  }

  static async #read(): Promise<Uint8Array | undefined> {
    // Bun reads the OS clipboard natively, with no process to spawn and no platform branch. The shell-outs
    // below stay as the fallback for a clipboard flavour it declines.
    try {
      const image = Bun.Image.fromClipboard();
      if (image) return new Uint8Array(await image.png().toBuffer());
    } catch {
      // An unreadable or empty clipboard is not an error here; the fallbacks get their turn.
    }
    if (process.platform === "darwin") return await CodeTuiClipboard.#darwin();
    for (const command of [
      ["wl-paste", "--no-newline", "--type", "image/png"],
      ["xclip", "-selection", "clipboard", "-t", "image/png", "-o"],
    ]) {
      const bytes = await CodeTuiClipboard.#bytes(command);
      if (bytes?.length) return bytes;
    }
    return undefined;
  }

  /**
   * macOS has no binary clipboard reader in the base system, and `osascript` cannot write bytes to stdout.
   * Asking for the PNG flavour yields AppleScript's hex literal — `«data PNGf89504e…»` — which is the one
   * form the data comes out in without installing anything.
   */
  static async #darwin() {
    return CodeTuiClipboard.fromAppleScript(await CodeTuiClipboard.#text(["osascript", "-e", CodeTuiClipboard.ask]));
  }

  static readonly ask = "the clipboard as «class PNGf»";

  /** `«data PNGf89504e…»` → the bytes. Anything else on the clipboard answers with no data rather than junk. */
  static fromAppleScript(out: string | undefined) {
    const hex = /«data PNGf([0-9A-Fa-f]*)»/.exec(out ?? "")?.[1];
    if (!hex || hex.length % 2) return undefined;
    return Uint8Array.from((hex.match(/../g) ?? []).map((byte) => Number.parseInt(byte, 16)));
  }

  static async #bytes(command: string[]) {
    try {
      const proc = Bun.spawn(command, { stdout: "pipe", stderr: "ignore" });
      const bytes = new Uint8Array(await new Response(proc.stdout).arrayBuffer());
      return (await proc.exited) === 0 ? bytes : undefined;
    } catch {
      return undefined;
    }
  }

  static async #text(command: string[]) {
    const bytes = await CodeTuiClipboard.#bytes(command);
    return bytes ? new TextDecoder().decode(bytes) : undefined;
  }
}
