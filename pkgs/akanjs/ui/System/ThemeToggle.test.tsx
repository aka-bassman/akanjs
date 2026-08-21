import "../../test/registerDom";
import { beforeAll, describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot } from "react-dom/client";

let ThemeToggle: typeof import("./ThemeToggle").ThemeToggle;
let lib: typeof import("use-agentic");

/** Imported after the environment is set: `akanjs/store`'s baseSt reads the env while the module evaluates. */
beforeAll(async () => {
  process.env.AKAN_PUBLIC_APP_NAME = "themetest";
  process.env.AKAN_PUBLIC_REPO_NAME = "themetest";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";
  ({ ThemeToggle } = await import("./ThemeToggle"));
  lib = await import("use-agentic");
});

describe("ThemeToggle agent surface", () => {
  test("publishes the theme and a setTheme tool the agent can drive, withdrawn on unmount", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(<ThemeToggle themes={["light", "dark"]} />));
    const surface = lib.AgenticSurface.shared;
    const snapshot = surface.snapshot();
    expect(snapshot.tools.map((tool) => tool.name)).toContain("setTheme");
    expect(snapshot.resources.map((resource) => resource.name)).toContain("theme");
    await act(async () => {
      await surface.call("setTheme", { theme: "dark" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(surface.read("theme")).toBe("dark");
    await expect(surface.call("setTheme", { theme: "solarized" })).rejects.toThrow("Unknown theme");
    act(() => root.unmount());
    expect(surface.snapshot().tools.map((tool) => tool.name)).not.toContain("setTheme");
  });
});
