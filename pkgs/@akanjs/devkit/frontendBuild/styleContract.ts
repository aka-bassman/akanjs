/**
 * Reports the style contract that `akan lint` enforces, in the shape build/dev/lint share.
 *
 * Only contrast lives here. The vocabulary closure — raw palette classes, arbitrary colors, dropped
 * daisyUI slots, inline color literals, interpolated arbitrary values — is enforced by the grit plugins
 * in `lint/*.grit` during the biome run, so it is not re-scanned. Contrast cannot be a lint rule at all:
 * it is arithmetic over resolved token *values*, which no syntactic pattern can reach.
 */
import type { ThemeContrastViolation } from "./themeValidator";

export interface StyleContractViolations {
  theme: ThemeContrastViolation[];
}

export const countBlocking = (violations: StyleContractViolations): number => violations.theme.length;

export const formatStyleContract = (violations: StyleContractViolations): string =>
  violations.theme
    .flatMap((theme) => [
      `  [error] contrast  ${theme.scope}  ${theme.pair} = ${theme.ratio}:1 (min ${theme.threshold}:1)`,
      `      → ${theme.suggestion}`,
    ])
    .join("\n");
