import type { AppInfo, LibInfo } from "akanjs";

export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: { [key: string]: string } = {}) {
  if (!scanInfo) return null;
  const libs = scanInfo.getLibs();
  const libInfos = [...scanInfo.getLibInfos().values()];
  const extendedModels = Object.fromEntries(
    [...scanInfo.file.document.databases]
      .map(
        (modelName) =>
          [
            modelName,
            libInfos.filter((libInfo) => libInfo.file.document.databases.has(modelName)).map((libInfo) => libInfo.name),
          ] as [string, string[]],
      )
      .filter(([_, libNames]) => libNames.length > 0),
  );
  return `
${libs.map((lib) => `import { db as ${lib} } from "@libs/${lib}/server";`).join("\n")}

${Object.entries(extendedModels)
  .map(
    ([modelName, extendedModels]) =>
      `export const ${modelName} = {
  inputs: [${extendedModels.map((libName) => `${libName}.${modelName}.input`).join(", ")}] as const,
  docs: [${extendedModels.map((libName) => `${libName}.${modelName}.doc`).join(", ")}] as const,
  models: [${extendedModels.map((libName) => `${libName}.${modelName}.model`).join(", ")}] as const,
  filters: [${extendedModels.map((libName) => `${libName}.${modelName}.filter`).join(", ")}] as const,
}`,
  )
  .join("\n")}
`;
}
