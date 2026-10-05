import { usePage } from "@apps/akan/client";
import { cn } from "akanjs/client";

const stations = [
  { y: 180, half: 70 },
  { y: 270, half: 85 },
  { y: 360, half: 110 },
  { y: 450, half: 140 },
  { y: 540, half: 140 },
  { y: 630, half: 140 },
  { y: 720, half: 150 },
  { y: 810, half: 150 },
] as const;

const wingStencils = [
  { x: 314, y: 569, angle: -36, label: "Web" },
  { x: 245, y: 619, angle: -36, label: "iOS" },
  { x: 158, y: 678, angle: -36, label: "Android" },
  { x: 674, y: 566, angle: 37, label: "macOS" },
  { x: 760, y: 630, angle: 37, label: "Windows" },
  { x: 848, y: 696, angle: 37, label: "Linux" },
] as const;

const labelClassName = "fill-line font-semibold font-tech text-[22px] uppercase tracking-[0.12em]";
const chipClassName = "fill-navy/85 stroke-line/40";

interface JetOverlayProps {
  className?: string;
}
export const JetOverlay = ({ className }: JetOverlayProps) => {
  const { l } = usePage();
  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 size-full overflow-visible", className)}
      viewBox="0 0 1000 1000"
    >
      <g className="flt-ov" data-ov="0 1 5">
        <line className="stroke-burn/70" strokeDasharray="28 8 4 8" strokeWidth={2} x1={500} x2={500} y1={8} y2={992} />
        <rect className={chipClassName} height={34} rx={2} width={262} x={222} y={14} />
        <text className="fill-burn font-hud text-[19px]" x={236} y={37}>
          name: field(String)
        </text>
        <text className={labelClassName} textAnchor="end" x={484} y={78}>
          {l.trans({ en: "C/L · one line", ko: "C/L · 한 줄" })}
        </text>
      </g>

      <g className="flt-ov" data-ov="0 1">
        <circle
          className="flt-idle origin-center [transform-box:fill-box]"
          cx={500}
          cy={884}
          fill="url(#flt-nozzle)"
          r={46}
        />
      </g>

      <g className="flt-ov" data-ov="0">
        <g className="flt-scan [--scan-travel:900px]">
          <rect fill="url(#flt-scan-trail)" height={48} width={900} x={50} y={-8} />
          <rect className="fill-line" height={1.5} width={900} x={50} y={40} />
        </g>
      </g>

      <g className="flt-ov" data-ov="1">
        <rect
          className="fill-burn/5 stroke-burn"
          height={470}
          strokeDasharray="10 7"
          strokeWidth={2}
          width={140}
          x={430}
          y={432}
        />
        <line className="stroke-burn" strokeWidth={2} x1={570} x2={640} y1={520} y2={470} />
        <line className="stroke-burn" strokeWidth={2} x1={640} x2={780} y1={470} y2={470} />
        <text className="fill-burn font-semibold font-tech text-[26px] uppercase tracking-[0.12em]" x={648} y={458}>
          {l.trans({ en: "Powerplant", ko: "동력장치" })}
        </text>
        <text className="fill-line/80 font-hud text-[17px]" x={648} y={500}>
          ST-01 · 1 LINE
        </text>
      </g>

      <g className="flt-ov" data-ov="2">
        {stations.map(({ y, half }, idx) => (
          <g key={y}>
            <line className="stroke-line/70" strokeWidth={1.5} x1={500 - half} x2={500 + half} y1={y} y2={y} />
            <line
              className="stroke-line/40"
              strokeDasharray="3 5"
              strokeWidth={1.5}
              x1={500 + half}
              x2={850}
              y1={y}
              y2={y}
            />
            <rect className={chipClassName} height={30} rx={2} width={66} x={852} y={y - 15} />
            <text className="fill-line font-hud text-[16px]" x={862} y={y + 6}>
              FS-{idx + 1}
            </text>
          </g>
        ))}
      </g>

      <g className="flt-ov" data-ov="3">
        {wingStencils.map(({ x, y, angle, label }) => (
          <text
            className="fill-foreground/85 font-bold font-tech text-[21px] tracking-[0.14em]"
            key={label}
            textAnchor="middle"
            transform={`rotate(${angle} ${x} ${y})`}
            x={x}
            y={y}
          >
            {label}
          </text>
        ))}
      </g>

      <g className="flt-ov" data-ov="4">
        <circle className="fill-none stroke-burn" cx={497} cy={332} r={68} strokeWidth={2} />
        <line className="stroke-burn" strokeWidth={2} x1={436} x2={300} y1={300} y2={230} />
        <line className="stroke-burn" strokeWidth={2} x1={300} x2={120} y1={230} y2={230} />
        <text className="fill-burn font-semibold font-tech text-[24px] uppercase tracking-[0.12em]" x={120} y={218}>
          {l.trans({ en: "Person", ko: "사람" })}
        </text>
        <line className="stroke-line" strokeWidth={2} x1={558} x2={700} y1={300} y2={230} />
        <line className="stroke-line" strokeWidth={2} x1={700} x2={890} y1={230} y2={230} />
        <text className="fill-line font-semibold font-tech text-[24px] uppercase tracking-[0.12em]" x={706} y={218}>
          {l.trans({ en: "In-page agent", ko: "인페이지 에이전트" })}
        </text>
        <line className="stroke-line" strokeDasharray="6 6" strokeWidth={2} x1={500} x2={700} y1={150} y2={120} />
        <line className="stroke-line" strokeDasharray="6 6" strokeWidth={2} x1={700} x2={890} y1={120} y2={120} />
        <text className="fill-line font-semibold font-tech text-[24px] uppercase tracking-[0.12em]" x={706} y={108}>
          {l.trans({ en: "AI over MCP", ko: "MCP로 부르는 AI" })}
        </text>
        <text className="fill-foreground/70 font-hud text-[16px]" x={120} y={262}>
          guards: [Every, Person]
        </text>
      </g>

      <g className="flt-ov" data-ov="3 5">
        <line className="stroke-line/40" strokeWidth={1.5} x1={80} x2={80} y1={720} y2={960} />
        <line className="stroke-line/40" strokeWidth={1.5} x1={920} x2={920} y1={720} y2={960} />
        <line
          className="stroke-line/70"
          markerEnd="url(#flt-arrow)"
          markerStart="url(#flt-arrow)"
          strokeWidth={1.5}
          x1={84}
          x2={916}
          y1={945}
          y2={945}
        />
        <rect className={chipClassName} height={30} rx={2} width={190} x={405} y={930} />
        <text className={labelClassName} textAnchor="middle" x={500} y={953}>
          {l.trans({ en: "6 platforms", ko: "6 플랫폼" })}
        </text>
      </g>

      <g className="flt-ov" data-ov="5">
        <line className="stroke-line/40" strokeWidth={1.5} x1={500} x2={985} y1={75} y2={75} />
        <line className="stroke-line/40" strokeWidth={1.5} x1={530} x2={985} y1={898} y2={898} />
        <line
          className="stroke-line/70"
          markerEnd="url(#flt-arrow)"
          markerStart="url(#flt-arrow)"
          strokeWidth={1.5}
          x1={970}
          x2={970}
          y1={79}
          y2={894}
        />
        <rect className={chipClassName} height={30} rx={2} width={150} x={895} y={472} />
        <text className={labelClassName} textAnchor="middle" x={970} y={495}>
          {l.trans({ en: "8 layers", ko: "8 레이어" })}
        </text>
      </g>

      <defs>
        <radialGradient id="flt-nozzle">
          <stop offset="0%" className="[stop-color:var(--burn)]" stopOpacity={0.9} />
          <stop offset="45%" className="[stop-color:var(--burn)]" stopOpacity={0.35} />
          <stop offset="100%" className="[stop-color:var(--burn)]" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="flt-scan-trail" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" className="[stop-color:var(--line)]" stopOpacity={0} />
          <stop offset="100%" className="[stop-color:var(--line)]" stopOpacity={0.22} />
        </linearGradient>
        <marker
          id="flt-arrow"
          markerHeight={10}
          markerWidth={10}
          orient="auto-start-reverse"
          refX={9}
          refY={5}
          viewBox="0 0 10 10"
        >
          <path className="fill-line" d="M0 0 L10 5 L0 10 z" />
        </marker>
      </defs>
    </svg>
  );
};
