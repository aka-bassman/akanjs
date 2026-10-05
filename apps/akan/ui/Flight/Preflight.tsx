import { usePage } from "@apps/akan/client";
import { flightPanelRecipe } from "../Recipe";
import { SheetLabel } from "./SheetLabel";

export const Preflight = () => {
  const { l } = usePage();
  const items = [
    {
      title: l.trans({ en: "Config Hell Ends", ko: "config 파일 지옥은 그만" }),
      status: l.trans({ en: "One file", ko: "파일 하나" }),
      description: l.trans({
        en: "Configure everything in akan.config.ts. Even when you configure nothing, defaults keep the product moving.",
        ko: "akan.config.ts 하나로 모든 것을 설정합니다. 하물며 설정하지 않아도 제품은 계속 굴러갑니다.",
      }),
    },
    {
      title: l.trans({ en: "Strict Rules, Unified Style", ko: "엄격한 규칙, 통일된 스타일" }),
      status: l.trans({ en: "Unified", ko: "통일" }),
      description: l.trans({
        en: "File paths, names, structures, and declarations stay consistent. Code reads like one person wrote it.",
        ko: "파일 위치, 이름, 구조, 선언 방식까지 통일됩니다. 누가 짰든 한 사람이 쓴 것처럼 읽힙니다.",
      }),
    },
    {
      title: l.trans({ en: "Rules Agents Can't Route Around", ko: "에이전트가 우회할 수 없는 규칙" }),
      status: l.trans({ en: "Enforced", ko: "강제" }),
      description: l.trans({
        en: "Every workspace ships a plan-then-apply workflow MCP and akan code, so an agent edits through the rules, not around them.",
        ko: "모든 워크스페이스에 계획 후 적용하는 워크플로 MCP와 akan code가 들어 있어 에이전트는 규칙을 우회하지 않고 규칙을 따라 고칩니다.",
      }),
    },
    {
      title: l.trans({ en: "Agentic Full-Stack, Redefined", ko: "에이전틱 풀스택의 재정의" }),
      status: l.trans({ en: "Fixed blocks", ko: "고정 블록" }),
      description: l.trans({
        en: "Fixed blocks for upload, login, admin, chat, boards, and alerts let agents produce consistent code.",
        ko: "업로드, 로그인, 관리자, 채팅, 게시판, 알림 같은 고정 블록 위에서 에이전트는 일관된 코드만 생산합니다.",
      }),
    },
  ];
  return (
    <section className="relative px-6 py-24 sm:px-10 lg:px-14 xl:px-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <div>
          <SheetLabel sheet="09">
            {l.trans({ en: "Pre-flight · Agents build it, too", ko: "비행 전 점검 · 만드는 일도 에이전트가" })}
          </SheetLabel>
          <h2 className="mt-6 text-balance font-black text-3xl leading-tight sm:text-5xl">
            {l.trans({
              en: "AI coding turns to spaghetti past a certain size.",
              ko: "AI 코딩은 일정 규모를 넘으면 스파게티가 됩니다.",
            })}
          </h2>
          <p className="mt-5 text-foreground/65 leading-7 sm:text-lg sm:leading-8">
            {l.trans({
              en: "The faster an agent writes code, the more file paths, names, structures, and declaration styles drift apart — until review and maintenance fall over. No pilot takes off without a checklist; Akan gives your agents one, and makes them run it.",
              ko: "에이전트가 코드를 빨리 뽑을수록 파일 위치, 이름, 구조, 선언 방식이 제각각이 되어 리뷰와 유지보수가 무너집니다. 체크리스트 없이 이륙하는 조종사는 없습니다. Akan은 에이전트에게 체크리스트를 쥐여 주고, 그대로 따르게 합니다.",
            })}
          </p>
        </div>
        <div className={flightPanelRecipe({ tone: "sheet", padding: "none", ticks: true }, "flt-reveal")}>
          <p className="flex items-center justify-between border-line/15 border-b px-5 py-3 font-hud text-[10.5px] text-line uppercase tracking-[0.18em]">
            <span>{l.trans({ en: "Checklist · before takeoff", ko: "체크리스트 · 이륙 전" })}</span>
            <span className="text-foreground/40">AK-3 · REV 3</span>
          </p>
          <ol className="divide-y divide-line/10">
            {items.map(({ title, status, description }, idx) => (
              <li className="grid grid-cols-[2rem_1fr_auto] gap-x-3 px-5 py-5" key={title}>
                <span className="pt-0.5 font-hud text-[11px] text-burn">{String(idx + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <p className="flex items-baseline gap-3 font-bold">
                    <span className="shrink-0">{title}</span>
                    <span className="mb-1 h-px min-w-6 flex-1 border-line/30 border-b border-dotted max-sm:hidden" />
                  </p>
                  <p className="mt-1.5 text-foreground/60 text-sm leading-6">{description}</p>
                </div>
                <span className="flex items-start gap-2.5 pt-0.5">
                  <span className="font-hud text-[10.5px] text-hud uppercase tracking-[0.14em] max-sm:hidden">
                    {status}
                  </span>
                  <svg aria-hidden="true" className="size-5 shrink-0" viewBox="0 0 20 20">
                    <rect className="fill-none stroke-hud/50" height={18} width={18} x={1} y={1} />
                    <path
                      className="flt-draw flt-draw-view fill-none stroke-hud"
                      d="M5 10.5 L8.5 14 L15 6.5"
                      pathLength={1}
                      strokeLinecap="square"
                      strokeWidth={2}
                    />
                  </svg>
                </span>
              </li>
            ))}
          </ol>
          <div className="flt-hatch border-line/15 border-t px-5 py-5">
            <p className="font-black text-lg sm:text-xl">
              {l.trans({
                en: "This is what we mean by agentic full-stack.",
                ko: "이것이 우리가 말하는 에이전틱 풀스택입니다.",
              })}
            </p>
            <p className="mt-2 text-foreground/65 text-sm leading-6">
              {l.trans({
                en: "It runs in both directions. Agents use the app through the same guards people pass. And agents build it on strict rules and fixed blocks, so they produce nothing but consistent code. Not an abstract idea, but quality that rules make.",
                ko: "에이전틱 풀스택은 양방향입니다. 에이전트는 사람과 같은 가드를 거쳐 앱을 씁니다. 그리고 엄격한 규칙과 정해진 블록 위에서 앱을 만들기에 일관된 코드만 생산합니다. 추상적인 개념이 아니라, 규칙이 만든 품질입니다.",
              })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
