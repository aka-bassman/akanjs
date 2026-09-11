import { AgentAbort } from "./AgentAbort";
import { AgentProgress, type AgentProgressReport } from "./AgentProgress";
import { ToolOutput } from "./ToolOutput";
import type { SurfaceView, ToolCallRequest, ToolCallResult, ToolEntry } from "./types";

export interface ToolApprovalRequest {
  callId: string;
  name: string;
  args: Record<string, unknown>;
  /** What the user is asked, already resolved from the entry's `confirm`. */
  message: string;
}

/** `report` is `null` once the call is over, carrying the id so a host can ignore a clear that is not its own. */
export interface ToolProgress {
  callId: string;
  report: AgentProgressReport | null;
}

/**
 * What a consumer of the runner has to answer for. Every field is optional and every omission is a narrowing,
 * never a widening: a host that cannot ask the user refuses the calls that need asking.
 */
export interface ToolRunnerHost {
  /**
   * Parks the call until the user decides — `true` runs it, a string is the refusal the model reads.
   *
   * Omitting it does **not** run the tool unasked. A tool reaches this only when its own declaration said a
   * person has to agree first (`confirm`, or a `remove*` name), so a host with nowhere to render the question is
   * a host that may not perform the action, and the refusal says so rather than silently downgrading the gate.
   */
  approve?: (request: ToolApprovalRequest, signal: AbortSignal) => Promise<true | string>;
  /**
   * Awaited after a tool that changed something and before its change report is taken. A surface is read
   * synchronously and a screen does not settle synchronously, so without this the report describes the moment
   * before the change landed.
   */
  settle?: () => Promise<void> | void;
  progress?: (progress: ToolProgress) => void;
  /**
   * Answers a name the surface does not carry — where a consumer puts a built-in of its own. Reached only after
   * the surface came up empty, so a registered tool of the same name shadows it.
   */
  fallback?: (call: ToolCallRequest, signal: AbortSignal) => Promise<ToolCallResult> | ToolCallResult;
}

/**
 * One tool call, start to finish: look the name up, gate it on the user, run it, wait for the screen, report what
 * changed, and bound what all of that may add to a transcript.
 *
 * It lives apart from `AgentSession` because the pipeline is not the conversation's — the same six steps have to
 * happen for any caller that drives this surface, and the steps that can be skipped are the ones that must not
 * be: an approval, a settle, a change report and an output ceiling are each invisible by absence. A second
 * consumer assembling them again would not fail, it would quietly do less, which is how the session and a zone
 * came to disagree about which options they honoured.
 */
export class ToolRunner {
  /**
   * Tool execution is serialized across every runner in the page, because `AgentAbort` and `AgentProgress` reach
   * the running call through a module slot rather than a parameter — two calls in flight restore each other's
   * slot and the second one's progress goes nowhere. Two agents on one screen (a zone and the root chat) are
   * already two callers, so the invariant those slots assume has to be kept somewhere they both pass through.
   *
   * A call that neither settles nor aborts holds the queue; every consumer races the call against its own abort
   * signal, and an abort releases it. Approval waits outside the queue on purpose — a question parked in front of
   * the user is not work, and holding the lock across it would let one agent's unanswered card freeze the other's.
   */
  static #queue: Promise<void> = Promise.resolve();

  readonly #surface: SurfaceView;
  readonly #host: ToolRunnerHost;

  constructor(surface: SurfaceView, host: ToolRunnerHost = {}) {
    this.#surface = surface;
    this.#host = host;
  }

  /** Never throws: a refused guard, a declined approval and an unknown name are all results the model reads. */
  async run(call: ToolCallRequest, signal: AbortSignal): Promise<ToolCallResult> {
    // Bounded here, at the one place a tool's answer is produced, because from here on it rides every later turn.
    return ToolOutput.clipped(await this.#answer(call, signal));
  }

  async #answer(call: ToolCallRequest, signal: AbortSignal): Promise<ToolCallResult> {
    const base = { id: call.id, name: call.name };
    const entry = this.#surface.tool(call.name);
    if (!entry) {
      const fallback = this.#host.fallback;
      return fallback ? await fallback(call, signal) : { ...base, error: `Unknown tool: ${call.name}` };
    }
    const message = ToolRunner.confirmMessage(call.name, entry, call.args);
    if (message) {
      const approve = this.#host.approve;
      if (!approve)
        return { ...base, error: `${call.name} needs the user's approval, and nothing here can ask them for it.` };
      const approved = await approve({ callId: call.id, name: call.name, args: call.args, message }, signal);
      if (approved !== true) return { ...base, error: approved };
    }
    return await ToolRunner.#serialized(() => this.#execute(call, entry, signal));
  }

  async #execute(call: ToolCallRequest, entry: ToolEntry, signal: AbortSignal): Promise<ToolCallResult> {
    const base = { id: call.id, name: call.name };
    const before = this.#surface.snapshot();
    try {
      const result = await AgentAbort.run(signal, () =>
        AgentProgress.run(
          (report) => this.#host.progress?.({ callId: call.id, report }),
          () => ToolRunner.raced(this.#surface.call(call.name, call.args), signal),
        ),
      );
      // A read returns what is already there; anything else may still be landing, and a report taken now would
      // describe the screen as it was one tick before the call.
      if (entry.settle !== false) await this.#host.settle?.();
      const changes = this.#surface.diffSince(before);
      return {
        ...base,
        ...(result !== undefined ? { result } : {}),
        ...(changes.length ? { changes } : {}),
      };
    } catch (error) {
      return { ...base, error: error instanceof Error ? error.message : String(error) };
    } finally {
      this.#host.progress?.({ callId: call.id, report: null });
    }
  }

  static #serialized<T>(work: () => Promise<T>): Promise<T> {
    const run = ToolRunner.#queue.then(work);
    ToolRunner.#queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  /**
   * The call, or the abort — whichever lands first.
   *
   * A tool is handed the signal through `AgentAbort` and may stop itself, but nothing obliges it to, and a tool
   * that waits on a two-minute job is exactly the one a user reaches for Stop during. Without this race the
   * caller stays parked inside the call for those two minutes with the chat still showing a turn in flight.
   *
   * The losing promise is left running rather than cancelled: the work is usually a job a server is already
   * doing, and throwing away a result that is about to land helps nobody. Both of its outcomes are handled here,
   * so a late failure settles nothing instead of surfacing as an unhandled rejection.
   */
  static raced<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const onAbort = () => reject(new Error("The user aborted the turn."));
      work.then(
        (value) => {
          signal.removeEventListener("abort", onAbort);
          resolve(value);
        },
        (error: unknown) => {
          signal.removeEventListener("abort", onAbort);
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
      if (signal.aborted) onAbort();
      else signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  /** `null` when this call needs no asking — an absent `confirm`, or one that decided against it per arguments. */
  static confirmMessage(name: string, entry: ToolEntry, args: Record<string, unknown>): string | null {
    const confirm = entry.confirm;
    if (confirm === undefined || confirm === false) return null;
    if (typeof confirm === "string") return confirm;
    const verdict = confirm === true ? true : confirm(args);
    if (verdict === false) return null;
    return verdict === true ? `Run ${name}?` : verdict;
  }
}
