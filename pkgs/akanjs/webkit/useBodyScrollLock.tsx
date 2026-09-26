"use client";
import { useEffect } from "react";

// Shared by every overlay: with a per-component flag, the first to unmount would unlock a page another still covers.
let lockCount = 0;
let previousOverflow = "";

export const useBodyScrollLock = (active: boolean) => {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    lockCount += 1;
    if (lockCount === 1) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow;
        previousOverflow = "";
      }
    };
  }, [active]);
};
