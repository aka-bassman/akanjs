import { describe, expect, test } from "bun:test";
import type { TunnelDataFromAgent } from "akanjs/common";
import { TunnelTcpStream } from "./TunnelTcpStream";

const serveBytes = (total: number) => {
  const payload = new Uint8Array(total).fill(7);
  const pump = (socket: Bun.Socket<{ offset: number }>) => {
    while (socket.data.offset < total) {
      const written = socket.write(payload.subarray(socket.data.offset));
      if (written <= 0) return;
      socket.data.offset += written;
    }
    socket.end();
  };
  return Bun.listen<{ offset: number }>({
    hostname: "127.0.0.1",
    port: 0,
    socket: {
      open: (socket) => {
        socket.data = { offset: 0 };
        pump(socket);
      },
      drain: pump,
      data: () => undefined,
    },
  });
};

describe("TunnelTcpStream", () => {
  test("waits for each payload to drain before reading more, and ends after the last one", async () => {
    const total = 2 * 1024 * 1024;
    const server = serveBytes(total);
    const events: string[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    let forwarded = 0;
    const stream = new TunnelTcpStream(
      { type: "open", streamId: "s1", kind: "tcp", hostname: "tunnel.test", port: server.port },
      {
        sendFrame: (frame: TunnelDataFromAgent) => events.push(frame.type),
        sendPayload: async (data) => {
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await Bun.sleep(1);
          forwarded += data.byteLength;
          events.push("payload");
          inFlight -= 1;
        },
        closeSocket: () => undefined,
      },
      "127.0.0.1",
    );
    try {
      await stream.run();
      expect(maxInFlight).toBe(1);
      expect(forwarded).toBe(total);
      expect(events[0]).toBe("head");
      expect(events.at(-1)).toBe("end");
      expect(events.filter((event) => event === "end").length).toBe(1);
    } finally {
      server.stop(true);
    }
  }, 20_000);
});
