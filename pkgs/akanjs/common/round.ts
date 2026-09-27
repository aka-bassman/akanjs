export const round = (value: number, digits = 3): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
