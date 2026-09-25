/**
 * The embeddable code agent: the engine and everything around it, plus the terminal host's own pieces.
 *
 * The engine itself lives in `@akanjs/devkit/codeAgent` — the CLI is the executable, devkit is the library —
 * and is re-exported here so an embedder has one entry to import rather than two packages to know about.
 *
 * `CodeTui` is deliberately absent: it imports Ink and React, and an SDK consumer embedding the core in a
 * server or a browser bundle should not pay for a terminal renderer. Import it from `./CodeTui`.
 */
export * from "@akanjs/devkit/codeAgent";
export { CodeTuiAgents } from "./CodeTuiAgents";
export { CodeTuiClipboard } from "./CodeTuiClipboard";
export { type CodeTuiCommand, CodeTuiCommands } from "./CodeTuiCommands";
export { CodeTuiEditor, type CodeTuiEditorLayout, type CodeTuiEditorRow } from "./CodeTuiEditor";
export { CodeTuiFiles } from "./CodeTuiFiles";
export { type CodeTuiLine, CodeTuiLines, type CodeTuiRow, type CodeTuiSpan, type CodeTuiStyle } from "./CodeTuiLines";
export { CodeTuiMarkdown } from "./CodeTuiMarkdown";
export { CodeTuiParts, type CodeTuiPartsOptions } from "./CodeTuiParts";
