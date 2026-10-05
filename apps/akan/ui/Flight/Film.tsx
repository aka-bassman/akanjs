"use client";

import { useEffect, useRef } from "react";

interface FilmProps {
  className?: string;
  src: string;
  wideSrc: string;
  poster: string;
}
export const Film = ({ className, src, wideSrc, poster }: FilmProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          video.pause();
          return;
        }
        if (!video.src) video.src = window.innerWidth * Math.min(window.devicePixelRatio, 2) > 1600 ? wideSrc : src;
        if (video.ended) video.currentTime = 0;
        //? a browser may still refuse muted autoplay (data saver, low power); the poster stays in place then
        video.play().catch(() => null);
      },
      { threshold: 0.4 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [src, wideSrc]);

  return (
    <video ref={videoRef} aria-hidden="true" className={className} muted playsInline poster={poster} preload="none" />
  );
};
