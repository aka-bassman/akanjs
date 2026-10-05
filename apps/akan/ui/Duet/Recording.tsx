import { usePage } from "@apps/akan/client";
import { cn } from "akanjs/client";

interface RecordingProps {
  className?: string;
  src: string;
  isRealtime?: boolean;
}
export const Recording = ({ className, src, isRealtime = true }: RecordingProps) => {
  const { l } = usePage();
  return (
    <figure
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-2xl shadow-black/10",
        className,
      )}
    >
      <video className="aspect-video w-full object-cover" src={src} autoPlay muted loop playsInline />
      {isRealtime ? (
        <figcaption className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-background/85 px-3 py-1.5 font-mono text-[11px] text-foreground/80 tracking-[0.12em] backdrop-blur">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          {l.trans({ en: "1× · real time, not sped up", ko: "1× · 실제 속도, 배속 없음" })}
        </figcaption>
      ) : null}
    </figure>
  );
};
