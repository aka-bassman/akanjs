import { appendFileSync } from "node:fs";
import type { ReactNode } from "react";
import type { Head } from "../client/csrTypes";
import { page } from "../client/route/routeBuilders";
import type { AkanHeadSnapshotV1 } from "./routeState";
import type { PagesContext } from "./routeTreeBuilder";

const headOf = (name: string) => () => {
  if (process.env.AKAN_TEST_HEAD_LOG) appendFileSync(process.env.AKAN_TEST_HEAD_LOG, `${name}\n`);
  return <title>{name}</title>;
};

const safeSnapshot: AkanHeadSnapshotV1 = { version: 1, nodes: [{ tag: "title", text: "safe" }] };

export const pages: PagesContext = {
  "./__root_layout.tsx": async () => ({ default: ({ children }: { children: ReactNode }) => children }),
  "./cached.tsx": async () => ({
    default: page()
      .head(headOf("cached"))
      .render(() => <p>cached body</p>),
  }),
  "./safe.tsx": async () => ({
    default: page()
      .config({ rscPatchHeadSafe: true })
      // No route stage produces a head snapshot today, and without one a patch always falls back to a full render.
      .head((() => ({ node: headOf("safe")(), headSnapshot: safeSnapshot })) as unknown as () => Head)
      .render(() => <p>safe body</p>),
  }),
};
