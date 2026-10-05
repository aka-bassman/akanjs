import { usePage } from "@apps/akan/client";
import { cn } from "akanjs/client";
import { Link } from "akanjs/ui";
import { BsArrowRight } from "react-icons/bs";

const frameworks = [
  { name: "raw Bun.serve", runtime: "Bun", rps: 138072, isAkan: false },
  { name: "ElysiaJS", runtime: "Bun", rps: 137780, isAkan: false },
  { name: "Hono", runtime: "Bun", rps: 129926, isAkan: false },
  { name: "Akan.js", runtime: "Bun", rps: 123319, isAkan: true },
  { name: "Fastify", runtime: "Node", rps: 86682, isAkan: false },
] as const;

const maxRps = Math.max(...frameworks.map(({ rps }) => rps));

interface BenchmarkProps {
  className?: string;
}
export const Benchmark = ({ className }: BenchmarkProps) => {
  const { l } = usePage();
  const stats = [
    { value: "123K", label: l.trans({ en: "requests per second", ko: "초당 요청" }) },
    { value: "102 ms", label: l.trans({ en: "to start", ko: "시작 시간" }) },
    { value: "57 MB", label: l.trans({ en: "memory at rest", ko: "대기 메모리" }) },
  ];
  return (
    <div
      className={cn(
        "jelly-glass mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 rounded-4xl p-5 text-left sm:p-8 lg:grid-cols-2 lg:gap-12",
        className,
      )}
    >
      <div>
        <p className="font-mono text-foreground/45 text-xs uppercase tracking-[0.16em]">
          {l.trans({ en: "Performance", ko: "성능" })}
        </p>
        <p className="mt-3 text-balance font-black text-2xl sm:text-3xl">
          {l.trans({ en: "No rewrite for speed, either.", ko: "속도 때문에 다시 짤 일도 없습니다" })}
        </p>
        <p className="mt-3 text-foreground/60 text-sm leading-6">
          {l.trans({
            en: "Database, SSR, auth and agents come built in, and it still keeps pace with the lightest Bun frameworks. It starts fast and idles light, so adding instances is quick and cheap.",
            ko: "DB, SSR, 인증, 에이전트가 모두 들어 있는데도 가장 가벼운 Bun 프레임워크들과 속도를 나란히 합니다. 빨리 뜨고 메모리도 적게 써서, 인스턴스를 늘리기도 빠르고 저렴합니다.",
          })}
        </p>
        <ul className="mt-6 grid grid-cols-3 gap-2">
          {stats.map(({ value, label }) => (
            <li key={value} className="rounded-2xl bg-foreground/5 px-3 py-3 sm:px-4">
              <p className="font-black font-mono text-primary text-xl sm:text-2xl">{value}</p>
              <p className="mt-1 text-foreground/55 text-xs leading-5">{label}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col">
        <p className="font-mono text-foreground/45 text-xs uppercase tracking-[0.16em]">
          {l.trans({ en: "Requests per second", ko: "초당 요청 수" })}
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {frameworks.map(({ name, runtime, rps, isAkan }) => (
            <li key={name}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className={isAkan ? "font-bold text-primary" : "font-medium text-foreground/70"}>
                  {name}
                  {runtime === "Node" ? (
                    <span className="ml-1 font-normal text-foreground/40 text-xs">(Node)</span>
                  ) : null}
                </span>
                <span className={cn("font-mono text-xs", isAkan ? "text-primary" : "text-foreground/45")}>
                  {rps.toLocaleString("en-US")}
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-foreground/10">
                <div
                  className={cn("h-full rounded-full", isAkan ? "jelly tint-primary" : "bg-foreground/30")}
                  style={{ width: `${(rps / maxRps) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-5 text-foreground/45 text-xs leading-5">
          {l.trans({
            en: "Apple M4 Pro MacBook Pro · production build · 50 concurrent users",
            ko: "Apple M4 Pro MacBook Pro · production 빌드 · 동시 사용자 50명",
          })}
          <Link
            href="/blog/v3release#v3-performance"
            className="flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            {l.trans({ en: "Full benchmark", ko: "벤치마크 전체 보기" })} <BsArrowRight />
          </Link>
        </p>
      </div>
    </div>
  );
};
