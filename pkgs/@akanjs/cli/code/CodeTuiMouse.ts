/** What the wheel reports as, and what the terminal has to be asked before it reports it at all. */
export interface CodeTuiWheel {
  /** Rows to scroll. `0` for a mouse report that is not the wheel, which is swallowed rather than typed. */
  rows: number;
  /** Whatever followed the report in the same chunk, which is ordinary typing — see {@link CodeTuiMouse.read}. */
  rest: string;
}

/**
 * The scroll wheel, turned into the transcript's own scroll.
 *
 * A terminal reports the wheel to the application only while mouse tracking is on. With it off the wheel
 * scrolls the terminal's scrollback instead, and since this host repaints one frame in place there is nothing
 * of the session up there — so the rows that slide into view are whatever the shell printed before it started.
 *
 * `1000` is the narrowest mode that carries the wheel; it carries button presses too, which cost nothing here
 * because they are dropped. `1006` asks for the SGR encoding, whose coordinates are decimal text rather than
 * single bytes biased by 32, so a click past column 223 stays readable. A terminal that does not know `1006`
 * ignores it and keeps sending the legacy form, which is why both are decoded.
 *
 * The price is the terminal's own selection: while tracking is on, a drag belongs to the application. Holding
 * shift gives it back in every terminal that implements tracking at all, which is what the hint row says.
 */
export class CodeTuiMouse {
  static readonly on = "[?1000h[?1006h";
  static readonly off = "[?1006l[?1000l";
  /** Rows per notch, which is what `less` and `vim` move and therefore what a hand already expects. */
  static readonly step = 3;

  /** Coordinate bytes of a legacy report still to come; they arrive as their own chunk — see {@link read}. */
  #pending = 0;

  /**
   * What a chunk of input means, or undefined when it is not the mouse and belongs to the keyboard.
   *
   * Ink strips the leading escape and hands a CSI sequence over whole, so a report arrives as `[<64;12;7M`.
   * The legacy form ends at its own final byte — `[M` — and its three coordinate bytes follow as the next
   * chunk, so that one is read across two calls. Its button lives in the first of the three, which is why
   * both forms come back through one decoder.
   */
  read(input: string): CodeTuiWheel | undefined {
    if (this.#pending) {
      const button = (input.codePointAt(0) ?? 32) - 32;
      const rest = input.slice(this.#pending);
      this.#pending = 0;
      return { rows: CodeTuiMouse.rowsOf(button), rest };
    }
    const sgr = /^\[<(\d+);\d+;\d+[Mm]$/.exec(input);
    if (sgr) return { rows: CodeTuiMouse.rowsOf(Number(sgr[1])), rest: "" };
    if (input !== "[M") return undefined;
    this.#pending = 3;
    return { rows: 0, rest: "" };
  }

  /**
   * Rows for one button code: `64` is the wheel, and its low two bits say which way.
   *
   * The horizontal wheel (`66` / `67`) is a button of its own rather than a modifier of the vertical one, so
   * it lands here as a code we have nothing to do with — and a trackpad's sideways drift sends a stream of
   * them. Scrolling the transcript sideways on one would be a jump nobody asked for.
   */
  static rowsOf(button: number) {
    if (!(button & 64)) return 0;
    const direction = button & 3;
    if (direction === 0) return -CodeTuiMouse.step;
    if (direction === 1) return CodeTuiMouse.step;
    return 0;
  }
}
