import { act, type ReactNode, Suspense } from "react";
import { createRoot } from "react-dom/client";

/** Call before importing `akanjs/client` or `akanjs/store`: both read the env while the module evaluates. */
export const setTestEnv = (appName: string) => {
  process.env.AKAN_PUBLIC_APP_NAME = appName;
  process.env.AKAN_PUBLIC_REPO_NAME = appName;
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";
};

export const l = Object.assign((key: string) => key, {
  _: (key: string) => key,
  rich: (key: string) => key,
  trans: (translation: Record<string, string>) => translation.en,
});

export const mountSuspense = async (node: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<Suspense>{node}</Suspense>);
  });
  return { container, unmount: () => act(() => root.unmount()) };
};

export const waitFor = async (done: () => boolean) => {
  for (let i = 0; i < 200 && !done(); i += 1)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
};
