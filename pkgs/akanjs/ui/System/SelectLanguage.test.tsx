import "../../test/registerDom";
import { beforeAll, describe, expect, test } from "bun:test";
import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";

let SelectLanguage: typeof import("./SelectLanguage").SelectLanguage;
let lib: typeof import("use-agentic");

/** Imported after the environment is set: `akanjs/store`'s baseSt reads the env while the module evaluates. */
beforeAll(async () => {
  process.env.AKAN_PUBLIC_APP_NAME = "selectlanguagetest";
  process.env.AKAN_PUBLIC_REPO_NAME = "selectlanguagetest";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";
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
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  const tool = lib.AgenticSurface.shared.snapshot().tools.find((tool) => tool.name === "setLanguage");
  act(() => root.unmount());
  container.remove();
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
