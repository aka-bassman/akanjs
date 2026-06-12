#!/usr/bin/env bun
import path from "node:path";
import { BENCH_ROOT, loadStackConfig, parseArgs, relativeToBench, runCommand, workspacePath } from "./lib";

const main = async () => {
  const args = parseArgs({ scenario: "team-task-board", run: new Date().toISOString().replace(/[:.]/g, "-") });
  const runId = String(args["run-id"] ?? args.run);
  const scenario = String(args.scenario);
  const stack = args.stack ? String(args.stack) : null;
  const all = Boolean(args.all) || !stack;
  const skipCommands = Boolean(args["skip-commands"]);

  const setupArgs = ["harness/setup.ts", "--scenario", scenario, "--run", runId];
  if (all) setupArgs.push("--all");
  else setupArgs.push("--stack", stack as string);
  if (skipCommands) setupArgs.push("--skip-commands");

  const setup = await runCommand(["bun", ...setupArgs], { cwd: BENCH_ROOT });
  if (!setup.success) {
    console.error(setup.output);
    process.exit(1);
  }

  const config = await loadStackConfig();
  const stacks = all ? config.stacks : config.stacks.filter((candidate) => candidate.id === stack);

  const lines: string[] = [];
  lines.push(`# Manual Cursor Run Instructions — ${runId}`);
  lines.push("");
  lines.push("Open each workspace in Cursor and run `BENCHMARK_PROMPT.md` exactly as written.");
  lines.push("After each run, save Cursor token usage to `cursor-report.json`, then verify and collect.");
  lines.push("");
  for (const item of stacks) {
    const workspace = workspacePath(runId, item.id);
    lines.push(`## ${item.label}`);
    lines.push("");
    lines.push("```bash");
    lines.push(`cursor ${workspace}`);
    lines.push(`cd ${BENCH_ROOT}`);
    lines.push(`bun harness/verify.ts --run ${runId} --stack ${item.id}`);
    lines.push(
      `bun harness/collect.ts --run ${runId} --stack ${item.id} --cursor-report ${relativeToBench(path.join(workspace, "cursor-report.json"))}`,
    );
    lines.push("```");
    lines.push("");
  }
  lines.push("When every stack has a collected run record:");
  lines.push("");
  lines.push("```bash");
  lines.push(`cd ${BENCH_ROOT}`);
  lines.push(`bun report/generate.ts ${runId}`);
  lines.push("```");

  const instructions = path.join(BENCH_ROOT, "results", runId, "manual-run-instructions.md");
  await Bun.write(instructions, `${lines.join("\n")}\n`);
  console.info(lines.join("\n"));
  console.info(`Instructions written: ${relativeToBench(instructions)}`);
};

await main();
