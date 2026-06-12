#!/usr/bin/env bun
import path from "node:path";
import {
  ensureDir,
  loadStackConfig,
  parseArgs,
  RESULTS_DIR,
  relativeToBench,
  runCommand,
  spawnLongRunning,
  type VerificationSummary,
  verificationPath,
  waitForHttp,
  workspacePath,
  writeJson,
} from "./lib";

const ACCEPTANCE = [
  { id: "list-visible", label: "`/` or `/tasks` shows the task list" },
  { id: "create-task", label: "A task can be created" },
  { id: "change-status", label: "A task status can be changed" },
  { id: "assign-task", label: "An assignee can be selected or changed" },
  { id: "status-filter", label: "The status filter changes the visible task list" },
  { id: "task-detail", label: "Task detail is visible in a detail page or panel" },
  { id: "reload-persistence", label: "Refreshing the page keeps created or updated data" },
  { id: "build-success", label: "The build command succeeds" },
  { id: "smoke-success", label: "The smoke test command succeeds" },
];

const main = async () => {
  const args = parseArgs({ run: "smoke" });
  const runId = String(args["run-id"] ?? args.run);
  const stackId = String(args.stack ?? "");
  if (!stackId) throw new Error("Missing --stack <stackId>");

  const config = await loadStackConfig();
  const stack = config.stacks.find((candidate) => candidate.id === stackId);
  if (!stack) throw new Error(`Unknown stack: ${stackId}`);

  const workspace = workspacePath(runId, stack.id);
  const logDir = path.join(RESULTS_DIR, runId, "logs");
  await ensureDir(logDir);

  const buildLog = path.join(logDir, `${stack.id}.build.log`);
  const smokeLog = path.join(logDir, `${stack.id}.smoke.log`);
  const startLog = path.join(logDir, `${stack.id}.start.log`);

  console.info(`Building ${stack.id}`);
  const build = await runCommand(stack.buildCommand, { cwd: workspace, logFile: buildLog });

  let smokeSuccess = false;
  let smokeDurationMs: number | null = null;
  let smokePassed: number | null = null;
  let smokeFailed: number | null = null;

  if (build.success && !args["skip-smoke"]) {
    console.info(`Starting ${stack.id} at ${stack.baseUrl}`);
    const server = await spawnLongRunning(stack.startCommand, { cwd: workspace, logFile: startLog });
    try {
      await waitForHttp(stack.baseUrl, Number(args["startup-timeout-ms"] ?? 90_000));
      const started = performance.now();
      const smoke = await runCommand(
        ["bun", "x", "playwright", "test", path.join("smoke", "team-task-board.spec.ts"), "--reporter=line"],
        {
          cwd: path.resolve(import.meta.dir, ".."),
          env: {
            BASE_URL: stack.baseUrl,
          },
          logFile: smokeLog,
        },
      );
      smokeDurationMs = Math.round(performance.now() - started);
      smokeSuccess = smoke.success;
      smokePassed = smoke.success ? ACCEPTANCE.length - 1 : null;
      smokeFailed = smoke.success ? 0 : null;
    } finally {
      await server.stop();
    }
  }

  const acceptance = ACCEPTANCE.map((item) => {
    if (item.id === "build-success") return { ...item, pass: build.success, note: relativeToBench(buildLog) };
    if (item.id === "smoke-success") return { ...item, pass: smokeSuccess, note: relativeToBench(smokeLog) };
    return {
      ...item,
      pass: smokeSuccess,
      note: smokeSuccess ? undefined : "Smoke test did not pass; inspect smoke log for the failing flow.",
    };
  });

  const summary: VerificationSummary = {
    stack: stack.id,
    runId,
    build: {
      success: build.success,
      durationMs: build.durationMs,
      command: stack.buildCommand,
      logFile: relativeToBench(buildLog),
    },
    tests: {
      success: smokeSuccess,
      durationMs: smokeDurationMs,
      command: ["bun", "x", "playwright", "test", "smoke/team-task-board.spec.ts", "--reporter=line"],
      passed: smokePassed,
      failed: smokeFailed,
      logFile: relativeToBench(smokeLog),
    },
    acceptance,
  };
  await writeJson(verificationPath(runId, stack.id), summary);
  console.info(`Verification written: ${relativeToBench(verificationPath(runId, stack.id))}`);

  if (!build.success || !smokeSuccess) process.exit(1);
};

await main();
