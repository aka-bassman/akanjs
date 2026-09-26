import { describe, expect, test } from "bun:test";

describe("rsc worker boot", () => {
  test("links under the react-server condition, where react exports no client API", async () => {
    // Under react-server `react` has no hooks/createContext, so a client import is a link-time SyntaxError that
    // neither typecheck nor build sees (both resolve react normally), and Bun ignores `"use client"`.
    const proc = Bun.spawn([process.execPath, "--conditions", "react-server", `${import.meta.dir}/rscWorker.tsx`], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    const stderr = await new Response(proc.stderr).text();
    await proc.exited;

    // Asserting on a crash, deliberately: reaching the ipc guard proves the whole module graph linked.
    expect(stderr).toContain("must be run as a Bun subprocess with ipc enabled");
  });
});
