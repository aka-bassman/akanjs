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
    const read = async (suffix: string) => {
      const filename = `${scalarName}.${suffix}`;
      return { filename, content: await sys.readFile(`lib/__scalar/${scalarName}/${filename}`) };
    };
    return {
      abstract: await read("abstract.md"),
      constant: await read("constant.ts"),
      dictionary: await read("dictionary.ts"),
      document: await read("document.ts"),
    };
  }
}
