export interface NamedItem {
  imported: string;
  local: string;
  isType: boolean;
}

export const loaderFor = (absPath: string): "ts" | "tsx" | "js" | "jsx" => {
  if (absPath.endsWith(".tsx")) return "tsx";
  if (absPath.endsWith(".jsx")) return "jsx";
  if (absPath.endsWith(".ts")) return "ts";
  return "js";
};

export const parseNamedList = (listBody: string): NamedItem[] => {
  const out: NamedItem[] = [];
  for (const raw of listBody.split(",")) {
    let rest = raw.trim();
    if (!rest) continue;
    let isType = false;
    if (rest.startsWith("type ")) {
      isType = true;
      rest = rest.slice(5).trim();
    }
    const asMatch = /^(\w+)\s+as\s+(\w+)$/.exec(rest);
    if (asMatch) {
      out.push({ imported: asMatch[1] ?? "", local: asMatch[2] ?? "", isType });
      continue;
    }
    if (/^\w+$/.test(rest)) out.push({ imported: rest, local: rest, isType });
  }
  return out;
};
