import { type LogRecord, logSeverity } from "akanjs/common";

export const makeLogRecord = (message: string, overrides: Partial<LogRecord> = {}): LogRecord => ({
  at: 1_000,
  elapsedMs: 0,
  level: "info",
  sev: logSeverity.info,
  name: "Svc",
  context: "",
  message,
  stream: "stdout",
  pid: 1,
  replicaIdx: 0,
  role: "all",
  origin: null,
  traceId: null,
  endpoint: null,
  ...overrides,
});
