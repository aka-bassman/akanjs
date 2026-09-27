import "../../test/registerDom";
import { beforeAll, describe, expect, mock, test } from "bun:test";
import { act } from "react";
import { AgenticSurface, AgentProvider } from "use-agentic";
import { l, mountAsync, setTestEnv } from "../testHelpers.fixture";

let Dialog: typeof import("./index").Dialog;

beforeAll(async () => {
  setTestEnv("dialogtest");
  const { registerClientRuntime } = await import("akanjs/client");
  registerClientRuntime({ usePage: () => ({ path: "/", lang: "en", l }), fetch: {} } as never);
  ({ Dialog } = await import("./index"));
});

const settle = async () => {
  for (let i = 0; i < 40; i += 1)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
};

describe("Dialog agent surface", () => {
  test("the agent's close takes the same path the X button takes, so onCancel still runs", async () => {
    const surface = new AgenticSurface();
    const onCancel = mock(() => undefined);
    const { unmount } = await mountAsync(
      <AgentProvider surface={surface}>
        <Dialog namespace="review" defaultOpen>
          <Dialog.Modal onCancel={onCancel}>
            <div>body</div>
          </Dialog.Modal>
        </Dialog>
      </AgentProvider>,
    );

    expect(surface.read("dialogInReview")).toBe(true);
    await act(async () => {
      await surface.call("closeDialogInReview", {});
    });
    await settle();

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(surface.read("dialogInReview")).toBe(false);
    unmount();
  });

  test("a dialog that guards its dismissal guards it against the agent too", async () => {
    const surface = new AgenticSurface();
    const onCancel = mock(() => undefined);
    const confirm = mock(() => false);
    const original = window.confirm;
    window.confirm = confirm as unknown as typeof window.confirm;
    try {
      const { unmount } = await mountAsync(
        <AgentProvider surface={surface}>
          <Dialog namespace="review" defaultOpen>
            <Dialog.Modal onCancel={onCancel} confirmClose>
              <div>body</div>
            </Dialog.Modal>
          </Dialog>
        </AgentProvider>,
      );

      await act(async () => {
        await surface.call("closeDialogInReview", {});
      });
      await settle();

      expect(confirm).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
      expect(surface.read("dialogInReview")).toBe(true);
      unmount();
    } finally {
      window.confirm = original;
    }
  });
});
