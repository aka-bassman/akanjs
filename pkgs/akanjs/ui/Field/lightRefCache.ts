"use client";
import { fetch, isClientRuntimeRegistered } from "akanjs/client";
import { capitalize } from "akanjs/common";

interface LightRow {
  id: string;
}

/**
 * Light rows read one id at a time, for a control holding an id its option list does not carry — a form opened
 * through `edit<Model>` before the dropdown was ever opened, or a row outside the one `limit`-sized window a
 * slice list holds.
 *
 * Deliberately not the model's store: that store is a singleton, so reading into it would overwrite whatever
 * listing of the same model is already on the screen — the same reason `Data/RefPicker` keeps its rows local.
 */
export class LightRefCache {
  static #rows = new Map<string, LightRow | null>();
  static #inflight = new Map<string, Promise<void>>();
  static #listeners = new Set<(refName: string, id: string) => void>();

  static get<Light extends LightRow>(refName: string, id: string) {
    return (LightRefCache.#rows.get(LightRefCache.#keyOf(refName, id)) ?? null) as Light | null;
  }
  static subscribe(listener: (refName: string, id: string) => void) {
    LightRefCache.#listeners.add(listener);
    return () => {
      LightRefCache.#listeners.delete(listener);
    };
  }
  static load(refName: string, ids: string[]) {
    for (const id of ids) LightRefCache.#read(refName, id);
  }
  static reset() {
    LightRefCache.#rows.clear();
    LightRefCache.#inflight.clear();
  }
  static #keyOf(refName: string, id: string) {
    return `${refName}:${id}`;
  }
  /**
   * A row that cannot be read is remembered as `null` rather than retried: `light<Model>` carries the model's own
   * `get` guards, which can be narrower than the slice the control lists from, and a removed row answers the same
   * way every time. A runtime that is not registered yet is not an answer, so nothing is remembered for it.
   */
  static #read(refName: string, id: string) {
    const key = LightRefCache.#keyOf(refName, id);
    if (LightRefCache.#rows.has(key) || LightRefCache.#inflight.has(key)) return;
    if (!isClientRuntimeRegistered()) return;
    const read = (fetch as unknown as { [key: string]: unknown })[`light${capitalize(refName)}`];
    if (typeof read !== "function") {
      LightRefCache.#write(refName, id, null);
      return;
    }
    LightRefCache.#inflight.set(
      key,
      (read as (id: string) => Promise<LightRow | null>)(id)
        .then((row) => {
          LightRefCache.#write(refName, id, row?.id ? row : null);
        })
        .catch(() => {
          LightRefCache.#write(refName, id, null);
        })
        .finally(() => {
          LightRefCache.#inflight.delete(key);
        }),
    );
  }
  static #write(refName: string, id: string, row: LightRow | null) {
    LightRefCache.#rows.set(LightRefCache.#keyOf(refName, id), row);
    for (const listener of LightRefCache.#listeners) listener(refName, id);
  }
}
