import { describe, expect, test } from "bun:test";
import { Any, dayjs, enumOf, ID, Int, Upload } from "akanjs/base";
import { via } from "akanjs/constant";
import { AgentValue } from "./AgentValue";

const ReadableNote = via((f) => ({
  title: f(String),
  secretMemo: f.secret(String).optional(),
}));

class ReadableMode extends enumOf("agentValueMode", ["fit", "fill"] as const) {}

describe("AgentValue.serialize", () => {
  test("scalars and enums pass through, arrays element by element", () => {
    expect(AgentValue.serialize(String, "info")).toBe("info");
    expect(AgentValue.serialize(Int, 3)).toBe(3);
    expect(AgentValue.serialize(Boolean, false)).toBe(false);
    expect(AgentValue.serialize(ReadableMode, "fit")).toBe("fit");
    expect(AgentValue.serialize([Int], [1, 2, 3])).toEqual([1, 2, 3]);
    expect(AgentValue.serialize(ID, null)).toBeNull();
    expect(AgentValue.serialize(ID, undefined)).toBeUndefined();
  });

  test("a date leaves as an ISO string whichever carrier it arrived in", () => {
    expect(AgentValue.serialize(Date, new Date("2026-08-19T00:00:00.000Z"))).toBe("2026-08-19T00:00:00.000Z");
    expect(AgentValue.serialize(Date, dayjs("2026-08-19T00:00:00.000Z"))).toBe("2026-08-19T00:00:00.000Z");
    expect(AgentValue.serialize(Date, "nonsense")).toBeNull();
  });

  test("a model type strips what the model marks secret, spread copies included", () => {
    const value = { title: "hello", secretMemo: "do not ship" };
    expect(AgentValue.serialize(ReadableNote, value)).toEqual({ title: "hello" });
    expect(AgentValue.serialize([ReadableNote], [value])).toEqual([{ title: "hello" }]);
  });

  test("Any passes the value untouched — the escape hatch is not a mask", () => {
    const payload = { progress: 0.4, nested: { secretMemo: "kept" } };
    expect(AgentValue.serialize(Any, payload)).toBe(payload);
  });
});

describe("AgentValue.publishable", () => {
  test("a type nothing can read is reported and unpublished, never thrown", () => {
    const errors: string[] = [];
    const error = console.error;
    console.error = (message: unknown) => errors.push(String(message));
    try {
      expect(AgentValue.publishable('st.expose("job")', Map as never)).toBe(false);
      expect(AgentValue.publishable('st.expose("file")', Upload)).toBe(false);
      expect(AgentValue.publishable('st.expose("note")', ReadableNote)).toBe(true);
    } finally {
      console.error = error;
    }
    expect(errors[0]).toBe(
      'st.expose("job") is not published: its type is the type Map, and a readable value is a scalar, an enum, a model, or Any.',
    );
    expect(errors[1]).toBe(
      'st.expose("file") is not published: its type is the scalar Upload, which an agent cannot read.',
    );
  });
});
