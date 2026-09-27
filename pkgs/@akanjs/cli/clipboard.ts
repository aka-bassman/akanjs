/** Wayland first: `xclip` under a Wayland session writes to an X server nothing is reading. */
const clipboardCommands = (): string[][] => {
  if (process.platform === "darwin") return [["pbcopy"]];
  if (process.platform === "win32") return [["clip"]];
  return [["wl-copy"], ["xclip", "-selection", "clipboard"], ["xsel", "--clipboard", "--input"]];
};

// Reports whether it landed instead of throwing: an ssh session has no clipboard, and callers offer a path instead.
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
