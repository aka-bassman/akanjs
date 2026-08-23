import "../test/registerDom";
import { beforeAll, describe, expect, test } from "bun:test";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

let DefaultDropdown: typeof import("./Dropdown").DefaultDropdown;

beforeAll(async () => {
  process.env.AKAN_PUBLIC_APP_NAME = "dropdowntest";
  process.env.AKAN_PUBLIC_REPO_NAME = "dropdowntest";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";
  ({ DefaultDropdown } = await import("./Dropdown"));
});

const render = (content: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<DefaultDropdown value="More" content={content} />));
  const trigger = container.querySelector("button");
  if (!trigger) throw new Error("dropdown trigger did not render");
  act(() => trigger.click());
  const menu = document.querySelector("ul");
  if (!menu) throw new Error("dropdown menu did not render");
  return { container, root, trigger, menu };
};

describe("Dropdown", () => {
  test("renders the menu outside the trigger's subtree so no overflow ancestor clips it", () => {
    const { container, menu, root } = render(
      <li>
        <button type="button">Edit</button>
      </li>,
    );
    expect(menu.parentElement).toBe(document.body);
    expect(container.contains(menu)).toBe(false);
    expect(menu.hidden).toBe(false);
    expect(menu.style.position).toBe("fixed");
    act(() => root.unmount());
  });

  test("a click inside the portalled menu is not an outside click, and the item closes it", () => {
    const { menu, root } = render(
      <li>
        <button type="button">Edit</button>
      </li>,
    );
    const item = menu.querySelector("button");
    if (!item) throw new Error("menu item did not render");
    act(() => {
      item.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(menu.hidden).toBe(false);
    act(() => item.click());
    expect(menu.hidden).toBe(true);
    act(() => root.unmount());
  });

  test("a keep-open item leaves the menu open", () => {
    const { menu, root } = render(
      <li data-dropdown-keep-open="">
        <button type="button">Notify</button>
      </li>,
    );
    const item = menu.querySelector("button");
    if (!item) throw new Error("menu item did not render");
    act(() => item?.click());
    expect(menu.hidden).toBe(false);
    act(() => root.unmount());
  });
});
