import { recipe, tv } from "akanjs/ui";

/** 구미 젤리 버튼 — `jelly` 표면 위에 스프링 squish, tone 은 젤리 색(`tint-*`)을, glass 는 투명한 `jelly-glass` 판을 고른다. */
export const jellyButtonRecipe = recipe(
  tv({
    base: "squish inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold",
    variants: {
      tone: {
        primary: "jelly tint-primary text-primary-foreground",
        ink: "jelly tint-secondary text-secondary-foreground",
        moon: "jelly tint-moon text-black/80",
        planet: "jelly tint-planet text-white",
        glass: "jelly-glass text-foreground",
      },
      size: { md: "h-11 px-5 text-sm", lg: "h-14 px-7 text-base" },
    },
    defaultVariants: { tone: "primary", size: "md" },
  }),
);
export type JellyButtonVariants = NonNullable<Parameters<typeof jellyButtonRecipe>[0]>;
