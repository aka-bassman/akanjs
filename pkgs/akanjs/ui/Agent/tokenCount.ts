/** Rounded hard: the estimate is four characters to a token, so exact digits would claim false precision. */
export const tokenCount = (count: number): string => {
  if (count < 1_000) return String(count);
  if (count < 1_000_000) return `${Math.round(count / 100) / 10}k`;
  return `${Math.round(count / 100_000) / 10}M`;
};
