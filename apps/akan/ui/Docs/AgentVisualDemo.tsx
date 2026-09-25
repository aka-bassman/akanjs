"use client";

import { st, usePage } from "@apps/akan/client";
import { Button } from "akanjs/ui";
import { useState } from "react";
import { panelRecipe } from "../Recipe";

/**
 * Two controls the in-page agent can actually press, so the ring and the pointer have something on this page to
 * land on. The rest of the docs site has nothing: its own tools are headless components that wire their callable
 * to no control, so they publish a tool and annotate no element.
 *
 * The buttons sit at opposite ends of the row on purpose — the pointer only glides when the hop is far enough to
 * be worth following, and two adjacent buttons would never show that.
 */
export const AgentVisualDemo = () => {
  const { l } = usePage();
  const [tally, setTally] = useState(0);
  const countUp = st
    .tool("addDemoTally")
    .desc("Add one to the demo tally on the In-Page Agent docs page.")
    .exec(() => setTally((count) => count + 1));
  const reset = st
    .tool("resetDemoTally")
    .desc("Set the demo tally on the In-Page Agent docs page back to zero.")
    .exec(() => setTally(0));
  return (
    <div className={panelRecipe({}, "flex w-full items-center justify-between gap-4")}>
      <Button size="sm" onClick={countUp}>
        {l.trans({ en: "Count up", ko: "하나 올리기" })}
      </Button>
      <div className="text-center">
        <div className="font-bold text-2xl text-foreground tabular-nums">{tally}</div>
        <div className="text-foreground/60 text-xs">{l.trans({ en: "demo tally", ko: "데모 카운트" })}</div>
      </div>
      <Button size="sm" variant="outline" onClick={reset}>
        {l.trans({ en: "Reset", ko: "초기화" })}
      </Button>
    </div>
  );
};
