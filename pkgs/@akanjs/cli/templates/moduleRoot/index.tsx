import type { AppInfo, LibInfo } from "akanjs";

interface Dict {
  [key: string]: string;
  model: string;
  Model: string;
}
export default function getContent(scanInfo: AppInfo | LibInfo, dict: Dict) {
  const moduleInfo =
    scanInfo.database.get(dict.model) ?? scanInfo.service.get(dict.model) ?? scanInfo.scalar.get(dict.model);
  if (!moduleInfo) return null;
  const allowedFileTypes = scanInfo.scalar.has(dict.model)
    ? ["Template", "Unit"]
    : scanInfo.service.has(dict.model)
      ? ["Util", "Zone"]
      : ["Template", "Unit", "Util", "View", "Zone"];
  const fileTypes: string[] = [];
  if (moduleInfo.has("template") && allowedFileTypes.includes("Template")) fileTypes.push("Template");
  if (moduleInfo.has("unit") && allowedFileTypes.includes("Unit")) fileTypes.push("Unit");
  if (moduleInfo.has("util") && allowedFileTypes.includes("Util")) fileTypes.push("Util");
  if (moduleInfo.has("view") && allowedFileTypes.includes("View")) fileTypes.push("View");
  if (moduleInfo.has("zone") && allowedFileTypes.includes("Zone")) fileTypes.push("Zone");
  if (fileTypes.length === 0) return null;
  return {
    filename: "index.ts",
    content: `${fileTypes.map((type) => `import * as ${type} from "./${dict.Model}.${type}";`).join("\n")}

export const ${dict.Model} = { ${fileTypes.join(", ")} };
`,
  };
}
