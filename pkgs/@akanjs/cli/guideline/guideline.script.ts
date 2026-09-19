import { script } from "@akanjs/devkit/commandDecorators";
import { Prompter } from "@akanjs/devkit/prompter";
import { Logger } from "akanjs/common";

export class GuidelineScript extends script("guideline") {
  async guideline(action: string, name: string | null = null, format: "markdown" | "json" = "markdown") {
    if (action === "list") {
      const guidelines = await Prompter.listGuidelines();
      Logger.rawLog(format === "json" ? JSON.stringify({ guidelines }, null, 2) : guidelines.join("\n"));
      return;
    }
    if (action === "show") {
      if (!name) throw new Error("Guideline name is required. Example: akan guideline show framework");
      const [instruction, guideJson] = await Promise.all([Prompter.getInstruction(name), Prompter.getGuideJson(name)]);
      Logger.rawLog(format === "json" ? JSON.stringify({ name, instruction, guideJson }, null, 2) : instruction);
      return;
    }
    throw new Error(`Unknown guideline action: ${action}. Use "list" or "show".`);
  }
}
