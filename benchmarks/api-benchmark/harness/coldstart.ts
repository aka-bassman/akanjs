import path from "node:path";
import { ensureDir, RESULTS_DIR, round, sleep, spawnServer, waitForHttp, writeJson } from "./lib";
import { ResourceSampler } from "./resourceSampler";
import { loadTargets } from "./targets";

/**
 * Cold start + idle footprint. Boots a target N times, timing process-start to first
 * healthy response, and samples idle RSS after a short settle. Reports the median.
 *
 * Usage: bun harness/coldstart.ts --target raw-bun --iterations 5
 */

const parseArgs = () => {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback?: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
  };
  return {
    all: args.includes("--all"),
    target: get("--target"),
    iterations: Number(get("--iterations", "5")),
    settleMs: Number(get("--settle", "3000")),
  };
};

const median = (arr: number[]) => {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const main = async () => {
  const opts = parseArgs();
  const targets = await loadTargets();
  const names = opts.all ? Object.keys(targets) : opts.target ? [opts.target] : [];
  if (!names.length) {
    console.error("Specify --target <name> or --all.");
    process.exit(1);
  }

  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const records: unknown[] = [];

  for (const name of names) {
    const target = targets[name];
    if (!target) continue;
    const bootMs: number[] = [];
    const idleRssMb: number[] = [];
    console.info(`\n=== ${target.label}: ${opts.iterations} cold starts ===`);
    for (let i = 0; i < opts.iterations; i++) {
      const server = spawnServer(target.cmd, target.env, target.cwd);
      try {
        const ready = await waitForHttp(target.metricsUrl ?? `${target.baseUrl}${target.paths.ping}`, 60_000);
        bootMs.push(ready);
        await sleep(opts.settleMs);
        const sampler = new ResourceSampler({ pid: server.pid, metricsUrl: target.metricsUrl, intervalMs: 300 });
        sampler.start();
        await sleep(1_000);
        const resource = await sampler.stop();
        if (resource.avgRssMb != null) idleRssMb.push(resource.avgRssMb);
        console.info(`  iter ${i + 1}: boot=${Math.round(ready)}ms idleRss=${resource.avgRssMb}MB`);
      } catch (error) {
        console.error(`  iter ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        await server.stop();
        await sleep(500);
      }
    }
    records.push({
      target: target.name,
      targetLabel: target.label,
      runtime: target.runtimeLabel,
      iterations: opts.iterations,
      coldStartMsMedian: round(median(bootMs)),
      idleRssMbMedian: round(median(idleRssMb)),
      raw: { bootMs: bootMs.map((v) => round(v)), idleRssMb },
    });
  }

  const outFile = path.join(RESULTS_DIR, runId, "coldstart.json");
  await ensureDir(path.dirname(outFile));
  await writeJson(outFile, { runId, surface: "coldstart", records });
  console.info(`\nDone. -> ${outFile}`);
};

void main();
