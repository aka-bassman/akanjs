import { usePage } from "@apps/akan/client";
import { cn } from "akanjs/client";
import { CopyPrompt } from "./CopyPrompt";
import { agentPrompt } from "./start.util";

interface PromptCardProps {
  className?: string;
}
export const PromptCard = ({ className }: PromptCardProps) => {
  const { l } = usePage();
  return (
    <div className={cn("jelly-glass rounded-3xl p-5 sm:p-6", className)}>
      <pre className="wrap-break-word whitespace-pre-wrap font-mono text-foreground/80 text-xs leading-6">
        {l.trans(agentPrompt)}
      </pre>
      <CopyPrompt className="mt-5" tone="ink" size="md" />
    </div>
  );
};
