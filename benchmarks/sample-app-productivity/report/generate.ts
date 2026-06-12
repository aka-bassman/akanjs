#!/usr/bin/env bun
import path from "node:path";
import { ensureDir, median, RESULTS_DIR, type RunRecord, readJson, relativeToBench, writeJson } from "../harness/lib";

interface StackSummary {
  stack: string;
  label: string;
  runs: number;
  passedRuns: number;
  failRate: number;
  medianTokens: number | null;
  medianWallClockMs: number | null;
  medianLoc: number | null;
  medianGlueLoc: number | null;
  medianAppSourceLoc: number | null;
}

const fmt = (value: number | null | undefined, suffix = "") =>
  typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}${suffix}` : "n/a";

const pct = (value: number) => `${Math.round(value * 100)}%`;

const passed = (record: RunRecord) => record.build.success && record.tests.success;

const stackSummary = (records: RunRecord[]): StackSummary[] => {
  const groups = new Map<string, RunRecord[]>();
  for (const record of records) {
    groups.set(record.stack, [...(groups.get(record.stack) ?? []), record]);
  }
  return [...groups.entries()]
    .map(([stack, stackRecords]) => {
      const passedRuns = stackRecords.filter(passed).length;
      return {
        stack,
        label: stackRecords[0]?.stackLabel ?? stack,
        runs: stackRecords.length,
        passedRuns,
        failRate: stackRecords.length ? 1 - passedRuns / stackRecords.length : 0,
        medianTokens: median(
          stackRecords.map((record) => record.tokens.total).filter((value): value is number => value != null),
        ),
        medianWallClockMs: median(
          stackRecords.map((record) => record.wallClockMs).filter((value): value is number => value != null),
        ),
        medianLoc: median(stackRecords.map((record) => record.code.loc)),
        medianGlueLoc: median(stackRecords.map((record) => record.code.glueLoc)),
        medianAppSourceLoc: median(stackRecords.map((record) => record.code.appSourceLoc)),
      };
    })
    .sort((a, b) => a.stack.localeCompare(b.stack));
};

const main = async () => {
  const runId = process.argv[2];
  if (!runId) {
    console.error("Usage: bun report/generate.ts <runId>");
    process.exit(1);
  }
  const runDir = path.join(RESULTS_DIR, runId);
  const glob = new Bun.Glob("*.json");
  const records: RunRecord[] = [];
  for await (const file of glob.scan({ cwd: runDir })) {
    if (
      file.endsWith(".verification.json") ||
      file.endsWith(".setup.json") ||
      file === "setup.summary.json" ||
      file === "report.chartdata.json"
    ) {
      continue;
    }
    const record = await readJson<RunRecord>(path.join(runDir, file));
    if (record?.stack && record?.code) records.push(record);
  }
  if (!records.length) {
    console.error(`No run records in ${relativeToBench(runDir)}.`);
    process.exit(1);
  }

  const summaries = stackSummary(records);
  const akan = summaries.find((summary) => summary.stack === "akanjs");
  const competitors = summaries.filter((summary) => summary.stack !== "akanjs");
  const competitorMedianTokens = median(
    competitors.map((summary) => summary.medianTokens).filter((value): value is number => value != null),
  );
  const competitorMedianWallClockMs = median(
    competitors.map((summary) => summary.medianWallClockMs).filter((value): value is number => value != null),
  );

  const lines: string[] = [];
  lines.push(`# Sample App Productivity Report — ${runId}`);
  lines.push("");
  lines.push(
    "> Measures Cursor token usage, wall-clock time, repair-loop completion, and generated LOC for the same Team Task Board app.",
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Stack | Runs | Pass | Fail rate | Median tokens | Median wall-clock | LOC | Glue LOC | App LOC |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const summary of summaries) {
    lines.push(
      `| ${summary.label} | ${summary.runs} | ${summary.passedRuns} | ${pct(summary.failRate)} | ${fmt(summary.medianTokens)} | ${fmt(summary.medianWallClockMs, "ms")} | ${fmt(summary.medianLoc)} | ${fmt(summary.medianGlueLoc)} | ${fmt(summary.medianAppSourceLoc)} |`,
    );
  }

  lines.push("");
  lines.push("## Homepage Metrics");
  lines.push("");
  lines.push(`- Akan total tokens: ${fmt(akan?.medianTokens)}`);
  lines.push(`- Competitor median total tokens: ${fmt(competitorMedianTokens)}`);
  lines.push(`- Akan wall-clock time: ${fmt(akan?.medianWallClockMs, "ms")}`);
  lines.push(`- Competitor median wall-clock time: ${fmt(competitorMedianWallClockMs, "ms")}`);
  lines.push(`- Akan final acceptance pass: ${akan ? `${akan.passedRuns}/${akan.runs}` : "n/a"}`);
  lines.push(`- Akan generated LOC: ${fmt(akan?.medianLoc)}`);

  const failed = records.filter((record) => !passed(record));
  lines.push("");
  lines.push("## Failed Runs");
  if (!failed.length) {
    lines.push("");
    lines.push("_No failed runs recorded._");
  } else {
    lines.push("");
    for (const record of failed) {
      const failedAcceptance = record.acceptance.filter((item) => !item.pass).map((item) => item.id);
      lines.push(`- ${record.stack} iteration ${record.iteration}: failed ${failedAcceptance.join(", ") || "unknown"}`);
    }
  }

  lines.push("");
  lines.push("## Caveats");
  lines.push("");
  lines.push("- Cursor report fields that were unavailable are left as `null` and excluded from medians.");
  lines.push("- Runs are only comparable within the same dependency lockfile batch and agent model.");
  lines.push("- Agent execution is manual; the harness standardizes setup, verification, collection, and reporting.");

  const chartData = {
    runId,
    scenario: records[0]?.scenario ?? "team-task-board",
    generatedAt: new Date().toISOString(),
    summaries,
    homepage: {
      akanTotalTokens: akan?.medianTokens ?? null,
      competitorMedianTotalTokens: competitorMedianTokens,
      akanWallClockMs: akan?.medianWallClockMs ?? null,
      competitorMedianWallClockMs,
      akanFinalAcceptancePass: akan ? akan.passedRuns === akan.runs : null,
      akanGeneratedLoc: akan?.medianLoc ?? null,
    },
  };

  await ensureDir(runDir);
  await Bun.write(path.join(runDir, "report.md"), `${lines.join("\n")}\n`);
  await writeJson(path.join(runDir, "report.chartdata.json"), chartData);
  console.info(`Report written: ${relativeToBench(path.join(runDir, "report.md"))}`);
};

await main();
