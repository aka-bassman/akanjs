import { usePage } from "@apps/akan/client";
import { flightPanelRecipe } from "../Recipe";

interface SpecSheetProps {
  className?: string;
}
export const SpecSheet = ({ className }: SpecSheetProps) => {
  const { l } = usePage();
  const rows = [
    { label: l.trans({ en: "Engine", ko: "엔진" }), value: l.trans({ en: "1 line", ko: "한 줄" }) },
    { label: l.trans({ en: "Airframe", ko: "기체" }), value: l.trans({ en: "8 layers", ko: "8 레이어" }) },
    { label: l.trans({ en: "Range", ko: "항속" }), value: l.trans({ en: "6 platforms", ko: "6 플랫폼" }) },
    { label: l.trans({ en: "Crew", ko: "탑승" }), value: l.trans({ en: "people & agents", ko: "사람과 에이전트" }) },
    { label: l.trans({ en: "Fuel", ko: "연료" }), value: "Bun" },
  ];
  return (
    <div className={flightPanelRecipe({ tone: "sheet", padding: "none", ticks: true }, ["text-xs", className])}>
      <div className="border-line/15 border-b px-4 py-3">
        <p className="font-bold font-tech text-lg uppercase tracking-[0.16em]">Akan.js · AK-3</p>
        <p className="mt-0.5 text-foreground/60 leading-5">
          {l.trans({
            en: "The TypeScript framework, agents included.",
            ko: "에이전트까지 들어 있는 TypeScript 프레임워크.",
          })}
        </p>
      </div>
      <dl className="divide-y divide-line/10 font-hud">
        {rows.map(({ label, value }) => (
          <div className="grid grid-cols-[5.5rem_1fr] px-4 py-2" key={label}>
            <dt className="text-line/70 uppercase tracking-[0.14em]">{label}</dt>
            <dd className="text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="flt-hatch border-line/15 border-t px-4 py-2 font-hud text-[10px] text-line/70 uppercase tracking-[0.16em]">
        DWG AK-3-001 · REV 3.0 · {l.trans({ en: "Sheet 01 of 13", ko: "13장 중 01" })}
      </p>
    </div>
  );
};
