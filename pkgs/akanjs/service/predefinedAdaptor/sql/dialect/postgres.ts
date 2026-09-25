import type { DocumentUpdateOperator } from "akanjs/document";
import { quoteIdent } from "../../sqlDescriptor";
import type { SearchJoinProps, SqlDialect, SqlFrag } from "../types";
import { jsonStr } from "../values";

export class PostgresDialect implements SqlDialect {
  readonly name = "postgres" as const;
  timestampType() {
    return "BIGINT";
  }
  docColumnType() {
    return "jsonb";
  }
  docColumn() {
    return quoteIdent("_doc");
  }
  docValuePlaceholder() {
    return "?::jsonb";
  }
  #path(path: string) {
    return `'{${path
      .split(".")
      .map((part) => part.replaceAll("'", "''"))
      .join(",")}}'`;
  }
  #jsonb(path: string) {
    return `(${this.docColumn()} #> ${this.#path(path)})`;
  }
  #text(path: string) {
    return `(${this.docColumn()} #>> ${this.#path(path)})`;
  }
  extract(path: string) {
    return this.#jsonb(path);
  }
  // `#>` stays jsonb, which the driver parses into the stored value with its type intact.
  projectExpr(path: string) {
    return this.#jsonb(path);
  }
  decodeProjected(value: unknown) {
    return value;
  }
  eq(path: string, value: unknown): SqlFrag {
    return value === null
      ? { sql: `${this.#jsonb(path)} IS NULL`, params: [] }
      : { sql: `${this.#jsonb(path)} = ?::jsonb`, params: [jsonStr(value)] };
  }
  ne(path: string, value: unknown): SqlFrag {
    return value === null
      ? { sql: `${this.#jsonb(path)} IS NOT NULL`, params: [] }
      : { sql: `${this.#jsonb(path)} <> ?::jsonb`, params: [jsonStr(value)] };
  }
  compare(path: string, op: "gt" | "gte" | "lt" | "lte", value: unknown): SqlFrag {
    const operators = { gt: ">", gte: ">=", lt: "<", lte: "<=" } as const;
    return { sql: `${this.#jsonb(path)} ${operators[op]} ?::jsonb`, params: [jsonStr(value)] };
  }
  between(path: string, from: unknown, to: unknown): SqlFrag {
    return {
      sql: `(${this.#jsonb(path)} >= ?::jsonb AND ${this.#jsonb(path)} <= ?::jsonb)`,
      params: [jsonStr(from), jsonStr(to)],
    };
  }
  inList(path: string, values: unknown[]): SqlFrag {
    return {
      sql: `${this.#jsonb(path)} IN (${values.map(() => "?::jsonb").join(", ")})`,
      params: values.map(jsonStr),
    };
  }
  notInList(path: string, values: unknown[]): SqlFrag {
    return {
      sql: `${this.#jsonb(path)} NOT IN (${values.map(() => "?::jsonb").join(", ")})`,
      params: values.map(jsonStr),
    };
  }
  exists(path: string): SqlFrag {
    return { sql: `${this.#jsonb(path)} IS NOT NULL`, params: [] };
  }
  missing(path: string): SqlFrag {
    return { sql: `${this.#jsonb(path)} IS NULL`, params: [] };
  }
  empty(path: string): SqlFrag {
    return { sql: `(${this.#jsonb(path)} IS NULL OR jsonb_typeof(${this.#jsonb(path)}) = 'null')`, params: [] };
  }
  arrayHas(path: string, value: unknown): SqlFrag {
    return { sql: `${this.#jsonb(path)} @> ?::jsonb`, params: [jsonStr(value)] };
  }
  contains(path: string, value: unknown): SqlFrag {
    return { sql: `${this.#text(path)} LIKE ?`, params: [`%${String(value)}%`] };
  }
  searchJoin({ ref }: SearchJoinProps): SqlFrag {
    // Failing loudly beats returning every row: a silently dropped search reads as "the query matched everything".
    throw new Error(
      `Text search on "${ref}" requires the sqlite or libsql database; Postgres has no fts5 index to join.`,
    );
  }
  applyUpdate(acc: string, op: DocumentUpdateOperator, path: string, value: unknown): SqlFrag {
    const p = this.#path(path);
    // Reads target the original `_doc` column (param-free) so folding never duplicates prior placeholders; `acc` is
    // only ever the write target.
    const jsonbAt = `(${this.docColumn()}) #> ${p}`;
    const textAt = `(${this.docColumn()}) #>> ${p}`;
    const arr = `COALESCE(${jsonbAt}, '[]'::jsonb)`;
    // biome-ignore lint/suspicious/noUnnecessaryConditions: exhaustive switch over a string-literal union, not a truthiness check
    switch (op) {
      case "set":
        return { sql: `jsonb_set(${acc}, ${p}, ?::jsonb, true)`, params: [jsonStr(value)] };
      case "unset":
        return { sql: `(${acc}) #- ${p}`, params: [] };
      case "inc":
        return {
          sql: `jsonb_set(${acc}, ${p}, to_jsonb(COALESCE((${textAt})::numeric, 0) + ?), true)`,
          params: [Number(value)],
        };
      case "mul":
        return {
          sql: `jsonb_set(${acc}, ${p}, to_jsonb(COALESCE((${textAt})::numeric, 0) * ?), true)`,
          params: [Number(value)],
        };
      case "min":
        return {
          sql: `jsonb_set(${acc}, ${p}, to_jsonb(LEAST(COALESCE((${textAt})::numeric, ?), ?)), true)`,
          params: [Number(value), Number(value)],
        };
      case "max":
        return {
          sql: `jsonb_set(${acc}, ${p}, to_jsonb(GREATEST(COALESCE((${textAt})::numeric, ?), ?)), true)`,
          params: [Number(value), Number(value)],
        };
      case "push":
        return {
          sql: `jsonb_set(${acc}, ${p}, ${arr} || jsonb_build_array(?::jsonb), true)`,
          params: [jsonStr(value)],
        };
      case "addToSet":
        return {
          sql: `jsonb_set(${acc}, ${p}, CASE WHEN ${arr} @> jsonb_build_array(?::jsonb) THEN ${arr} ELSE ${arr} || jsonb_build_array(?::jsonb) END, true)`,
          params: [jsonStr(value), jsonStr(value)],
        };
      case "pull":
        return {
          sql: `jsonb_set(${acc}, ${p}, COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(${arr}) elem WHERE elem <> ?::jsonb), '[]'::jsonb), true)`,
          params: [jsonStr(value)],
        };
      case "setOnInsert":
        return { sql: acc, params: [] };
    }
  }
  affectedRows(result: unknown): number {
    const row = result as { count?: number } | Array<unknown> | null;
    if (Array.isArray(row)) return (row as { count?: number }).count ?? row.length;
    return Number(row?.count ?? 0);
  }
}
