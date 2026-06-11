import { round, sleep } from "./lib";

interface AkanMetricsResponse {
  gateway?: { rssBytes?: number; cpuUserMicros?: number; cpuSystemMicros?: number; eventLoopLagP99Ms?: number };
  proxyHop?: { meanMs?: number; maxMs?: number } | null;
  children?: Array<{
    metrics?: { rssBytes?: number; eventLoopLagP99Ms?: number; trace?: unknown };
  }>;
}

export interface ResourceSummary {
  maxRssMb: number | null;
  avgRssMb: number | null;
  peakCpuPct: number | null;
  eventLoopLagP99Ms: number | null;
  proxyHopMeanMs?: number | null;
  samples: number;
  trace?: unknown;
}

/**
 * Samples process resource usage during a load run. For akanjs targets it polls the
 * gateway metrics endpoint (sums gateway + child RSS, captures event-loop lag and the
 * trace snapshot). For single-process competitors it shells out to `ps`.
 */
export class ResourceSampler {
  #timer: ReturnType<typeof setInterval> | null = null;
  #rssSamples: number[] = [];
  #cpuSamples: number[] = [];
  #lagSamples: number[] = [];
  #proxyHop: number[] = [];
  #lastTrace: unknown;

  constructor(private readonly opts: { pid?: number; metricsUrl?: string; intervalMs?: number }) {}

  start(): void {
    if (this.#timer) return;
    const interval = this.opts.intervalMs ?? 1_000;
    this.#timer = setInterval(() => void this.#sample(), interval);
  }

  async #sample(): Promise<void> {
    if (this.opts.metricsUrl) await this.#sampleAkan();
    else if (this.opts.pid) await this.#samplePs(this.opts.pid);
  }

  async #sampleAkan(): Promise<void> {
    try {
      const res = await fetch(this.opts.metricsUrl as string, { signal: AbortSignal.timeout(2_000) });
      if (!res.ok) return;
      const data = (await res.json()) as AkanMetricsResponse;
      let rss = data.gateway?.rssBytes ?? 0;
      let lag = data.gateway?.eventLoopLagP99Ms ?? 0;
      for (const child of data.children ?? []) {
        rss += child.metrics?.rssBytes ?? 0;
        lag = Math.max(lag, child.metrics?.eventLoopLagP99Ms ?? 0);
        // Workers report metrics on an interval, so keep the richest trace seen (most
        // endpoints) rather than the latest, which can be a pre-load empty snapshot.
        const trace = child.metrics?.trace as { endpoints?: unknown[] } | undefined;
        if (trace?.endpoints?.length) {
          const prev = this.#lastTrace as { endpoints?: unknown[] } | undefined;
          if (!prev?.endpoints?.length || trace.endpoints.length >= prev.endpoints.length) this.#lastTrace = trace;
        }
      }
      if (rss) this.#rssSamples.push(rss / 1024 / 1024);
      if (lag) this.#lagSamples.push(lag);
      if (data.proxyHop?.meanMs != null) this.#proxyHop.push(data.proxyHop.meanMs);
    } catch {
      // metrics endpoint not ready / transient
    }
  }

  async #samplePs(pid: number): Promise<void> {
    try {
      const proc = Bun.spawn(["ps", "-o", "rss=,%cpu=", "-p", String(pid)], { stdout: "pipe", stderr: "ignore" });
      const out = (await new Response(proc.stdout).text()).trim();
      await proc.exited;
      if (!out) return;
      const [rssKb, cpu] = out.split(/\s+/).map(Number);
      if (rssKb) this.#rssSamples.push(rssKb / 1024);
      if (Number.isFinite(cpu)) this.#cpuSamples.push(cpu);
    } catch {
      // process may have exited
    }
  }

  async stop(): Promise<ResourceSummary> {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = null;
    await sleep(50);
    const max = (arr: number[]) => (arr.length ? Math.max(...arr) : null);
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    const p99 = (arr: number[]) => {
      if (!arr.length) return null;
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.min(sorted.length - 1, Math.floor(0.99 * sorted.length))];
    };
    return {
      maxRssMb: round(max(this.#rssSamples)),
      avgRssMb: round(avg(this.#rssSamples)),
      peakCpuPct: round(max(this.#cpuSamples)),
      eventLoopLagP99Ms: round(p99(this.#lagSamples)),
      proxyHopMeanMs: this.#proxyHop.length ? round(avg(this.#proxyHop)) : null,
      samples: this.#rssSamples.length,
      trace: this.#lastTrace,
    };
  }
}
