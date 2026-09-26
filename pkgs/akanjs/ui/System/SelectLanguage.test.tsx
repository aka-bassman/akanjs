import "../../test/registerDom";
import { beforeAll, describe, expect, test } from "bun:test";
import type { ReactElement } from "react";
import { mount, setTestEnv } from "../testHelpers.fixture";

let SelectLanguage: typeof import("./SelectLanguage").SelectLanguage;
let lib: typeof import("use-agentic");

beforeAll(async () => {
  setTestEnv("selectlanguagetest");
  process.env.AKAN_PUBLIC_LOCALES = "en,ko,ja";
  process.env.AKAN_PUBLIC_DEFAULT_LOCALE = "en";
  const { registerClientRuntime } = await import("akanjs/client");
  registerClientRuntime({
    usePage: () => ({ path: "/", lang: "en", l: Object.assign((key: string) => key, { _: (key: string) => key }) }),
    fetch: { sortKeyMap: new Map() },
  } as never);
  ({ SelectLanguage } = await import("./SelectLanguage"));
  lib = await import("use-agentic");
});

const offered = (node: ReactElement) => {
  const { unmount } = mount(node);
  const tool = lib.AgenticSurface.shared.snapshot().tools.find((tool) => tool.name === "setLanguage");
  unmount();
  const properties = tool?.parameters?.properties as { language?: { enum?: string[] } } | undefined;
  return properties?.language?.enum;
};

describe("SelectLanguage", () => {
  test("offers every configured locale, display name or not", () => {
    expect(offered(<SelectLanguage />)).toEqual(["en", "ko", "ja"]);
  });

  test("drops a requested locale the app never configured", () => {
    expect(offered(<SelectLanguage languages={["en", "fr"]} />)).toEqual(["en"]);
  });
});
