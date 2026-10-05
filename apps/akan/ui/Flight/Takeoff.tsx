import { usePage } from "@apps/akan/client";
import { Link } from "akanjs/ui";
import { BsArrowUpRight, BsCheck } from "react-icons/bs";
import { flightButtonRecipe } from "../Recipe";
import { ScrollFilm } from "./ScrollFilm";
import { SheetLabel } from "./SheetLabel";

const takeoffTrack: [number, number][] = [
  [0, 0],
  [0.08, 0],
  [0.94, 96],
  [1, 96],
];
const takeoffStops = [0.16, 0.38, 0.6, 0.82];
const takeoffSizes: [string, string] = ["1280", "800"];

export const Takeoff = () => {
  const { l } = usePage();
  const steps = [
    {
      call: "Thrust set",
      command: "akan login",
      description: l.trans({
        en: "Sign in to Akan Cloud from your machine.",
        ko: "이 컴퓨터에서 Akan Cloud에 로그인합니다.",
      }),
      on: "1 2 3 4",
    },
    {
      call: "Rotate",
      command: "akan tunnel <app>",
      description: l.trans({
        en: "Share the app you are running on a public URL before you ship.",
        ko: "배포 전에 실행 중인 앱을 공개 URL로 공유합니다.",
      }),
      on: "2 3 4",
    },
    {
      call: "Positive rate",
      command: "akan build <app>",
      description: l.trans({
        en: "Build the production artifact Akan Cloud runs.",
        ko: "Akan Cloud가 돌릴 프로덕션 결과물을 빌드합니다.",
      }),
      on: "3 4",
    },
    {
      call: "Gear up",
      command: l.trans({ en: "live URL", ko: "라이브 URL" }),
      description: l.trans({
        en: "Ship it live, and watch it climb.",
        ko: "라이브로 내보내고, 날아오르는 걸 지켜보세요.",
      }),
      on: "4",
    },
  ];
  return (
    <section className="relative h-[340svh]" aria-label={l.trans({ en: "Takeoff", ko: "이륙" })}>
      <ScrollFilm
        className="sticky top-0 h-svh overflow-hidden"
        boxClassName="absolute top-[30%] left-1/2 aspect-video w-[150vw] -translate-x-1/2 -translate-y-1/2 -scale-x-100 lg:top-1/2 lg:w-[max(100vw,177.78svh)]"
        canvasClassName="[mask-image:linear-gradient(to_bottom,transparent,black_14%,black_88%,transparent)] lg:[mask-image:linear-gradient(to_bottom,transparent,black_10%,black_88%,transparent)]"
        frameCount={97}
        frameRoot="/flight/takeoff"
        sizes={takeoffSizes}
        track={takeoffTrack}
        stageStops={takeoffStops}
        backdrop={<div className="flt-runway absolute inset-0" />}
        poster={
          <img
            alt=""
            className="absolute inset-0 size-full object-cover [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_88%,transparent)] lg:[mask-image:linear-gradient(to_bottom,transparent,black_10%,black_88%,transparent)]"
            decoding="async"
            loading="lazy"
            src="/flight/takeoff-first.webp"
          />
        }
      >
        <div className="absolute inset-x-0 bottom-0 h-[58%] bg-linear-to-t from-deep via-deep/85 to-transparent lg:inset-y-0 lg:right-auto lg:left-0 lg:h-auto lg:w-[58%] lg:bg-linear-to-r lg:via-deep/55" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-8 sm:px-10 lg:inset-y-0 lg:flex lg:w-[46rem] lg:flex-col lg:justify-center lg:px-14 lg:pb-0 xl:px-20">
          <SheetLabel sheet="11">{l.trans({ en: "Takeoff · Akan Cloud", ko: "이륙 · Akan Cloud" })}</SheetLabel>
          <h2 className="mt-5 text-balance font-black text-3xl leading-tight sm:text-5xl lg:text-6xl">
            {l.trans({ en: "From build to a live URL.", ko: "빌드에서 라이브 URL까지." })}
          </h2>
          <p className="mt-4 max-w-lg text-foreground/70 leading-7 max-sm:hidden sm:text-lg sm:leading-8">
            {l.trans({
              en: "Akan Cloud is the deploy platform built for Akan apps. Sign in from the CLI, share a preview, build, and ship it live.",
              ko: "Akan Cloud는 Akan 앱을 위해 만든 배포 플랫폼입니다. CLI에서 로그인하고, 미리보기를 공유하고, 빌드해서 라이브로 내보내세요.",
            })}
          </p>
          <ol className="mt-6 space-y-2 sm:mt-8 sm:space-y-3">
            {steps.map(({ call, command, description, on }) => (
              <li className="flt-step grid grid-cols-[1.25rem_1fr] gap-x-3" data-on={on} key={call}>
                <span className="mt-0.5 flex size-5 items-center justify-center ring-1 ring-burn/70 ring-inset">
                  <BsCheck className="flt-step-check text-burn" />
                </span>
                <div>
                  <p className="flex flex-wrap items-baseline gap-x-3 font-hud text-[13px] sm:text-sm">
                    <span className="text-burn uppercase tracking-[0.16em]">{call}</span>
                    <span className="text-foreground">$ {command}</span>
                  </p>
                  <p className="mt-0.5 text-foreground/55 text-sm leading-6 max-sm:hidden">{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link
            href="https://cloud.akanjs.com"
            target="_blank"
            className={flightButtonRecipe({ tone: "burn", size: "lg" }, "mt-7 w-fit sm:mt-9")}
          >
            {l.trans({ en: "Open Akan Cloud", ko: "Akan Cloud 열기" })} <BsArrowUpRight />
          </Link>
        </div>
        <p className="flt-pct absolute top-20 right-6 font-hud text-[10px] text-foreground/60 uppercase tracking-[0.2em] sm:right-10">
          {l.trans({ en: "Takeoff roll ", ko: "이륙 활주 " })}
        </p>
      </ScrollFilm>
    </section>
  );
};
