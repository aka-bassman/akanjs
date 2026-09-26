import { beforeAll, describe, expect, test } from "bun:test";
import type { SerializedArg, SerializedEndpoint } from "akanjs/signal";
import { makeRef, setTestEnv } from "../testHelpers";

let getExampleData: typeof import("./makeExample").getExampleData;
let makeResponseExample: typeof import("./makeExample").makeResponseExample;

beforeAll(async () => {
  setTestEnv("makeexampletest");
  const { Int } = await import("akanjs/base");
  const { ConstantRegistry, field } = await import("akanjs/constant");
  ({ getExampleData, makeResponseExample } = await import("./makeExample"));

  const ExampleInput = makeRef({
    name: field(String),
    prompts: field(Map, { of: String }),
    counts: field(Map, { of: [Int] as never }),
  });
  ConstantRegistry.buildModel(
    "mapExample",
    ExampleInput as never,
    ExampleInput as never,
    ExampleInput as never,
    ExampleInput as never,
    makeRef({ total: field(Int, { default: 0 }) }) as never,
    {},
  );
});

describe("Signal example data", () => {
  test("shapes a Map field as a string-keyed object of its value type", () => {
    const example = getExampleData([
      { name: "data", refName: "mapExample", modelType: "input", arrDepth: 0 } as SerializedArg,
    ]);
    expect(example.data).toEqual({ name: "String", prompts: { key: "String" }, counts: { key: [0] } });
  });

  test("shapes a Map field the same way in a response example", () => {
    const example = makeResponseExample({
      returns: { refName: "mapExample", modelType: "full", arrDepth: 0 },
    } as SerializedEndpoint);
    expect(example).toMatchObject({ prompts: { key: "String" }, counts: { key: [0] } });
  });
});
