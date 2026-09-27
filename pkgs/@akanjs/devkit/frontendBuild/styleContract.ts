// Only contrast: `lint/*.grit` enforces the vocabulary closure, and contrast is arithmetic no syntactic rule can do.
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
