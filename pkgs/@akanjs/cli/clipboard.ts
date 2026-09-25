/** Wayland first: `xclip` under a Wayland session writes to an X server nothing is reading. */
const clipboardCommands = (): string[][] => {
  if (process.platform === "darwin") return [["pbcopy"]];
  if (process.platform === "win32") return [["clip"]];
  return [["wl-copy"], ["xclip", "-selection", "clipboard"], ["xsel", "--clipboard", "--input"]];
};

/**
 * Writes to the OS clipboard, reporting whether it landed instead of throwing: an ssh session has no
 * clipboard at all, and the caller's answer to that is to offer a path rather than fail the keystroke.
 */
export const writeClipboard = async (text: string): Promise<boolean> => {
  for (const command of clipboardCommands()) {
    try {
      const proc = Bun.spawn(command, {
        stdin: new TextEncoder().encode(text),
        stdout: "ignore",
        stderr: "ignore",
      });
      if ((await proc.exited) === 0) return true;
    } catch {
      // Not installed on this machine; the next candidate might be.
    }
  }
  return false;
};
