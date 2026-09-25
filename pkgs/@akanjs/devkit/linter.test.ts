import { describe, expect, test } from "bun:test";
import { type BiomeReport, parseBiomeReport } from "./linter";

const reportOf = (diagnostics: BiomeReport["diagnostics"]): string =>
  JSON.stringify({ summary: { errors: diagnostics?.length ?? 0, warnings: 0 }, diagnostics });

const oneDiagnostic: BiomeReport["diagnostics"] = [
  {
    severity: "error",
    message: "Unexpected any",
    category: "lint/suspicious/noExplicitAny",
    location: { path: "apps/demo/ui/Card.tsx", start: { line: 3, column: 10 } },
  },
];

describe("parseBiomeReport", () => {
  test("reads a report that is the whole output", () => {
    const report = parseBiomeReport(reportOf(oneDiagnostic));
    expect(report.diagnostics).toHaveLength(1);
    expect(report.diagnostics?.[0]?.category).toBe("lint/suspicious/noExplicitAny");
    expect(report.summary?.errors).toBe(1);
  });

  test("reads a report behind leading text", () => {
    const output = `Skipped 3 files.\n${reportOf(oneDiagnostic)}`;
    expect(parseBiomeReport(output).diagnostics).toHaveLength(1);
  });

  test("reads a report behind leading text that carries a brace", () => {
    // The whole reason the first-brace-to-last-brace slice was wrong: Biome prints configuration and IO
    // diagnostics onto the same stream as the report, and those messages quote source and config.
    const output = [
      "configuration/deserialize: unknown key `overrides[0].includes { }`",
      "  the file `biome.jsonc` cannot be read",
      reportOf(oneDiagnostic),
    ].join("\n");
    expect(parseBiomeReport(output).diagnostics).toHaveLength(1);
  });

  test("skips a complete JSON object in leading text that is not a report", () => {
    const output = `hint: try {"linter":{"enabled":true}} in your config\n${reportOf(oneDiagnostic)}`;
    const report = parseBiomeReport(output);
    expect(report.diagnostics).toHaveLength(1);
    expect(report.summary?.errors).toBe(1);
  });

  test("reads a report followed by trailing text", () => {
    const output = `${reportOf(oneDiagnostic)}\nChecked 12 files in 40ms. Found 1 error.`;
    expect(parseBiomeReport(output).diagnostics).toHaveLength(1);
  });

  test("keeps a diagnostic whose message contains braces and quotes", () => {
    const message = 'Replace {" a "} with { " a " } — the `{}` object syntax is not allowed';
    const report = parseBiomeReport(reportOf([{ severity: "error", message }]));
    expect(report.diagnostics?.[0]?.message).toBe(message);
  });

  test("keeps a diagnostic whose message ends in an escaped backslash before the closing quote", () => {
    const message = "path separator is \\\\";
    const report = parseBiomeReport(reportOf([{ severity: "warning", message }]));
    expect(report.diagnostics?.[0]?.message).toBe(message);
    expect(report.diagnostics).toHaveLength(1);
  });

  test("accepts a report carrying only a summary", () => {
    expect(parseBiomeReport('{"summary":{"errors":0,"warnings":0}}').summary?.errors).toBe(0);
  });

  test("throws the output when it holds no JSON at all", () => {
    expect(() => parseBiomeReport("biome: command not found\n")).toThrow("biome: command not found");
  });

  test("throws the output when the only brace never closes", () => {
    expect(() => parseBiomeReport('internal error: {"diagnostics":[')).toThrow("internal error");
  });

  test("throws a named error for empty output", () => {
    expect(() => parseBiomeReport("   \n")).toThrow("No Biome JSON output");
  });
});
