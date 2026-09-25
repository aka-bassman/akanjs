import os from "node:os";
import { MemoryLimit } from "akanjs/server/memoryLimit";

export interface DevBootBudget {
  memoryBytes: number;
  cores: number;
}

export interface DevBootConcurrencyPlan {
  concurrency: number;
  reason: string;
}

/**
 * How many apps `akan start` boots at the same time when the session did not name a number.
 *
 * A cold boot build is the builder's RSS peak, so booting n apps at once is n overlapping peaks —
 * measured at ~900MB per app on this repo (`@akanjs/devkit/DEV_RUNTIME_KNOBS.md`), which is what
 * OOM-kills a small container that would have been fine with them staggered. So the default spends
 * half the machine on those peaks, and never asks for more cores than the boot builds can use.
 *
 * `os.freemem()` is deliberately not consulted: it counts free pages rather than reclaimable ones, so
 * a 48GB laptop reports ~0.3GB and every machine would be pinned to one app at a time.
 */
export class DevBootConcurrency {
  /** Right after boot, per app: builder ~600MB, dev host ~100MB, RSC worker ~190MB, backend ~35MB. */
  static readonly perAppBytes = 900 * 1024 * 1024;
  /** The other half is the editor, the browser, and whatever else the session was already running. */
  static readonly memoryShare = 0.5;
  /** A dev host is a builder, an RSC worker and a backend, and the boot build is the CPU-hungry one. */
  static readonly coresPerApp = 4;

  static budget(): DevBootBudget {
    const hostBytes = os.totalmem();
    const declaredBytes = MemoryLimit.parseBytesEnv("AKAN_MEMORY_LIMIT") ?? MemoryLimit.readCgroupBytes();
    //? AKAN_MEMORY_LIMIT is a per-process ceiling rather than a session budget, but a session cannot
    //? outgrow the container it runs in either, so the smaller of the two is the only safe reading.
    return { memoryBytes: Math.min(hostBytes, declaredBytes ?? hostBytes), cores: os.availableParallelism() };
  }

  static resolve(
    appCount: number,
    requested: number | null,
    budget: DevBootBudget = DevBootConcurrency.budget(),
  ): DevBootConcurrencyPlan {
    const apps = Math.max(1, Math.trunc(appCount));
    if (requested !== null && Number.isFinite(requested)) {
      const asked = Math.max(1, Math.trunc(requested));
      return { concurrency: Math.min(apps, asked), reason: `--concurrency ${asked}` };
    }
    const byMemory = Math.floor((budget.memoryBytes * DevBootConcurrency.memoryShare) / DevBootConcurrency.perAppBytes);
    const byCores = Math.floor(budget.cores / DevBootConcurrency.coresPerApp);
    return {
      concurrency: Math.max(1, Math.min(apps, byMemory, byCores)),
      reason: `${budget.cores} cores, ${DevBootConcurrency.#formatBytes(budget.memoryBytes)} memory`,
    };
  }

  static describe(appCount: number, plan: DevBootConcurrencyPlan) {
    if (plan.concurrency >= appCount) return `booting all ${appCount} apps at once (${plan.reason})`;
    return `booting ${plan.concurrency} of ${appCount} apps at a time (${plan.reason}) — --concurrency raises it`;
  }

  static #formatBytes(bytes: number) {
    const gigabytes = bytes / 1024 ** 3;
    return gigabytes >= 10 ? `${Math.round(gigabytes)}GB` : `${gigabytes.toFixed(1)}GB`;
  }
}
