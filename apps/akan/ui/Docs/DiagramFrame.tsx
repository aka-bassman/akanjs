"use client";
import { cn } from "akanjs/client";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { diagramMinScale } from "./diagram.util";

// A node's emphasis ring paints outside its own box, and the scroll container clips at its padding edge —
// without this inset the bottom-most or right-most ring is cut in half.
const ringInset = 4;

interface DiagramFrameProps {
  children: ReactNode;
  width: number;
  height: number;
  label?: string;
}

export const DiagramFrame = ({ children, width, height, label }: DiagramFrameProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [clipped, setClipped] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || width <= 0) return;

    const measure = () => {
      const available = scroller.clientWidth - ringInset * 2;
      if (available <= 0) return;
      const ratio = available / width;
      setScale(Math.max(Math.min(1, ratio), diagramMinScale));
      setClipped(ratio < diagramMinScale);
      setAtEnd(scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 8);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    scroller.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", measure);
    };
  }, [width]);

  return (
    <div className="relative">
      {/* 최소 배율까지 줄여도 안 들어가면 가로로 스크롤되므로, 초점 가능한 영역이어야 키보드로도 넘길 수 있다. */}
      <div
        className={cn(
          "overflow-x-auto focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
          clipped && !atEnd && "[mask-image:linear-gradient(to_right,black_calc(100%_-_2.5rem),transparent)]",
        )}
        ref={scrollerRef}
        role="region"
        tabIndex={0}
        aria-label={label}
      >
        <div
          className="mx-auto"
          style={{ height: height * scale + ringInset * 2, width: width * scale + ringInset * 2 }}
        >
          <div
            className="relative origin-top-left"
            style={{
              height,
              marginLeft: ringInset,
              marginTop: ringInset,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
