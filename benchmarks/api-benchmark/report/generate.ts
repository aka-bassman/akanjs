import path from "node:path";
import { ensureDir, RESULTS_DIR, readJson } from "../harness/lib";

/**
 * Turns a run's raw result JSONs into a human report (Markdown) plus chart data (JSON,
 * consumable by react-chartjs-2). The report has three parts matching the plan:
 *   1. Comparison matrix (framework x metric per surface) with the runtime caveat.
 *   2. Tracing hotspots (per-endpoint span breakdown, queries/request, cache ratio).
 *   3. Improvement backlog auto-derived from the hotspots.
 *
 * Usage: bun report/generate.ts <runId>
 */

interface SpanSummary {
  name: string;
  count: number;
  meanMs: number;
  p99Ms: number;
  maxMs: number;
}
interface TraceEndpoint {
  endpoint: string;
  requests: number;
  avgDbQueriesPerRequest: number;
  cacheHitRatio: number | null;
  avgDataLoaderBatchSize: number | null;
  spans: SpanSummary[];
}
interface TraceSnapshot {
  enabled: boolean;
  endpoints: TraceEndpoint[];
}
interface RunRecord {
  target: string;
  targetLabel: string;
  runtime: "bun" | "node";
  scenario: string;
  surface: string;
  axis: string;
  readyMs?: number;
  result?: {
    rps?: number;
    iterationsPerSec?: number;
    errorRate?: number;
    latencyMs?: { p50?: number; med?: number; p99?: number; max?: number };
    iterationMs?: { p99?: number };
  } | null;
  resource?: {
    maxRssMb?: number | null;
    peakCpuPct?: number | null;
    eventLoopLagP99Ms?: number | null;
    proxyHopMeanMs?: number | null;
    trace?: TraceSnapshot;
  };
  slo?: {
    pass: boolean;
    checks: Array<{ metric: string; value: number; bound: number; op: string; pass: boolean }>;
  } | null;
  note?: string;
}

const fmt = (v: number | null | undefined, suffix = "") => (typeof v === "number" ? `${v}${suffix}` : "—");

const surfaceLabel = (surface: string) =>
  (
    ({
      pure_http: "Pure HTTP / no-DB",
      signal: "Signal API / no-DB",
      db: "Document DB API",
      rest: "Legacy REST comparison",
      websocket: "WebSocket",
      fullstack: "Fullstack",
      ssr: "SSR/RSC",
    }) as Record<string, string>
  )[surface] ?? surface;

const surfaceOrder = (surface: string) =>
  ["pure_http", "signal", "db", "rest", "websocket", "fullstack", "ssr"].indexOf(surface);

const sloLabel = (slo: RunRecord["slo"]) => {
  if (!slo) return "—";
  return slo.pass ? "PASS" : "TARGET MISS";
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
    if (file.endsWith(".k6.json") || file === "coldstart.json" || file === "report.chartdata.json") continue;
    const rec = await readJson<RunRecord>(path.join(runDir, file));
    if (rec?.scenario) records.push(rec);
  }
  if (!records.length) {
    console.error(`No result records in ${runDir}.`);
    process.exit(1);
  }

  const bySurface = new Map<string, RunRecord[]>();
  for (const r of records) {
    const list = bySurface.get(r.surface) ?? [];
    list.push(r);
    bySurface.set(r.surface, list);
  }

  const lines: string[] = [];
  lines.push(`# akanjs performance report — ${runId}`);
  lines.push("");
  lines.push(
    "> Goal: show that akanjs measures at a reasonable level versus mainstream frameworks, and surface internal hotspots to improve. These are not claims of strict superiority.",
  );
  lines.push("");
  lines.push(
    "> **Runtime caveat:** rows tagged `(node)` run on Node.js, the rest on Bun. Cross-runtime numbers are indicative only — differences partly reflect the runtime, not just the framework.",
  );
  lines.push("");
  lines.push(
    "> **SLO note:** `TARGET MISS` means the measured run missed an optimization target. It does not mean HTTP requests failed; check `Err %` separately.",
  );
  lines.push("");

  // 1. Comparison matrix
  lines.push("## 1. Comparison matrix");
  for (const [surface, recs] of [...bySurface.entries()].sort(
    ([a], [b]) => surfaceOrder(a) - surfaceOrder(b) || a.localeCompare(b),
  )) {
    lines.push("");
    lines.push(`### ${surfaceLabel(surface)}`);
    if (surface === "pure_http")
      lines.push("_Gateway/runtime fast path; use this as the lightweight-router comparison baseline._");
    if (surface === "signal") lines.push("_Normal Signal request path without DB, isolating framework overhead._");
    if (surface === "db")
      lines.push("_Document DB business path including DB access, hydration, DataLoader, and serialization._");
    lines.push("");
    lines.push("| Target | Runtime | Scenario | RPS | p50 (ms) | p99 (ms) | Err % | Peak RSS (MB) | SLO |");
    lines.push("| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | :---: |");
    for (const r of recs.sort(
      (a, b) => (b.result?.rps ?? b.result?.iterationsPerSec ?? 0) - (a.result?.rps ?? a.result?.iterationsPerSec ?? 0),
    )) {
      const rps = r.result?.rps ?? r.result?.iterationsPerSec;
      const p50 = r.result?.latencyMs?.p50 ?? r.result?.latencyMs?.med;
      const p99 = r.result?.latencyMs?.p99 ?? r.result?.iterationMs?.p99;
      const err = r.result?.errorRate != null ? Math.round(r.result.errorRate * 1000) / 10 : null;
      lines.push(
        `| ${r.targetLabel} | ${r.runtime} | ${r.scenario} | ${fmt(rps && Math.round(rps))} | ${fmt(p50)} | ${fmt(p99)} | ${fmt(err)} | ${fmt(r.resource?.maxRssMb)} | ${sloLabel(r.slo)} |`,
      );
    }
  }

  // 2. Tracing hotspots
  lines.push("");
  lines.push("## 2. Tracing hotspots (akanjs internal)");
  const traceRecords = records.filter((r) => r.resource?.trace?.enabled && r.resource.trace.endpoints.length);
  const backlog: string[] = [];
  if (!traceRecords.length) {
    lines.push("");
    lines.push(
      "_No trace data captured. Re-run akanjs targets with `AKAN_TRACE=1` to populate per-stage latency, queries/request, and cache ratios._",
    );
  } else {
    for (const r of traceRecords) {
      const trace = r.resource?.trace as TraceSnapshot;
      lines.push("");
      lines.push(`### ${r.targetLabel} — ${r.scenario}`);
      if (r.resource?.proxyHopMeanMs != null)
        lines.push(
          `Gateway proxy hop (mean): ${r.resource.proxyHopMeanMs} ms · event-loop lag p99: ${fmt(r.resource.eventLoopLagP99Ms)} ms`,
        );
      for (const ep of trace.endpoints.slice(0, 5)) {
        lines.push("");
        lines.push(
          `**${ep.endpoint}** — ${ep.requests} req · ${ep.avgDbQueriesPerRequest} queries/req · cache hit ${ep.cacheHitRatio != null ? `${Math.round(ep.cacheHitRatio * 100)}%` : "n/a"}${ep.avgDataLoaderBatchSize != null ? ` · loader batch ${ep.avgDataLoaderBatchSize}` : ""}`,
        );
        lines.push("");
        lines.push("| Stage | mean (ms) | p99 (ms) | max (ms) |");
        lines.push("| --- | ---: | ---: | ---: |");
        for (const s of ep.spans.slice(0, 8)) lines.push(`| ${s.name} | ${s.meanMs} | ${s.p99Ms} | ${s.maxMs} |`);

        // derive backlog heuristics
        const total = ep.spans.find((s) => s.name === "total")?.meanMs ?? 0;
        for (const s of ep.spans) {
          if (s.name === "total") continue;
          if (total > 0 && s.meanMs / total > 0.4)
            backlog.push(
              `\`${ep.endpoint}\`: stage **${s.name}** dominates (${Math.round((s.meanMs / total) * 100)}% of request time) — investigate.`,
            );
        }
        if (ep.avgDbQueriesPerRequest > 3)
          backlog.push(
            `\`${ep.endpoint}\`: ${ep.avgDbQueriesPerRequest} DB queries/request — likely N+1; check DataLoader coverage on nested fields.`,
          );
        if (ep.cacheHitRatio != null && ep.cacheHitRatio < 0.2 && ep.requests > 50)
          backlog.push(
            `\`${ep.endpoint}\`: low cache hit ratio (${Math.round(ep.cacheHitRatio * 100)}%) — consider caching this read.`,
          );
      }
    }
  }

  // 3. Improvement backlog
  lines.push("");
  lines.push("## 3. Improvement backlog");
  if (!backlog.length) {
    lines.push("");
    lines.push(
      "_No hotspots crossed the heuristic thresholds. Populate trace data and re-run to generate suggestions._",
    );
  } else {
    lines.push("");
    for (const item of [...new Set(backlog)]) lines.push(`- ${item}`);
  }

  // cold start (if present)
  const coldstart = await readJson<{
    records: Array<{
      targetLabel: string;
      runtime: string;
      coldStartMsMedian: number | null;
      idleRssMbMedian: number | null;
    }>;
  }>(path.join(runDir, "coldstart.json"));
  if (coldstart?.records?.length) {
    lines.push("");
    lines.push("## 4. Cold start & idle footprint");
    lines.push("");
    lines.push("| Target | Runtime | Cold start (ms, median) | Idle RSS (MB, median) |");
    lines.push("| --- | --- | ---: | ---: |");
    for (const c of coldstart.records)
      lines.push(`| ${c.targetLabel} | ${c.runtime} | ${fmt(c.coldStartMsMedian)} | ${fmt(c.idleRssMbMedian)} |`);
  }

  const reportFile = path.join(runDir, "report.md");
  await ensureDir(runDir);
  await Bun.write(reportFile, `${lines.join("\n")}\n`);

  // chart data for react-chartjs-2
  const chartData = {
    runId,
    surfaces: [...bySurface.entries()].map(([surface, recs]) => ({
      surface,
      labels: recs.map((r) => r.targetLabel),
      rps: recs.map((r) => Math.round(r.result?.rps ?? r.result?.iterationsPerSec ?? 0)),
      p99Ms: recs.map((r) => r.result?.latencyMs?.p99 ?? r.result?.iterationMs?.p99 ?? null),
      rssMb: recs.map((r) => r.resource?.maxRssMb ?? null),
      runtime: recs.map((r) => r.runtime),
    })),
  };
  await Bun.write(path.join(runDir, "report.chartdata.json"), `${JSON.stringify(chartData, null, 2)}\n`);

  console.info(`Report written: ${reportFile}`);
  console.info(`Chart data:     ${path.join(runDir, "report.chartdata.json")}`);
};

void main();
