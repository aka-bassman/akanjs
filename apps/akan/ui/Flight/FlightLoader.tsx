import { usePage } from "@apps/akan/client";

export const FlightLoader = () => {
  const { l } = usePage();
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6">
      <div className="relative size-28 rounded-full ring-1 ring-line/30">
        <div className="absolute inset-4 rounded-full ring-1 ring-line/15" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-line/15" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-line/15" />
        <div className="flt-sweep absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_70%,var(--burn))] opacity-50" />
        <span className="absolute inset-0 m-auto size-1.5 rounded-full bg-burn" />
      </div>
      <p className="font-hud text-[11px] text-line uppercase tracking-[0.24em]">
        {l.trans({ en: "Spooling up", ko: "시동 중" })}
      </p>
    </div>
  );
};
