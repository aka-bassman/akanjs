import { describe, expect, test } from "bun:test";
import { type TunnelHeaderList, tunnelWireContract, tunnelWsPayload } from "./tunnelWire";

describe("tunnelWireContract headers", () => {
  /**
   * Also the canary for the runtime behaviour this relies on: `Headers.forEach` yields `set-cookie` one at a
   * time while combining every other repeat. If a Bun release ever stops doing that, this test fails before a
   * tunnelled sign-in starts dropping cookies in production.
   */
  test("carries every set-cookie across, which a record keyed by name could not", () => {
    const headers = new Headers();
    headers.append("set-cookie", "jwt=a; Path=/");
    headers.append("set-cookie", "refresh=b; Path=/");
    headers.append("content-type", "text/html");

    const list = tunnelWireContract.headerList(headers);
    expect(list.filter(([name]) => name === "set-cookie")).toHaveLength(2);
    expect(tunnelWireContract.headersOf(list).getSetCookie()).toEqual(["jwt=a; Path=/", "refresh=b; Path=/"]);
  });

  test("strips hop-by-hop names in both directions", () => {
    const headers = new Headers({
      connection: "upgrade",
      upgrade: "websocket",
      "transfer-encoding": "chunked",
      host: "code.tunnel.akanjs.com",
    });

    expect(tunnelWireContract.headerList(headers)).toEqual([["host", "code.tunnel.akanjs.com"]]);
    const smuggled: TunnelHeaderList = [
      ["connection", "close"],
      ["x-forwarded-host", "code.tunnel.akanjs.com"],
    ];
    expect([...tunnelWireContract.headersOf(smuggled).keys()]).toEqual(["x-forwarded-host"]);
  });

  test("isHopByHop reads the name case-insensitively", () => {
    expect(tunnelWireContract.isHopByHop("Transfer-Encoding")).toBe(true);
    expect(tunnelWireContract.isHopByHop("x-forwarded-for")).toBe(false);
  });
});

describe("tunnelWireContract.stripForwarded", () => {
  test("deletes what the public caller claimed, so the gateway's own value is the only one", () => {
    const headers = new Headers({
      "x-forwarded-host": "attacker.example",
      "x-forwarded-for": "10.0.0.1",
      forwarded: "host=attacker.example",
      "x-real-ip": "10.0.0.1",
      cookie: "jwt=a",
    });

    tunnelWireContract.stripForwarded(headers);
    headers.set("x-forwarded-host", "code.tunnel.akanjs.com");

    // `hostFromRequest` reads the first comma-separated value, so appending instead of deleting would have left
    // the caller's host ahead of the gateway's and handed the app an origin the caller chose.
    expect(headers.get("x-forwarded-host")).toBe("code.tunnel.akanjs.com");
    expect(headers.get("forwarded")).toBeNull();
    expect(headers.get("x-real-ip")).toBeNull();
    expect(headers.get("cookie")).toBe("jwt=a");
  });
});

describe("tunnelWireContract frame sizing", () => {
  test("a frame ceiling that clears the largest inner websocket message an app can send", () => {
    expect(tunnelWireContract.maxFrameBytes).toBeGreaterThan(16 * 1024 * 1024 + 1);
    expect(tunnelWireContract.chunkBytes).toBeLessThan(tunnelWireContract.maxFrameBytes);
  });
});

describe("tunnelWireContract websocket payloads", () => {
  test("round-trips an inner message through the one-byte prefix", () => {
    const body = new TextEncoder().encode('{"key":"roomKey"}');
    const framed = tunnelWireContract.encodeWsPayload(tunnelWsPayload.text, body);

    expect(framed[0]).toBe(tunnelWsPayload.text);
    const decoded = tunnelWireContract.decodeWsPayload(framed);
    expect(decoded?.kind).toBe(tunnelWsPayload.text);
    expect(new TextDecoder().decode(decoded?.data)).toBe('{"key":"roomKey"}');
  });

  test("an empty or unknown frame decodes to null rather than a guess", () => {
    expect(tunnelWireContract.decodeWsPayload(new Uint8Array())).toBeNull();
    expect(tunnelWireContract.decodeWsPayload(new Uint8Array([9, 1, 2]))).toBeNull();
  });

  test("a zero-length inner message keeps its kind", () => {
    const framed = tunnelWireContract.encodeWsPayload(tunnelWsPayload.binary, new Uint8Array());
    expect(tunnelWireContract.decodeWsPayload(framed)).toEqual({
      kind: tunnelWsPayload.binary,
      data: framed.subarray(1),
    });
  });
});

describe("tunnelWireContract.parseFrame", () => {
  test("reads a framed control message", () => {
    expect(tunnelWireContract.parseFrame('{"type":"ping","at":1}')).toEqual({ type: "ping", at: 1 });
  });

  test("refuses anything that is not a typed frame", () => {
    expect(tunnelWireContract.parseFrame("not json")).toBeNull();
    expect(tunnelWireContract.parseFrame('"a string"')).toBeNull();
    expect(tunnelWireContract.parseFrame('{"at":1}')).toBeNull();
    expect(tunnelWireContract.parseFrame("null")).toBeNull();
  });
});
