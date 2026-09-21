import { Console } from "node:console";

/**
 * Sends every `console.*` call in this process to stderr, so stdout carries the RPC protocol and nothing else.
 *
 * The engine already installs a guard that rewrites `process.stdout.write`, which is enough on Node because
 * `console.log` routes through it there. Bun's global `console` is native and writes to fd 1 directly, so it
 * sails straight past that guard and corrupts the JSONL stream — measured: 203 non-JSON lines in one turn that
 * logged while a tool ran.
 *
 * **This is a side-effect module and must be the first import of any RPC entry.** An assignment written beside
 * the static imports would run *after* them: ESM hoists imports and evaluates those modules first, so anything
 * the engine logs at module-evaluation time would already have escaped.
 */
globalThis.console = new Console({
  stdout: process.stderr,
  stderr: process.stderr,
}) as unknown as typeof globalThis.console;
