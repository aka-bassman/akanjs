import "../test/registerDom";
import { beforeAll, describe, expect, test } from "bun:test";
import { createRef } from "react";
import { mount, setTestEnv } from "./testHelpers.fixture";

let Input: typeof import("./Input").Input;

beforeAll(async () => {
  setTestEnv("inputtest");
  const { registerClientRuntime } = await import("akanjs/client");
  registerClientRuntime({ usePage: () => ({ path: "/", lang: "en", l: (key: string) => key }) } as never);
  ({ Input } = await import("./Input"));
});

describe("Input.TextArea", () => {
  test("attaches inputRef to the textarea instead of spreading it onto the DOM", () => {
    const inputRef = createRef<HTMLTextAreaElement>();
    const { container, unmount } = mount(<Input.TextArea inputRef={inputRef} value="memo" validate={() => true} />);
    const textarea = container.querySelector("textarea");
    expect(textarea).not.toBeNull();
    expect(inputRef.current).toBe(textarea);
    expect(textarea?.hasAttribute("inputref")).toBe(false);
    expect(textarea?.hasAttribute("inputRef")).toBe(false);
    unmount();
  });
});
