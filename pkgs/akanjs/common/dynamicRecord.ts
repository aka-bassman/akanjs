/**
 * A generated surface read by a name computed at runtime.
 *
 * The framework's glue layers dispatch by name: a store action reaches `fetch[key]`, a resolver reaches
 * `service[method]`, a `Load.*` component reads `init[names.pageOfModel]`. None of those keys exist in a type,
 * because the type is generated from the model — so every one of them used to be spelled `as any`, which the
 * guide bans and which also silences the *value* type on the way out.
 *
 * This says the same thing about the index and nothing about the value: `as DynamicRecord` to index, then the
 * read carries its own `as T`. One alias so a reader can tell name-based dispatch from an untyped object.
 */
export type DynamicRecord<Value = unknown> = { [key: string]: Value };
