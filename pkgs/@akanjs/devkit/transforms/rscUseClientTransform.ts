import path from "node:path";

const USE_CLIENT_RE = /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*["']use client["']/;
const IMPLICIT_ROOT_LAYOUT_RE =
  /[/\\]\.akan[/\\]generated[/\\](?:implicit-root-layout|root-layouts[/\\].*__root_layout)\.(tsx|ts|jsx|js)$/;

export interface UseClientTransformArgs {
  path: string;
  workspaceRoot?: string;
}

export function toClientReferencePath(absPath: string, workspaceRoot: string): string {
  return path.relative(path.resolve(workspaceRoot), path.resolve(absPath)).split(path.sep).join("/");
}

/** `null` unless `source` is a `"use client"` module; the stub source is valid under loader `"ts"`. */
export function transformUseClient(source: string, args: UseClientTransformArgs): string | null {
  if (!USE_CLIENT_RE.test(source)) return null;
  if (IMPLICIT_ROOT_LAYOUT_RE.test(args.path)) return null;
  const transpiler = new Bun.Transpiler({ loader: loaderFor(args.path) });
  const { exports } = transpiler.scan(source);
  if (exports.length === 0) return null;

  const referencePath = args.workspaceRoot ? toClientReferencePath(args.path, args.workspaceRoot) : args.path;
  const filePathLit = JSON.stringify(referencePath);
  const lines: string[] = [`import { registerClientReference } from "react-server-dom-webpack/server.node";`];

  for (const name of exports) {
    const nameLit = JSON.stringify(name);
    const errMsg = JSON.stringify(
      `Attempted to call '${name}' from '${referencePath}' on the server, but it is a client-only export.`,
    );
    const proxy = `() => { throw new Error(${errMsg}); }`;
    const binding =
      name === "default"
        ? `export default registerClientReference(${proxy}, ${filePathLit}, ${nameLit});`
        : `export const ${name} = registerClientReference(${proxy}, ${filePathLit}, ${nameLit});`;
    lines.push(binding);
  }

  return lines.join("\n");
}

function loaderFor(absPath: string): "ts" | "tsx" | "js" | "jsx" {
  if (absPath.endsWith(".tsx")) return "tsx";
  if (absPath.endsWith(".jsx")) return "jsx";
  if (absPath.endsWith(".ts")) return "ts";
  return "js";
}
