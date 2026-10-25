"use client";
import { useEffect, useRef } from "react";

interface InViewVideoProps {
  className?: string;
  src: string;
  poster?: string;
}
export const InViewVideo = ({ className, src, poster }: InViewVideoProps) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.at(-1)?.isIntersecting) {
          if (!video.getAttribute("src")) video.src = src;
          // play() rejects under iOS Low Power Mode or when a pause() lands first; the video just stays still.
          video.play().catch(() => undefined);
          return;
        }
        video.pause();
        video.removeAttribute("src");
        video.load();
      },
      { rootMargin: "50% 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);
  return <video className={className} loop muted playsInline poster={poster} preload="none" ref={ref} src={src} />;
};
