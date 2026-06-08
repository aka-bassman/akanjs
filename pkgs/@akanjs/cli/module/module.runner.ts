import { type Module, runner } from "@akanjs/devkit";
import { capitalize } from "akanjs/common";
import { pluralizeName } from "../pluralizeName";

export class ModuleRunner extends runner("module") {
  async createService(module: Module) {
    const serviceName = module.name.replace(/^_+/, "");
    await module.applyTemplate({
      basePath: `.`,
      template: "service",
      dict: { model: serviceName, sysName: module.sys.name },
    });

    const [abstractContent, dictionaryContent, serviceContent, signalContent, storeContent] = await Promise.all([
      module.readFile(`${serviceName}.abstract.md`),
      module.readFile(`${serviceName}.dictionary.ts`),
      module.readFile(`${serviceName}.service.ts`),
      module.readFile(`${serviceName}.signal.ts`),
      module.readFile(`${serviceName}.store.ts`),
    ]);
    return {
      abstract: { filename: `${serviceName}.abstract.md`, content: abstractContent },
      dictionary: { filename: `${serviceName}.dictionary.ts`, content: dictionaryContent },
      service: { filename: `${serviceName}.service.ts`, content: serviceContent },
      signal: { filename: `${serviceName}.signal.ts`, content: signalContent },
      store: { filename: `${serviceName}.store.ts`, content: storeContent },
    };
  }
  async removeModule(module: Module) {
    await module.sys.removeDir(`lib/${module.name}`);
  }

  async createComponentTemplate(module: Module, type: "unit" | "view" | "template" | "zone" | "util") {
    await module.sys.applyTemplate({
      basePath: `./lib/${module.name}`,
      template: `module/__Model__.${capitalize(type)}.tsx`,
      dict: { model: module.name, appName: module.sys.name },
    });
    return {
      component: {
        filename: `${module.name}.${capitalize(type)}.tsx`,
        content: await module.sys.readFile(`lib/${module.name}/${capitalize(module.name)}.${capitalize(type)}.tsx`),
      },
      // constant: {
      //   filename: `${name}.constant.ts`,
      //   content: sys.readFile(`lib/__scalar/${name}/${name}.constant.ts`),
      // },
      // dictionary: {
      //   filename: `${name}.dictionary.ts`,
      //   content: sys.readFile(`lib/__scalar/${name}/${name}.dictionary.ts`),
      // },
    };
  }

  async createModuleTemplate(module: Module) {
    const names = pluralizeName(module.name);
    await module.applyTemplate({
      basePath: `.`,
      template: "module",
      dict: { model: module.name, models: names, sysName: module.sys.name },
    });

    const [
      abstractContent,
      constantContent,
      dictionaryContent,
      serviceContent,
      storeContent,
      signalContent,
      unitContent,
      viewContent,
      templateContent,
      zoneContent,
      utilContent,
    ] = await Promise.all([
      module.readFile(`${module.name}.abstract.md`),
      module.readFile(`${module.name}.constant.ts`),
      module.readFile(`${module.name}.dictionary.ts`),
      module.readFile(`${module.name}.service.ts`),
      module.readFile(`${module.name}.store.ts`),
      module.readFile(`${module.name}.signal.ts`),
      module.readFile(`${module.name}.Unit.tsx`),
      module.readFile(`${module.name}.View.tsx`),
      module.readFile(`${module.name}.Template.tsx`),
      module.readFile(`${module.name}.Zone.tsx`),
      module.readFile(`${module.name}.Util.tsx`),
    ]);
    return {
      abstract: { filename: `${module.name}.abstract.md`, content: abstractContent },
      constant: { filename: `${module.name}.constant.ts`, content: constantContent },
      dictionary: { filename: `${module.name}.dictionary.ts`, content: dictionaryContent },
      service: { filename: `${module.name}.service.ts`, content: serviceContent },
      store: { filename: `${module.name}.store.ts`, content: storeContent },
      signal: { filename: `${module.name}.signal.ts`, content: signalContent },
      unit: { filename: `${module.name}.Unit.tsx`, content: unitContent },
      view: { filename: `${module.name}.View.tsx`, content: viewContent },
      template: { filename: `${module.name}.Template.tsx`, content: templateContent },
      zone: { filename: `${module.name}.Zone.tsx`, content: zoneContent },
      util: { filename: `${module.name}.Util.tsx`, content: utilContent },
    };
  }
}
