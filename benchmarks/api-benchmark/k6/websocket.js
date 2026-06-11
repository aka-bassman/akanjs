import ws from "k6/ws";
import { check } from "k6";
import { Trend, Counter } from "k6/metrics";

/**
 * WebSocket load: connection scaling + echo round-trip latency. This is a portable
 * proxy for realtime throughput across frameworks. For akanjs-specific pubsub fan-out
 * (1 publisher to N subscribers), point WS_URL at the app's `/api/ws` and set
 * SUBSCRIBE_MSG to the room subscription frame; see README "WebSocket surface".
 *
 * Env:
 *   WS_URL          ws://127.0.0.1:PORT/path
 *   VUS             concurrent connections
 *   DURATION        hold duration
 *   MSG_PER_CONN    messages each connection sends (echo round-trips)
 *   SUBSCRIBE_MSG   optional JSON frame sent on open (e.g. pubsub subscribe)
 *   ECHO_MSG        message body to send (default {"ping":<ts>})
 *   RESULT_FILE     where handleSummary writes JSON
 */

const WS_URL = __ENV.WS_URL || "ws://127.0.0.1:4001/ws";
const VUS = Number(__ENV.VUS || 100);
const DURATION = __ENV.DURATION || "30s";
const MSG_PER_CONN = Number(__ENV.MSG_PER_CONN || 50);
const SUBSCRIBE_MSG = __ENV.SUBSCRIBE_MSG || "";

const rtt = new Trend("ws_rtt_ms", true);
const received = new Counter("ws_messages_received");
const connErrors = new Counter("ws_connect_errors");

export const options = {
  scenarios: {
    main: { executor: "constant-vus", vus: VUS, duration: DURATION },
  },
};

export default function () {
  const res = ws.connect(WS_URL, {}, (socket) => {
    let sent = 0;
    socket.on("open", () => {
      if (SUBSCRIBE_MSG) socket.send(SUBSCRIBE_MSG);
      socket.send(JSON.stringify({ ping: Date.now() }));
      sent++;
    });
    socket.on("message", (msg) => {
      received.add(1);
      try {
        const parsed = JSON.parse(msg);
        if (typeof parsed.ping === "number") rtt.add(Date.now() - parsed.ping);
      } catch (_e) {
        // non-JSON frames (e.g. acks) are counted but not timed
      }
      if (sent < MSG_PER_CONN) {
        socket.send(JSON.stringify({ ping: Date.now() }));
        sent++;
      } else {
        socket.close();
      }
    });
    socket.on("error", () => connErrors.add(1));
    socket.setTimeout(() => socket.close(), 60_000);
  });
  check(res, { "ws connected (101)": (r) => r && r.status === 101 });
}

export function handleSummary(data) {
  const r = data.metrics.ws_rtt_ms ? data.metrics.ws_rtt_ms.values : {};
  const recv = data.metrics.ws_messages_received ? data.metrics.ws_messages_received.values : {};
  const errs = data.metrics.ws_connect_errors ? data.metrics.ws_connect_errors.values : {};
  const summary = {
    surface: "websocket",
    wsUrl: WS_URL,
    connections: VUS,
    messagesReceived: recv.count ?? 0,
    msgPerSec: recv.rate ?? 0,
    connectErrors: errs.count ?? 0,
    rttMs: {
      avg: round(r.avg),
      p90: round(r["p(90)"]),
      p99: round(r["p(99)"]),
      max: round(r.max),
    },
  };
  const out = { stdout: `\n[websocket] conns=${VUS} msg/s=${fmt(summary.msgPerSec)} rttP99=${fmt(summary.rttMs.p99)}ms errs=${summary.connectErrors}\n` };
  if (__ENV.RESULT_FILE) out[__ENV.RESULT_FILE] = JSON.stringify(summary, null, 2);
  return out;
}

function round(v) {
  return typeof v === "number" ? Math.round(v * 1000) / 1000 : null;
}
function fmt(v) {
  return typeof v === "number" ? v.toFixed(1) : "n/a";
}
