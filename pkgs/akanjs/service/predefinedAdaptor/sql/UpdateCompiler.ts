import {
  type DocumentUpdate,
  type DocumentUpdateNode,
  type DocumentUpdateOperator,
  isDocumentUpdateNode,
} from "akanjs/document";
import { quoteIdent } from "../sqlDescriptor";
import { BASE_COLUMNS, type FieldMap, type SqlDialect } from "./types";
import { encodeSqlValue } from "./values";

export class UpdateCompiler {
  constructor(
    private readonly fields: FieldMap,
    private readonly dialect: SqlDialect,
  ) {}

  compile(update: DocumentUpdate): { assignments: string[]; params: unknown[]; setOnInsert: Record<string, unknown> } {
    const baseAssignments: string[] = [];
    const baseParams: unknown[] = [];
    const setOnInsert: Record<string, unknown> = {};
    const jsonOps: { op: DocumentUpdateOperator; path: string; value: unknown }[] = [];
    for (const [path, raw] of Object.entries(update)) {
      if (raw === undefined) continue;
      const node: DocumentUpdateNode = isDocumentUpdateNode(raw) ? raw : { kind: "update", op: "set", value: raw };
      this.#assertPath(path);
      if (node.op === "setOnInsert") {
        setOnInsert[path] = node.value;
        continue;
      }
      if (BASE_COLUMNS.has(path)) {
        if (node.op === "set") {
          baseAssignments.push(`${quoteIdent(path)} = ?`);
          baseParams.push(encodeSqlValue(node.value));
        } else if (node.op === "unset") {
          baseAssignments.push(`${quoteIdent(path)} = NULL`);
        } else {
          throw new Error(`Unsupported update operator '${node.op}' on base column: ${path}`);
        }
        continue;
      }
      jsonOps.push({ op: node.op, path, value: node.value });
    }
    const assignments = [...baseAssignments];
    const params = [...baseParams];
    if (jsonOps.length) {
      let acc = this.dialect.docColumn();
      for (const { op, path, value } of jsonOps) {
        const frag = this.dialect.applyUpdate(acc, op, path, value);
        acc = frag.sql;
        params.push(...frag.params);
      }
      assignments.push(`${this.dialect.docColumn()} = ${acc}`);
    }
    return { assignments, params, setOnInsert };
  }

  #assertPath(path: string) {
    const root = path.split(".")[0];
    if (BASE_COLUMNS.has(root)) return;
    if (!this.fields[root]) throw new Error(`Unknown document field path: ${path}`);
  }
}

/**
 * Per-document modification state, attached only when a document is hydrated for writing.
 * Non-enumerable so `{ ...doc }` in `toRow` and `Object.entries` in `sanitizeJson` never see it.
 */
