"use client";
import { useState } from "react";
import { type ChatCommand, ChatCommands } from "./ChatCommands";
import type { MenuRow } from "./Menu";

interface SlashMenuSetup {
  draft: string;
  l: (key: string) => string;
  onCommand: (command: ChatCommand) => void;
}

const slashQuery = /^\/[A-Za-z0-9_-]*$/;

export const useSlashMenu = ({ draft, l, onCommand }: SlashMenuSetup) => {
  const [cursor, setCursor] = useState(0);
  const [hidden, setHidden] = useState(false);
  const query = !hidden && slashQuery.test(draft) ? draft : "";
  const rows: MenuRow[] = query
    ? ChatCommands.list(l)
        .filter((command) => `/${command.name}`.startsWith(query))
        .map((command) => ({
          name: command.name,
          description: command.description,
          pick: () => onCommand(command),
        }))
    : [];
  const selected = Math.min(cursor, Math.max(rows.length - 1, 0));
  return {
    rows,
    selected,
    reopen: () => {
      setHidden(false);
      setCursor(0);
    },
    hide: () => setHidden(true),
    move: (delta: number) => setCursor(Math.max(0, Math.min(selected + delta, rows.length - 1))),
    at: () => rows[selected],
  };
};
