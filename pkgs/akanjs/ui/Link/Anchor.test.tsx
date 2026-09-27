import "../../test/registerDom";
import { beforeAll, describe, expect, mock, test } from "bun:test";
import { mount, setTestEnv } from "../testHelpers.fixture";

let SsrLink: typeof import("./Anchor").SsrLink;
let Link: typeof import("./index").Link;

beforeAll(async () => {
  setTestEnv("linktest");
  const { registerClientRuntime } = await import("akanjs/client");
  registerClientRuntime({ usePage: () => ({ path: "/", lang: "en", l: (key: string) => key }) } as never);
  ({ SsrLink } = await import("./Anchor"));
  ({ Link } = await import("./index"));
});

describe("SsrLink", () => {
  test("keeps the caller's anchor props on a #hash href", () => {
    const onClick = mock(() => undefined);
    const { container, unmount } = mount(
      <SsrLink href="#usage" target="_self" aria-label="Usage" onClick={onClick}>
        Usage
      </SsrLink>,
    );
    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("href")).toBe("#usage");
    expect(anchor?.getAttribute("target")).toBe("_self");
    expect(anchor?.getAttribute("aria-label")).toBe("Usage");
    anchor?.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    unmount();
  });
});

describe("Link", () => {
  test("a disabled link renders a div that keeps the caller's attributes and none of the link-only props", () => {
    const originalError = console.error;
    const errors = mock(() => undefined);
    console.error = errors;
    try {
      const { container, unmount } = mount(
        <Link
          disabled
          href="/docs"
          className="c"
          aria-label="Docs"
          scrollToTop
          replace
          activeClassName="a"
          activeExact
          noCache
        >
          Docs
        </Link>,
      );
      const div = container.querySelector("div");
      expect(div?.getAttributeNames().sort()).toEqual(["aria-label", "class"]);
      expect(errors).not.toHaveBeenCalled();
      unmount();
    } finally {
      console.error = originalError;
    }
  });
});
