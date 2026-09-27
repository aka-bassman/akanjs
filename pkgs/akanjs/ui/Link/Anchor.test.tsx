import "../../test/registerDom";
import { beforeAll, describe, expect, mock, test } from "bun:test";
import { mount, setTestEnv } from "../testHelpers.fixture";

let SsrLink: typeof import("./Anchor").SsrLink;

beforeAll(async () => {
  setTestEnv("linktest");
  const { registerClientRuntime } = await import("akanjs/client");
  registerClientRuntime({ usePage: () => ({ path: "/", lang: "en", l: (key: string) => key }) } as never);
  ({ SsrLink } = await import("./Anchor"));
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
