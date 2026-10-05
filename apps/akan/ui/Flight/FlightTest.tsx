import { usePage } from "@apps/akan/client";
import { Link } from "akanjs/ui";
import { BsArrowRight } from "react-icons/bs";
import { flightPanelRecipe } from "../Recipe";
import { Gauge } from "./Gauge";
import { SheetLabel } from "./SheetLabel";

export const FlightTest = () => {
  const { l } = usePage();
  const gauges = [
    {
      min: 0,
      max: 30,
      from: 26,
      to: 8.1,
      value: "26MB → 8.1MB",
      caption: l.trans({ en: "Client build output in v3", ko: "v3 클라이언트 빌드 결과물" }),
    },
    {
      min: 0,
      max: 4,
      from: 3.5,
      to: 0.9,
      value: "3.5ms → 0.9ms",
      caption: l.trans({ en: "Hydrating 1,000 rows on the client", ko: "클라이언트 1,000행 하이드레이션" }),
    },
    {
      min: 0,
      max: 100,
      from: 100,
      to: 67,
      value: "−33%",
      caption: l.trans({ en: "Time for a 50-row list query", ko: "50행 목록 쿼리 시간" }),
    },
    {
      min: 0,
      max: 2.4,
      from: 1,
      to: 2,
      value: l.trans({ en: "2× faster", ko: "2배 빠르게" }),
      caption: l.trans({ en: "Startup, with a third less memory", ko: "시작 시간, 메모리는 3분의 1 절감" }),
    },
  ];
  return (
    <section className="relative px-6 py-24 sm:px-10 lg:px-14 xl:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SheetLabel sheet="10">{l.trans({ en: "Flight test · v3", ko: "비행 시험 · v3" })}</SheetLabel>
            <h2 className="mt-6 text-balance font-black text-3xl leading-tight sm:text-5xl">
              {l.trans({ en: "Lighter airframe. Faster spool-up.", ko: "더 가벼운 기체, 더 빠른 시동." })}
            </h2>
          </div>
          <Link
            href="/blog/v3release#v3-performance"
            className="flex w-fit items-center gap-2 font-hud text-[11px] text-line uppercase tracking-[0.18em] hover:text-foreground"
          >
            {l.trans({ en: "Read the v3 benchmark", ko: "v3 벤치마크 읽기" })} <BsArrowRight />
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {gauges.map((gauge) => (
            <div className={flightPanelRecipe({ tone: "glass", padding: "md" }, "pt-6")} key={gauge.caption}>
              <Gauge {...gauge} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
