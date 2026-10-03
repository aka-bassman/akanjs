import { usePage } from "@apps/akan/client";
import { Copy } from "akanjs/ui";
import { BsCopy } from "react-icons/bs";
import { type JellyButtonVariants, jellyButtonRecipe } from "../Recipe";
import { agentPrompt } from "./start.util";

interface CopyPromptProps {
  className?: string;
  tone?: JellyButtonVariants["tone"];
  size?: JellyButtonVariants["size"];
}
export const CopyPrompt = ({ className, tone = "glass", size = "lg" }: CopyPromptProps) => {
  const { l } = usePage();
  return (
    <Copy
      text={l.trans(agentPrompt)}
      copyMessage={l.trans({
        en: "Prompt copied. Paste it into Claude Code or Codex.",
        ko: "프롬프트를 복사했습니다. Claude Code나 Codex에 붙여 넣으세요.",
      })}
    >
      <button type="button" className={jellyButtonRecipe({ tone, size }, className)}>
        <BsCopy />
        {l.trans({ en: "Copy prompt for your agent", ko: "에이전트용 프롬프트 복사" })}
      </button>
    </Copy>
  );
};
