import { usePage } from "@apps/akan/client";
import { SheetLabel } from "./SheetLabel";

export const AssemblyDone = () => {
  const { l } = usePage();
  return (
    <div className="flex min-h-svh items-end px-4 pb-6 sm:px-10 lg:items-center lg:px-14 lg:pb-0 xl:px-20">
      <div className="max-w-md max-lg:bg-navy/85 max-lg:p-6 max-lg:ring-1 max-lg:ring-line/15 max-lg:backdrop-blur-sm 2xl:max-w-lg">
        <SheetLabel sheet="ST-05">{l.trans({ en: "Roll-out · all systems go", ko: "출고 · 전 계통 정상" })}</SheetLabel>
        <h2 className="mt-5 font-black text-4xl leading-[1.04] sm:text-6xl">
          {l.trans({ en: "One line.", ko: "한 줄로," })}
          <span className="flt-burn-glow block text-burn">
            {l.trans({ en: "The whole aircraft.", ko: "기체 전체를." })}
          </span>
        </h2>
        <p className="mt-6 font-hud text-[11px] text-line uppercase leading-5 tracking-[0.16em] sm:text-xs">
          {l.trans({
            en: "1 line × 8 layers × 6 platforms × people & agents",
            ko: "한 줄 × 8 레이어 × 6 플랫폼 × 사람과 에이전트",
          })}
        </p>
        <p className="mt-4 text-foreground/70 leading-7 sm:text-lg sm:leading-8">
          {l.trans({
            en: "Type-safe from the database to the screen, and all you wrote was the line. Now the systems that make it fly — for the people who use it and the agents who work for them.",
            ko: "DB부터 화면까지 타입 안전하고, 당신이 쓴 건 그 한 줄뿐입니다. 이제 이 기체를 날게 하는 계통을 볼 차례입니다. 쓰는 사람을 위한 것, 그리고 그들을 대신해 일하는 에이전트를 위한 것.",
          })}
        </p>
      </div>
    </div>
  );
};
