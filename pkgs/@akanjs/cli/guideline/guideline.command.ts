import { command } from "@akanjs/devkit/commandDecorators";
import { GuidelineScript } from "./guideline.script";

export class GuidelineCommand extends command("guideline", [GuidelineScript], ({ public: target }) => ({
  guideline: target({ desc: "List or show Akan AI guideline instructions" })
    .arg("action", String, { desc: "list or show" })
    .arg("name", String, { desc: "guideline name for show", nullable: true })
    .option("format", String, {
      desc: "output format",
      default: "markdown",
      enum: ["markdown", "json"],
    })
    .exec(async function (action, name, format) {
      await this.guidelineScript.guideline(action, name, format);
    }),
})) {}
