import { recipe, tv } from "akanjs/ui";

/** 전투기 시안(/testhome) 도면 패널 — sheet 는 남색 도면지, glass 는 선만 비치는 판, day 는 밝은 하늘 위의 흰 판. ticks 는 네 모서리의 맞춤 표시. */
export const flightPanelRecipe = recipe(
  tv({
    base: "relative",
    variants: {
      tone: {
        sheet: "border border-line/15 bg-navy/80 backdrop-blur-sm",
        glass: "bg-line/4 ring-1 ring-line/12 ring-inset",
        day: "border border-border bg-card/85 shadow-[0_20px_50px_-30px_var(--line)] backdrop-blur-sm",
      },
      padding: { none: "", sm: "p-4", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" },
      ticks: { true: "flt-ticks" },
    },
    defaultVariants: { tone: "sheet", padding: "md" },
  }),
);
export type FlightPanelVariants = NonNullable<Parameters<typeof flightPanelRecipe>[0]>;
