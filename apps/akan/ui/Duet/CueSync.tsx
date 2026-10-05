"use client";
import { type ReactNode, useEffect, useRef } from "react";

interface CueSyncProps {
  className?: string;
  children: ReactNode;
}
export const CueSync = ({ className, children }: CueSyncProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const video = ref.current?.querySelector("video");
    const cues = [...(ref.current?.querySelectorAll<HTMLElement>("[data-cue-start]") ?? [])];
    if (!video) return;
    const sync = () => {
      for (const cue of cues) {
        const isActive =
          video.currentTime >= Number(cue.dataset.cueStart) && video.currentTime < Number(cue.dataset.cueEnd);
        cue.toggleAttribute("data-active", isActive);
      }
    };
    sync();
    video.addEventListener("timeupdate", sync);
    return () => video.removeEventListener("timeupdate", sync);
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};
