import { usePage } from "@apps/akan/client";
import { cn } from "akanjs/client";
import { Link } from "akanjs/ui";
import { BsArrowRight } from "react-icons/bs";

const columnClass = ["lg:col-start-1", "lg:col-start-2", "lg:col-start-3", "lg:col-start-4"] as const;

interface GrowthPathProps {
  className?: string;
}
export const GrowthPath = ({ className }: GrowthPathProps) => {
  const { l } = usePage();
  const stages = [
    {
      tag: l.trans({ en: "Prototype", ko: "프로토타입" }),
      title: l.trans({ en: "Running on day one", ko: "첫날부터 실행" }),
      line: l.trans({
        en: "The server and the database come with akan start — nothing to install or wire.",
        ko: "akan start에 서버와 DB가 함께 옵니다. 설치할 것도, 연결할 것도 없습니다.",
      }),
      machines: [1],
      cubeGrid: "grid-cols-1",
      isLaptop: true,
    },
    {
      tag: l.trans({ en: "Launch", ko: "출시" }),
      title: l.trans({ en: "One container to ship", ko: "컨테이너 하나로 출시" }),
      line: l.trans({
        en: "The whole app, database included, deploys as a single container.",
        ko: "DB까지 담긴 앱 전체가 컨테이너 하나로 배포됩니다.",
      }),
      machines: [1],
      cubeGrid: "grid-cols-1",
      isLaptop: false,
    },
    {
      tag: l.trans({ en: "Growth", ko: "성장" }),
      title: l.trans({ en: "Add copies, not code", ko: "코드는 그대로, 인스턴스만 추가" }),
      line: l.trans({
        en: "As traffic grows, more copies of the same app share it.",
        ko: "트래픽이 늘면 같은 앱을 더 띄워 나눠 받습니다.",
      }),
      machines: [4],
      cubeGrid: "grid-cols-2",
      isLaptop: false,
    },
    {
      tag: "IPO",
      title: l.trans({ en: "Many servers, same code", ko: "서버는 여러 대, 코드는 그대로" }),
      line: l.trans({
        en: "When one machine is not enough, it spreads across servers on Postgres and Redis.",
        ko: "서버 한 대로 부족해지면 Postgres·Redis와 함께 여러 서버로 펼칩니다.",
      }),
      machines: [3, 3, 3],
      cubeGrid: "grid-cols-1",
      isLaptop: false,
    },
  ];
  return (
    <div className={cn("jelly-glass mx-auto w-full max-w-5xl rounded-4xl p-5 text-left sm:p-8", className)}>
      <div className="grid grid-cols-[5rem_1fr] items-center gap-x-5 gap-y-6 lg:grid-cols-4 lg:items-stretch lg:gap-x-8 lg:gap-y-0">
        {stages.map(({ tag, title, line, machines, cubeGrid, isLaptop }, idx) => (
          <div key={tag} className="contents">
            <div
              className={cn(
                "flex items-end justify-center gap-1 lg:row-start-1 lg:h-32 lg:gap-1.5 lg:pb-2",
                columnClass[idx],
              )}
            >
              {machines.map((cubeNum, machineIdx) => (
                <div key={machineIdx} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "grid gap-1 rounded-lg border border-foreground/15 bg-background/70 p-1 lg:gap-1.5 lg:p-1.5",
                      cubeGrid,
                    )}
                  >
                    {Array.from({ length: cubeNum }, (_, cubeIdx) => (
                      <span key={cubeIdx} className="jelly tint-primary size-3 rounded-sm lg:size-7 lg:rounded-md" />
                    ))}
                  </div>
                  {isLaptop ? <span className="h-1 w-[150%] rounded-b-md bg-foreground/20 lg:h-1.5" /> : null}
                </div>
              ))}
            </div>
            <div className={cn("lg:row-start-3 lg:pt-5", columnClass[idx])}>
              <p className="font-mono text-primary text-xs uppercase tracking-[0.14em]">{tag}</p>
              <p className="mt-1.5 font-bold leading-6">{title}</p>
              <p className="mt-1 text-foreground/60 text-sm leading-6">{line}</p>
            </div>
          </div>
        ))}
        <div className="col-span-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-2xl bg-primary/10 px-5 py-3.5 ring-1 ring-primary/25 ring-inset lg:col-span-4 lg:row-start-2">
          <code className="font-mono text-sm">
            <span className="text-foreground">name</span>
            <span className="text-foreground/40">: </span>
            <span className="text-primary">field</span>
            <span className="text-foreground/40">(</span>
            <span className="text-foreground/80">String</span>
            <span className="text-foreground/40">)</span>
          </code>
          <span className="font-bold text-sm">
            {l.trans({ en: "One codebase, from the first commit to IPO", ko: "첫 커밋부터 IPO까지 코드베이스 하나" })}
          </span>
        </div>
      </div>
      <Link
        href="/docs/arch/infra#database-mode"
        className="mt-7 flex w-fit flex-wrap items-center gap-x-3 gap-y-1 font-semibold text-foreground/60 text-sm hover:text-foreground lg:ml-auto"
      >
        <span className="whitespace-nowrap font-mono text-primary">single · multiple · cluster</span>
        <span className="flex items-center gap-2 whitespace-nowrap">
          {l.trans({ en: "How each stage runs", ko: "단계별 운영 방식" })}
          <BsArrowRight />
        </span>
      </Link>
    </div>
  );
};
