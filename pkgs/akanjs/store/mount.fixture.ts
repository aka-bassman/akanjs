import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

export const mount = (node: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  return () => {
    act(() => root.unmount());
    container.remove();
  };
};
