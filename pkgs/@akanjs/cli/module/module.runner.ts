import { type Module, runner } from "@akanjs/devkit/commandDecorators";
import { bilingualDescriptionForField, bilingualLabelForField, moduleSourcePaths } from "@akanjs/devkit/workflow";
import { capitalize } from "akanjs/common";
import { pluralizeName } from "../pluralizeName";

const purposeByModule: Record<string, string> = {
  budget: "Budget represents planned or actual money allocated inside the app.",
  project: "Project represents a project workspace or business initiative managed by the app.",
  task: "Task represents work items that move through the app workflow.",
};

const moduleAbstractContent = (moduleName: string, sharedGuards: boolean) => {
  const title = capitalize(moduleName);
  const noun = bilingualLabelForField(moduleName).en.toLowerCase();
  const purpose = purposeByModule[moduleName] ?? `${title} represents ${noun} records managed by the app.`;
  const writeRule = sharedGuards
    ? `Anyone may read a ${noun}; only an admin creates, updates or removes one.`
    : `Anyone may read a ${noun}; nobody creates, updates or removes one until the slice names a guard.`;
  return `# ${moduleName} Abstract
${purpose}

## Rules
- ${writeRule}
- Removal is soft: a removed ${noun} keeps its row with \`removedAt\` set.
`;
};

const localModuleFilename = (moduleName: string, pathKey: keyof ReturnType<typeof moduleSourcePaths>) =>
  moduleSourcePaths(moduleName)[pathKey].replace(`lib/${moduleName}/`, "");

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
  async #hasSharedGuards(module: Module) {
    const { sys } = module;
    if (sys.type === "lib" && sys.name === "shared") return true;
    if (!(await sys.exists("lib/srv.ts"))) return false;
    return (await sys.readFile("lib/srv.ts")).includes('"@libs/shared/lib/srv"');
  }

  async createComponentTemplate(module: Module, type: "unit" | "view" | "template" | "zone" | "util") {
    await module.sys.applyTemplate({
      basePath: `./lib/${module.name}`,
      template: `module/__Model__.${capitalize(type)}.tsx`,
      dict: { model: module.name, sysName: module.sys.name, sysType: module.sys.type },
    });
    return {
      component: {
        filename: `${capitalize(module.name)}.${capitalize(type)}.tsx`,
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
    const modelLabel = bilingualLabelForField(module.name);
    const modelDescription = bilingualDescriptionForField(module.name);
    const filenames = {
      abstract: localModuleFilename(module.name, "abstract"),
      constant: localModuleFilename(module.name, "constant"),
      dictionary: localModuleFilename(module.name, "dictionary"),
      service: localModuleFilename(module.name, "service"),
      store: localModuleFilename(module.name, "store"),
      signal: localModuleFilename(module.name, "signal"),
      unit: localModuleFilename(module.name, "unit"),
      view: localModuleFilename(module.name, "view"),
      template: localModuleFilename(module.name, "template"),
      zone: localModuleFilename(module.name, "zone"),
      util: localModuleFilename(module.name, "util"),
    };
    const sharedGuards = await this.#hasSharedGuards(module);
    await module.applyTemplate({
      basePath: `.`,
      template: "module",
      options: { sharedGuards },
      dict: {
        model: module.name,
        models: names,
        sysName: module.sys.name,
        sysType: module.sys.type,
        modelLabelEn: modelLabel.en,
        modelLabelKo: modelLabel.ko,
        modelDescEn: modelDescription.en,
        modelDescKo: modelDescription.ko,
      },
    });
    await module.writeFile(filenames.abstract, moduleAbstractContent(module.name, sharedGuards));

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
      module.readFile(filenames.abstract),
      module.readFile(filenames.constant),
      module.readFile(filenames.dictionary),
      module.readFile(filenames.service),
      module.readFile(filenames.store),
      module.readFile(filenames.signal),
      module.readFile(filenames.unit),
      module.readFile(filenames.view),
      module.readFile(filenames.template),
      module.readFile(filenames.zone),
      module.readFile(filenames.util),
    ]);
    return {
      abstract: { filename: filenames.abstract, content: abstractContent },
      constant: { filename: filenames.constant, content: constantContent },
      dictionary: { filename: filenames.dictionary, content: dictionaryContent },
      service: { filename: filenames.service, content: serviceContent },
      store: { filename: filenames.store, content: storeContent },
      signal: { filename: filenames.signal, content: signalContent },
      unit: { filename: filenames.unit, content: unitContent },
      view: { filename: filenames.view, content: viewContent },
      template: { filename: filenames.template, content: templateContent },
      zone: { filename: filenames.zone, content: zoneContent },
      util: { filename: filenames.util, content: utilContent },
    };
  }
}
