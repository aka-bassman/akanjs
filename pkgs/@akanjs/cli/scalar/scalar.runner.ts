import { runner, type Sys } from "@akanjs/devkit/commandDecorators";
import { pluralizeName } from "../pluralizeName";

export class ScalarRunner extends runner("scalar") {
  async applyScalarTemplate(sys: Sys, scalarName: string) {
    await sys.applyTemplate({
      basePath: "./lib/__scalar",
      template: "__scalar",
      dict: { model: scalarName, models: pluralizeName(scalarName), sysName: sys.name },
      overwrite: false,
    });
    return {
      abstract: {
        filename: `${scalarName}.abstract.md`,
        content: await sys.readFile(`lib/__scalar/${scalarName}/${scalarName}.abstract.md`),
      },
      constant: {
        filename: `${scalarName}.constant.ts`,
        content: await sys.readFile(`lib/__scalar/${scalarName}/${scalarName}.constant.ts`),
      },
      dictionary: {
        filename: `${scalarName}.dictionary.ts`,
        content: await sys.readFile(`lib/__scalar/${scalarName}/${scalarName}.dictionary.ts`),
      },
      document: {
        filename: `${scalarName}.document.ts`,
        content: await sys.readFile(`lib/__scalar/${scalarName}/${scalarName}.document.ts`),
      },
    };
  }
}
