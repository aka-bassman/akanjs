import "../test/registerDom";
import { describe, expect, test } from "bun:test";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { triggerSlot } from "./triggerSlot";

const mount = async (node: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  return { container, unmount: () => act(() => root.unmount()) };
};

const click = async (element: Element) => {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};

describe("triggerSlot", () => {
  test("an element trigger carries the surface's click and attributes itself", async () => {
    let opened = 0;
    const { container, unmount } = await mount(
      triggerSlot(<button type="button">Open</button>, {
        className: "cursor-pointer",
        onClick: () => {
          opened += 1;
        },
        "data-akan-action": "openThing",
      }),
    );

    const button = container.querySelector("button");
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toBe(button);
    expect(button?.getAttribute("data-akan-action")).toBe("openThing");
    expect(button?.className).toBe("cursor-pointer");

    await click(button as Element);
    expect(opened).toBe(1);
    unmount();
  });

  test("the caller's own class and handler survive, and preventDefault withholds the surface's", async () => {
    const order: string[] = [];
    const { container, unmount } = await mount(
      triggerSlot(
        <button
          type="button"
          className="w-full"
          onClick={(event) => {
            order.push("caller");
            event.preventDefault();
          }}
        >
          Open
        </button>,
        {
          className: "cursor-pointer",
          onClick: () => order.push("surface"),
        },
      ),
    );

    const button = container.querySelector("button");
    expect(button?.className).toBe("cursor-pointer w-full");
    await click(button as Element);
    expect(order).toEqual(["caller"]);
    unmount();
  });

  test("a trigger that is not one element keeps a host of its own", async () => {
    let opened = 0;
    const { container, unmount } = await mount(
      triggerSlot(
        <>
          <span>a</span>
          <span>b</span>
        </>,
        {
          as: "span",
          className: "cursor-pointer",
          onClick: () => {
            opened += 1;
          },
        },
      ),
    );

    const host = container.firstElementChild;
    expect(host?.tagName).toBe("SPAN");
    expect(host?.children).toHaveLength(2);
    await click(host as Element);
    expect(opened).toBe(1);
    unmount();
  });
});
