import type { AppInfo, LibInfo } from "akanjs";

export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: { [key: string]: string } = {}) {
  if (!scanInfo) return null;
  const libs = scanInfo.getLibs();
  const libInfos = scanInfo.getLibInfos();
  const extendedModels = Object.fromEntries(
    [...scanInfo.file.dictionary.databases]
      .map(
        (modelName) =>
          [
            modelName,
            [...libInfos.values()]
              .filter((libInfo) => libInfo.file.dictionary.databases.has(modelName))
              .map((libInfo) => libInfo.name),
          ] as [string, string[]],
      )
      .filter(([_, libNames]) => libNames.length > 0),
  );
  return `
${libs.map((lib) => `import { dict as ${lib} } from "@libs/${lib}/server";`).join("\n")}

${Object.entries(extendedModels)
  .map(([modelName, extendedModels]) => {
    return `export const ${modelName} = {
  dictionaries: [${extendedModels.map((libName) => `${libName}.${modelName}.dictionary`).join(", ")}] as const,
};`;
  })
  .join("\n")}
`;
}
