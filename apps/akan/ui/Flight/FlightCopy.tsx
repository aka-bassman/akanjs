import { usePage } from "@apps/akan/client";
import { Copy } from "akanjs/ui";
import { BsCopy } from "react-icons/bs";
import { type FlightButtonVariants, flightButtonRecipe } from "../Recipe";
import { agentPrompt } from "../Start/start.util";

interface FlightCopyProps {
  className?: string;
  tone?: FlightButtonVariants["tone"];
  size?: FlightButtonVariants["size"];
}
export const FlightCopy = ({ className, tone = "line", size = "lg" }: FlightCopyProps) => {
  const { l } = usePage();
  return (
    <Copy
      text={l.trans(agentPrompt)}
      copyMessage={l.trans({
        en: "Prompt copied. Paste it into Claude Code or Codex.",
        ko: "프롬프트를 복사했습니다. Claude Code나 Codex에 붙여 넣으세요.",
      })}
    >
      <button type="button" className={flightButtonRecipe({ tone, size }, className)}>
        <BsCopy />
        {l.trans({ en: "Copy prompt for your agent", ko: "에이전트용 프롬프트 복사" })}
      </button>
    </Copy>
  );
};
