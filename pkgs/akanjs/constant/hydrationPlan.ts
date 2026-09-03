import { FIELD_META } from "akanjs/base";

import { type Converter, converterOf } from "./crystalize";
import { dateSlotOf, isDateSlotField, toDateValue } from "./dateSlot";
import type { FieldObject } from "./fieldInfo";
import { defaultPlanOf } from "./getDefault";

interface PlanEntry {
  key: string;
  /** The own property the value lands on: the key itself, or a Date field's slot symbol. */
  target: string | symbol;
  convert: Converter;
  makeDefault: () => unknown;
}
type PlanTarget = Record<string | symbol, unknown>;
interface PlanOwner {
  [FIELD_META]: FieldObject;
}

/**
 * One hydration plan per model class, compiled from `FIELD_META` on the first instance. Reading the field map,
 * resolving `getProps()` and dispatching on the field kind used to happen per field per instance, and was most of
 * what a listing paid after the dayjs objects — a plan turns a row into a plain loop over precomputed converters.
 *
 * Cached per class rather than per field map because `fullModelOf` extends a lib model's `FIELD_META` in place;
 * `applyConstantStatics` resets the entry whenever it finishes wiring a class.
 */
export class HydrationPlan {
  static #byClass = new WeakMap<object, HydrationPlan>();
  static of(cls: PlanOwner): HydrationPlan {
    const cached = HydrationPlan.#byClass.get(cls);
    if (cached) return cached;
    const plan = new HydrationPlan(cls[FIELD_META]);
    HydrationPlan.#byClass.set(cls, plan);
    return plan;
  }
  static reset(cls: object) {
    HydrationPlan.#byClass.delete(cls);
  }

  #entries: PlanEntry[];
  constructor(fieldObj: FieldObject) {
    const defaults = defaultPlanOf(fieldObj);
    this.#entries = Object.entries(fieldObj).map(([key, field]) => {
      const props = field.getProps();
      const isDateSlot = isDateSlotField(props);
      const convert: Converter = isDateSlot ? toDateValue : converterOf(props);
      const perCall = defaults.perCall.get(key);
      const rawDefault = perCall ?? (() => defaults.shared[key]);
      // A default goes through the same converter as a value, so an array literal is copied and a scalar record
      // becomes an instance exactly as it did when defaults were spread into `set()`.
      return { key, target: isDateSlot ? dateSlotOf(key) : key, convert, makeDefault: () => convert(rawDefault()) };
    });
  }

  /** Fills every field: the value when the source carries one, the field's default otherwise. */
  construct(instance: object, source?: Record<string, unknown> | null) {
    const target = instance as PlanTarget;
    for (const entry of this.#entries) {
      const value = source === undefined || source === null ? undefined : source[entry.key];
      target[entry.target] = value === undefined ? entry.makeDefault() : entry.convert(value);
    }
  }

  /** Overwrites only the fields the source names; `in` rather than own keys, so another instance's accessors count. */
  assign(instance: object, source: Record<string, unknown>) {
    const target = instance as PlanTarget;
    for (const entry of this.#entries) {
      if (!(entry.key in source)) continue;
      target[entry.target] = entry.convert(source[entry.key]);
    }
  }
}
