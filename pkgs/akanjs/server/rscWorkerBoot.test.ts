import { describe, expect, test } from "bun:test";

describe("rsc worker boot", () => {
  test("links under the react-server condition, where react exports no client API", async () => {
    // The worker is the one process akan runs with `--conditions react-server`, and there `react` resolves to
    // `react.react-server.js`, which exports no `createContext` and no hooks. Any value import in its graph that
    // reaches one is a link-time `SyntaxError` before a single line runs — and neither `akan typecheck` nor
    // `akan build` reports it, because both resolve `react` the ordinary way. Bun's runtime does not honour the
    // `"use client"` directive either, so carrying it is no protection: the only thing that keeps the worker
    // bootable is that nothing in its graph imports a client module at all.
    const proc = Bun.spawn([process.execPath, "--conditions", "react-server", `${import.meta.dir}/rscWorker.tsx`], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    const stderr = await new Response(proc.stderr).text();
    await proc.exited;

    // Asserting on a crash, deliberately: reaching the ipc guard is how the worker reports that its whole module
    // graph linked. Anything else here is a broken graph — the stderr below names the export and the module.
    expect(stderr).toContain("must be run as a Bun subprocess with ipc enabled");
  });
});
