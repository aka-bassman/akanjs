import { usePage } from "@apps/akan/client";
import { cn } from "akanjs/client";
import { AssemblyCard } from "./AssemblyCard";
import { AssemblyDone } from "./AssemblyDone";
import { AssemblyHero } from "./AssemblyHero";
import { JetOverlay } from "./JetOverlay";
import { ScrollFilm } from "./ScrollFilm";
import { StageRail } from "./StageRail";

const assemblyTrack: [number, number][] = [
  [0, 0],
  [0.3, 0],
  [0.5, 61],
  [0.7, 96],
  [0.86, 120],
  [0.88, 121],
  [1, 155],
];
const stageStops = [0.1, 0.3, 0.5, 0.7, 0.9];
const assemblySizes: [string, string] = ["1000", "600"];
const mediaClassName = "[mask-image:radial-gradient(closest-side,black_80%,transparent)]";

export const Assembly = () => {
  const { l } = usePage();
  const stations = [
    l.trans({ en: "Schema", ko: "스키마" }),
    l.trans({ en: "Query", ko: "쿼리" }),
    l.trans({ en: "Service", ko: "서비스" }),
    "API",
    "fetch",
    l.trans({ en: "Client type", ko: "클라이언트 타입" }),
    l.trans({ en: "State", ko: "상태" }),
    "UI prop",
  ];
  const platforms = ["Web", "iOS", "Android", "macOS", "Windows", "Linux"];
  const crew = [
    {
      who: l.trans({ en: "Person", ko: "사람" }),
      how: l.trans({ en: "at the controls, on the screen", ko: "화면 앞에서 조종간을" }),
    },
    {
      who: l.trans({ en: "In-page agent", ko: "인페이지 에이전트" }),
      how: l.trans({ en: "the same controls, in their tab", ko: "그 사람의 탭에서 같은 컨트롤을" }),
    },
    {
      who: l.trans({ en: "AI over MCP", ko: "MCP로 부르는 AI" }),
      how: l.trans({ en: "your endpoints, from any client", ko: "어떤 클라이언트에서든 당신의 엔드포인트를" }),
    },
  ];
  return (
    <section className="relative" aria-label={l.trans({ en: "Assembly", ko: "조립" })}>
      <ScrollFilm
        className="sticky top-0 h-svh overflow-hidden"
        boxClassName="absolute top-[4.5rem] left-1/2 aspect-square w-[min(112vw,64svh)] -translate-x-1/2 lg:top-1/2 lg:left-[66%] lg:w-[min(86svh,50vw)] 2xl:left-[64%] 2xl:w-[min(88svh,54vw)] lg:-translate-y-[47%]"
        canvasClassName={mediaClassName}
        frameCount={156}
        frameRoot="/flight/assembly"
        sizes={assemblySizes}
        track={assemblyTrack}
        stageStops={stageStops}
        backdrop={
          <>
            <div className="flt-grid absolute inset-0" />
            <div className="absolute inset-0 bg-[radial-gradient(42%_52%_at_50%_30%,var(--navy-hi),transparent_75%)] lg:bg-[radial-gradient(34%_56%_at_63%_52%,var(--navy-hi),transparent_75%)]" />
          </>
        }
        poster={
          <img
            alt=""
            className={cn("absolute inset-0 size-full", mediaClassName)}
            decoding="async"
            fetchPriority="high"
            src="/flight/k0.webp"
          />
        }
        overlay={<JetOverlay />}
      >
        <div className="flt-grain absolute inset-0" />
        <StageRail className="absolute right-6 bottom-8 hidden lg:flex xl:right-10" />
      </ScrollFilm>
      <div className="relative z-10 -mt-[100svh]">
        <AssemblyHero />
        <AssemblyCard
          sheet="ST-01"
          system={l.trans({ en: "Powerplant", ko: "동력장치" })}
          tag={l.trans({ en: "1 line", ko: "한 줄" })}
          title={l.trans({ en: "The line you write.", ko: "당신이 쓰는 한 줄." })}
          body={l.trans({
            en: "Adding a field is one declaration — a name and a type. Like an engine, everything else is built around it: the database, the API, the screens and the agent tools all come from that line.",
            ko: "필드를 더하는 일은 선언 한 줄, 이름과 타입이면 됩니다. 엔진처럼 나머지는 모두 이 한 줄을 중심으로 조립됩니다. DB, API, 화면, 에이전트 도구까지 모두 이 한 줄에서 나옵니다.",
          })}
        >
          <p className="flex items-center gap-4 bg-deep/70 px-4 py-3 font-hud text-sm ring-1 ring-line/15 ring-inset sm:text-base">
            <span className="select-none text-foreground/30">1</span>
            <span>
              name<span className="text-foreground/40">: </span>
              <span className="text-burn">field</span>
              <span className="text-foreground/40">(</span>String<span className="text-foreground/40">)</span>
            </span>
            <span className="flt-blink ml-[-0.6rem] h-5 w-2 bg-burn" />
          </p>
        </AssemblyCard>
        <AssemblyCard
          sheet="ST-02"
          system={l.trans({ en: "Airframe", ko: "기체 구조" })}
          tag={l.trans({ en: "8 layers", ko: "8 레이어" })}
          title={l.trans({ en: "Through every layer.", ko: "모든 레이어를 관통하고," })}
          body={l.trans({
            en: "That one line runs through eight stations of a single airframe — schema to UI prop — and they change together. Nothing to chase, nothing to miss.",
            ko: "그 한 줄이 하나의 기체를 이루는 여덟 스테이션, 스키마부터 UI prop까지를 관통하고, 여덟 곳이 함께 바뀝니다. 따라 고칠 곳도, 빠뜨릴 곳도 없습니다.",
          })}
        >
          <ol className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-hud text-xs sm:text-[13px]">
            {stations.map((station, idx) => (
              <li className="flex items-baseline gap-2.5" key={station}>
                <span className="text-burn">FS-{idx + 1}</span>
                <span className="text-foreground/80">{station}</span>
              </li>
            ))}
          </ol>
        </AssemblyCard>
        <AssemblyCard
          sheet="ST-03"
          system={l.trans({ en: "Wings", ko: "주익" })}
          tag={l.trans({ en: "6 platforms", ko: "6 플랫폼" })}
          title={l.trans({ en: "Onto every platform.", ko: "모든 플랫폼에 닿고," })}
          body={l.trans({
            en: "The same code ships as SEO-ready web, iOS and Android apps, and macOS, Windows and Linux desktop apps — with native-level screen transitions, not a wrapped website. One airframe to maintain, not six.",
            ko: "같은 코드가 SEO 웹, iOS·Android 앱, macOS·Windows·Linux 데스크톱 앱으로 배포됩니다. 감싼 웹사이트가 아니라 네이티브 수준의 화면 전환까지 갖춘 채로요. 관리할 기체는 여섯이 아니라 하나입니다.",
          })}
        >
          <ul className="flex flex-wrap gap-2 font-semibold font-tech text-sm uppercase tracking-[0.16em]">
            {platforms.map((platform) => (
              <li className="bg-line/8 px-3 py-1 ring-1 ring-line/20 ring-inset" key={platform}>
                {platform}
              </li>
            ))}
          </ul>
        </AssemblyCard>
        <AssemblyCard
          sheet="ST-04"
          system={l.trans({ en: "Cockpit", ko: "조종석" })}
          tag={l.trans({ en: "people & agents", ko: "사람과 에이전트" })}
          title={l.trans({ en: "For people and agents alike.", ko: "사람과 에이전트 모두에게." })}
          body={l.trans({
            en: "Every guarded endpoint becomes an MCP tool and every control on screen an in-page agent tool — behind the same guards people pass. One cockpit, one set of flight laws.",
            ko: "가드를 통과한 엔드포인트는 MCP 도구가, 화면의 컨트롤은 인페이지 에이전트 도구가 됩니다. 사람과 같은 가드를 거쳐서요. 조종석은 하나, 비행 법칙도 하나입니다.",
          })}
        >
          <ul className="space-y-2.5 text-sm">
            {crew.map(({ who, how }, idx) => (
              <li className="grid grid-cols-[1.75rem_1fr] items-baseline sm:grid-cols-[1.75rem_9rem_1fr]" key={who}>
                <span className="font-hud text-[11px] text-burn">0{idx + 1}</span>
                <span className="font-semibold">{who}</span>
                <span className="text-foreground/55 max-sm:col-start-2">{how}</span>
              </li>
            ))}
          </ul>
        </AssemblyCard>
        <AssemblyDone />
      </div>
    </section>
  );
};
