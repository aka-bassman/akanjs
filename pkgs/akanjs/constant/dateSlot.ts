import { type Dayjs, dayjs } from "akanjs/base";

// A Date field keeps a native `Date` under a per-key symbol and builds its `Dayjs` on first read, memoized per `Date`.
// The slot is per key, not per class: `applyMixins` copies a light model's accessors onto the full model's prototype.
const slotByKey = new Map<string, symbol>();
export const dateSlotOf = (key: string): symbol => {
  const cached = slotByKey.get(key);
  if (cached) return cached;
  const slot = Symbol.for(`akan.date.${key}`);
  slotByKey.set(key, slot);
  return slot;
};

const dayjsByDate = new WeakMap<Date, Dayjs>();
const lazyDayjsOf = (date: Date): Dayjs => {
  const cached = dayjsByDate.get(date);
  if (cached) return cached;
  const value = dayjs(date);
  dayjsByDate.set(date, value);
  return value;
};

/** A caller's own `Date` is copied: the slot must not alias an object the caller can still mutate. */
export const toDateValue = (value: unknown): Date | null | undefined => {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (dayjs.isDayjs(value)) return value.toDate();
  return new Date(value as string | number);
};

type DateSlotHolder = Record<symbol, Date | null | undefined>;

// Enumerable so `for...in` (`plainFieldsOf`, `immerify`, `deepObjectify`) sees it. immer calls the setter with the
// draft as `this`, so a write stays copy-on-write; the getter writes nothing, so a read never marks a draft modified.
export const dateAccessorOf = (key: string): PropertyDescriptor => {
  const slot = dateSlotOf(key);
  return {
    enumerable: true,
    configurable: true,
    get(this: DateSlotHolder) {
      const date = this[slot];
      return date === null || date === undefined ? date : lazyDayjsOf(date);
    },
    set(this: DateSlotHolder, value: unknown) {
      this[slot] = toDateValue(value);
    },
  };
};

export const isDateSlotField = (props: { modelRef: unknown; isArray: boolean; isMap: boolean }): boolean =>
  props.modelRef === Date && !props.isArray && !props.isMap;
