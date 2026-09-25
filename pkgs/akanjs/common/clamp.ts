/** Constrains a value to `[min, max]`. */
export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
