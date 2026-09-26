import { readFileSync, statSync } from "node:fs";

export const readJsonLines = (file: string, maxBytes?: number) => {
  try {
    if (maxBytes !== undefined && statSync(file).size > maxBytes) return [];
    return readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => !!line.trim());
  } catch {
    return [];
  }
};

export const parseJsonLine = <T>(line: string) => {
  try {
    return JSON.parse(line) as T;
  } catch {
    return undefined;
  }
};
