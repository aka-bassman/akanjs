import { recipe, tv } from "akanjs/ui";

/** 전투기 시안(/testhome) 버튼 — burn 은 모서리를 깎은 애프터버너 주황 판, line 은 청사진 선만 두른 판, day 는 밝은 하늘 위의 잉크 판. */
export const flightButtonRecipe = recipe(
  tv({
    base: "inline-flex cursor-pointer select-none items-center justify-center gap-2.5 whitespace-nowrap font-semibold font-tech uppercase tracking-[0.14em] transition duration-200 active:translate-y-px",
    variants: {
      tone: {
        burn: "bg-burn text-primary-foreground shadow-[0_14px_40px_-14px_var(--burn)] [clip-path:polygon(0.75rem_0,100%_0,100%_calc(100%-0.75rem),calc(100%-0.75rem)_100%,0_100%,0_0.75rem)] hover:brightness-110",
        line: "bg-line/6 text-foreground ring-1 ring-line/35 ring-inset hover:bg-line/12 hover:ring-line/60",
        day: "bg-foreground text-background [clip-path:polygon(0.75rem_0,100%_0,100%_calc(100%-0.75rem),calc(100%-0.75rem)_100%,0_100%,0_0.75rem)] hover:bg-foreground/85",
      },
      size: { md: "h-11 px-5 text-sm", lg: "h-13 px-7 text-base" },
    },
    defaultVariants: { tone: "burn", size: "md" },
  }),
);
export type FlightButtonVariants = NonNullable<Parameters<typeof flightButtonRecipe>[0]>;
