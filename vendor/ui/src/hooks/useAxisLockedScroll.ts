"use client";

import { useEffect, type RefObject } from "react";

const INTENT_THRESHOLD_PX = 8;

/**
 * Lets a horizontal scroll strip share touch gestures with the page:
 * vertical drags scroll the page, horizontal drags scroll the strip.
 */
export function useAxisLockedScroll(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    let startX = 0;
    let startY = 0;
    let axis: "x" | "y" | null = null;

    const reset = () => {
      axis = null;
      element.style.removeProperty("overflow-x");
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        reset();
        return;
      }

      const touch = event.touches[0];
      if (!touch) return;

      startX = touch.clientX;
      startY = touch.clientY;
      axis = null;
      element.style.removeProperty("overflow-x");
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        reset();
        return;
      }

      const touch = event.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (!axis) {
        if (
          Math.abs(deltaX) < INTENT_THRESHOLD_PX &&
          Math.abs(deltaY) < INTENT_THRESHOLD_PX
        ) {
          return;
        }
        axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
      }

      if (axis === "y") {
        element.style.overflowX = "hidden";
        return;
      }

      element.style.removeProperty("overflow-x");
    };

    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: true });
    element.addEventListener("touchend", reset, { passive: true });
    element.addEventListener("touchcancel", reset, { passive: true });

    return () => {
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
      element.removeEventListener("touchend", reset);
      element.removeEventListener("touchcancel", reset);
      element.style.removeProperty("overflow-x");
    };
  }, [ref, enabled]);
}
