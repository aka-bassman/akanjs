"use client";
import { cn } from "akanjs/client";
import type { AgentPrompt } from "akanjs/store";
import type { ChatCommand } from "./ChatCommands";

interface MenuProps {
  className?: string;
  commands: ChatCommand[];
  prompts: AgentPrompt[];
  onCommand: (command: ChatCommand) => void;
  onPrompt: (prompt: AgentPrompt) => void;
}

interface RowProps {
  name: string;
  hint?: string;
  description?: string;
  onPick: () => void;
}

const Row = ({ name, hint, description, onPick }: RowProps) => (
  <button className="flex items-baseline gap-2 px-4 py-1.5 text-left hover:bg-muted" onClick={onPick} type="button">
    <span className="shrink-0 font-mono text-xs">/{name}</span>
    {hint ? <span className="shrink-0 font-mono text-[10px] text-foreground/40">{hint}</span> : null}
    {description ? <span className="ml-auto truncate text-[10px] text-foreground/50">{description}</span> : null}
  </button>
);

/** The `/` menu: this chat's own commands first, then the app's `prompt()` endpoints. */
export default function Menu({ className, commands, prompts, onCommand, onPrompt }: MenuProps) {
  if (!commands.length && !prompts.length) return null;
  return (
    <div
      className={cn(
        "scrollbar-thin flex max-h-40 flex-col overflow-y-auto border-foreground/5 border-t py-1",
        className,
      )}
    >
      {commands.map((command) => (
        <Row
          description={command.description}
          key={`command-${command.name}`}
          name={command.name}
          onPick={() => onCommand(command)}
        />
      ))}
      {prompts.map((prompt) => (
        <Row
          description={prompt.description}
          hint={prompt.args.map((arg) => `<${arg.name}>`).join(" ")}
          key={`prompt-${prompt.name}`}
          name={prompt.name}
          onPick={() => onPrompt(prompt)}
        />
      ))}
    </div>
  );
}
