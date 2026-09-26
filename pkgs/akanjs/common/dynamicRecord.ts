/** Name-based dispatch over a generated surface: `as DynamicRecord` to index, then cast the read, never `as any`. */
export type DynamicRecord<Value = unknown> = { [key: string]: Value };
