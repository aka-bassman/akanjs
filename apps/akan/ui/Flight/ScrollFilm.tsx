"use client";

import { cn } from "akanjs/client";
import { type ReactNode, useEffect, useRef } from "react";

interface ScrollFilmProps {
  className?: string;
  boxClassName?: string;
  canvasClassName?: string;
  frameCount: number;
  frameRoot: string;
  sizes: [string, string];
  track: [number, number][];
  stageStops: number[];
  backdrop?: ReactNode;
  poster: ReactNode;
  overlay?: ReactNode;
  children?: ReactNode;
}
export const ScrollFilm = ({
  className,
  boxClassName,
  canvasClassName,
  frameCount,
  frameRoot,
  sizes,
  track,
  stageStops,
  backdrop,
  poster,
  overlay,
  children,
}: ScrollFilmProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const section = root?.parentElement;
    const context = canvas?.getContext("2d");
    if (!root || !box || !canvas || !section || !context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const restFrames = track.map(([, frame]) => frame);
    const frames: (HTMLImageElement | null)[] = new Array(frameCount).fill(null);
    let raf = 0;
    let drawn = "";
    let disposed = false;
    let started = false;

    const frameAt = (progress: number) => {
      for (let idx = 1; idx < track.length; idx += 1) {
        const [p0, f0] = track[idx - 1];
        const [p1, f1] = track[idx];
        if (progress <= p1) return p1 === p0 ? f1 : f0 + ((f1 - f0) * (progress - p0)) / (p1 - p0);
      }
      return track[track.length - 1][1];
    };
    const nearestLoaded = (target: number) => {
      for (let offset = 0; offset < frameCount; offset += 1) {
        if (frames[target - offset]) return target - offset;
        if (frames[target + offset]) return target + offset;
      }
      return -1;
    };
    const progressOf = () => {
      const rect = section.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      return travel > 0 ? Math.min(Math.max(-rect.top / travel, 0), 1) : 0;
    };

    const draw = () => {
      raf = 0;
      const progress = progressOf();
      const stage = stageStops.filter((stop) => progress >= stop).length;
      if (root.dataset.stage !== String(stage)) root.dataset.stage = String(stage);
      root.style.setProperty("--p", progress.toFixed(4));
      root.style.setProperty("--pct", String(Math.round(progress * 100)));
      const exact = frameAt(progress);
      const target = reduced
        ? restFrames.reduce((best, frame) => (Math.abs(frame - exact) < Math.abs(best - exact) ? frame : best))
        : exact;
      const base = Math.floor(target);
      const blend = reduced ? 0 : target - base;
      const index = nearestLoaded(base);
      const image = frames[index];
      canvas.style.opacity = target < 0.5 || !image ? "0" : "1";
      if (!image) return;
      const next = frames[index + 1];
      const mixed = next && index === base && blend > 0.04;
      const key = `${index}:${mixed ? blend.toFixed(2) : 0}:${canvas.width}x${canvas.height}`;
      if (key === drawn) return;
      drawn = key;
      context.globalAlpha = 1;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (mixed) {
        context.globalAlpha = blend;
        context.drawImage(next, 0, 0, canvas.width, canvas.height);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio, 2, 1600 / Math.max(box.clientWidth, 1));
      canvas.width = Math.round(box.clientWidth * scale);
      canvas.height = Math.round(box.clientHeight * scale);
      drawn = "";
      schedule();
    };

    const load = () => {
      if (started) return;
      started = true;
      const wide = box.clientWidth * Math.min(window.devicePixelRatio, 2) > 1100;
      const sizeDir = wide ? sizes[0] : sizes[1];
      const order: number[] = [];
      const seen = new Set<number>();
      for (const step of [16, 8, 4, 2, 1])
        for (let idx = 0; idx < frameCount; idx += step)
          if (!seen.has(idx)) {
            seen.add(idx);
            order.push(idx);
          }
      let cursor = 0;
      const lane = async () => {
        while (!disposed && cursor < order.length) {
          const idx = order[cursor];
          cursor += 1;
          const img = new Image();
          img.decoding = "async";
          img.src = `${frameRoot}/${sizeDir}/${String(idx + 1).padStart(3, "0")}.webp`;
          try {
            await img.decode();
          } catch {
            continue;
          }
          if (disposed) return;
          frames[idx] = img;
          drawn = "";
          schedule();
        }
      };
      for (let count = 0; count < 4; count += 1) void lane();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          load();
          observer.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    observer.observe(section);

    resize();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
    };
  }, [frameCount, frameRoot, sizes, track, stageStops]);

  return (
    <div ref={rootRef} className={cn("flt-stage", className)} data-stage="0">
      {backdrop}
      <div ref={boxRef} className={boxClassName}>
        {poster}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={cn("absolute inset-0 size-full opacity-0", canvasClassName)}
        />
        {overlay}
      </div>
      {children}
    </div>
  );
};
