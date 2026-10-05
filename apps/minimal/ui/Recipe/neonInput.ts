import { recipe, tv } from "akanjs/ui";

/**
 * 네온 입력 표면 스킨 — 프레임워크 inputRecipe 의 **look 교체용**.
 * kind/size/tone 표면을 inputRecipe 와 동일하게 유지해야 `recipes.input` 슬롯에 주입 가능하다
 * (Input/TextArea 가 이 슬롯으로 셸을 그리므로). 아래쪽 한 줄만 남긴 터미널풍 필드 + 포커스 글로우.
 * 높이는 field·select 에만 붙는다 — textarea 는 내용으로 자란다.
 */
export const neonInputRecipe = recipe(
  tv({
    base: "w-full rounded-none border-0 border-b-2 border-muted-foreground bg-transparent font-mono text-foreground transition focus:border-primary focus:shadow-[0_2px_10px_-4px] focus:shadow-primary/60 focus:outline-none",
    variants: {
      kind: {
        field: "px-2",
        area: "p-2",
        select:
          "appearance-none bg-[image:linear-gradient(to_top_right,transparent_50%,currentColor_50%,currentColor_calc(50%+2px),transparent_calc(50%+2px)),linear-gradient(to_bottom_right,transparent_calc(50%-2px),currentColor_calc(50%-2px),currentColor_50%,transparent_50%)] bg-[length:5px_6px] bg-[position:calc(100%-14px)_50%,calc(100%-9px)_50%] bg-no-repeat pr-7 pl-2",
      },
      size: { xs: "text-xs", sm: "text-sm", md: "text-sm", lg: "text-base", xl: "text-lg" },
      tone: {
        default: "",
        primary: "border-primary",
        error: "border-destructive focus:border-destructive focus:shadow-destructive/60",
      },
    },
    compoundVariants: [
      { kind: ["field", "select"], size: "xs", class: "h-6" },
      { kind: ["field", "select"], size: "sm", class: "h-8" },
      { kind: ["field", "select"], size: "md", class: "h-10" },
      { kind: ["field", "select"], size: "lg", class: "h-12" },
      { kind: ["field", "select"], size: "xl", class: "h-14" },
    ],
    defaultVariants: { kind: "field", size: "md", tone: "default" },
  }),
);
export type NeonInputVariants = NonNullable<Parameters<typeof neonInputRecipe>[0]>;
