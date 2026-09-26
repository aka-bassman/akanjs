import path from "node:path";
import type { ChangeKind } from "akanjs/server";

const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const CSS_EXTS = new Set([".css"]);
const CONFIG_BASENAMES = new Set(["akan.config.ts", "bunfig.toml", "tsconfig.json", "package.json"]);

export class HmrChangeClassifier {
  classify(abs: string): ChangeKind {
    if (this.#isUninteresting(abs)) return "ignore";
    const base = path.basename(abs);
    if (CONFIG_BASENAMES.has(base)) return "config";
    const ext = path.extname(abs).toLowerCase();
    if (CSS_EXTS.has(ext)) return "css";
    if (SOURCE_EXTS.has(ext)) return "code";
    return "ignore";
  }

  #isUninteresting(abs: string): boolean {
    const base = path.basename(abs);
    if (!base) return true;
    if (base.startsWith(".")) return true;
    if (base.endsWith("~") || base.endsWith(".swp") || base.endsWith(".swx") || base.endsWith(".tmp")) return true;
    if (abs.includes(`${path.sep}node_modules${path.sep}`)) return true;
    if (abs.includes(`${path.sep}.akan${path.sep}`)) return true;
    return false;
  }
}
