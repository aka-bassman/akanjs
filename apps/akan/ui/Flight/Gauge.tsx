import { cn } from "akanjs/client";
import type { CSSProperties } from "react";

const sweep = 240;
const ticks = Array.from({ length: 13 }, (_, idx) => idx);

interface GaugeProps {
  className?: string;
  min: number;
  max: number;
  from: number;
  to: number;
  value: string;
  caption: string;
}
export const Gauge = ({ className, min, max, from, to, value, caption }: GaugeProps) => {
  const angleOf = (reading: number) => -sweep / 2 + (sweep * (reading - min)) / (max - min);
  const needleStyle = { "--from": `${angleOf(from)}deg`, "--to": `${angleOf(to)}deg` } as CSSProperties;
  return (
    <figure className={cn("flex flex-col items-center", className)}>
      <svg aria-hidden="true" className="w-full max-w-[15rem] overflow-visible" viewBox="0 0 200 150">
        <path className="fill-none stroke-line/25" d="M 30.7 140 A 80 80 0 1 1 169.3 140" strokeWidth={1.5} />
        {ticks.map((tick) => (
          <line
            className={tick % 3 === 0 ? "stroke-line/70" : "stroke-line/30"}
            key={tick}
            strokeWidth={tick % 3 === 0 ? 2 : 1}
            transform={`rotate(${-sweep / 2 + (sweep * tick) / 12} 100 100)`}
            x1={100}
            x2={100}
            y1={tick % 3 === 0 ? 24 : 28}
            y2={34}
          />
        ))}
        <line
          className="stroke-foreground/30"
          strokeDasharray="3 3"
          strokeWidth={1.5}
          transform={`rotate(${angleOf(from)} 100 100)`}
          x1={100}
          x2={100}
          y1={100}
          y2={36}
        />
        <g className="flt-needle origin-[100px_100px]" style={needleStyle}>
          <line className="stroke-burn" strokeLinecap="round" strokeWidth={3} x1={100} x2={100} y1={112} y2={34} />
        </g>
        <circle className="fill-navy stroke-burn" cx={100} cy={100} r={6} strokeWidth={2} />
      </svg>
      <figcaption className="-mt-4 text-center">
        <p className="font-bold font-tech text-foreground text-lg tracking-wide sm:text-[1.7rem]">{value}</p>
        <p className="mt-1 text-foreground/55 text-sm leading-5">{caption}</p>
      </figcaption>
    </figure>
  );
};
