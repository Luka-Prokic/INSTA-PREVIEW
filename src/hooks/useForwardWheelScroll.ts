"use client";

import { useCallback, type RefObject, type WheelEvent as ReactWheelEvent } from "react";

/** Scroll `scrollRef` when the wheel happens outside it (header, chrome, backdrop). */
export function useForwardWheelScroll(scrollRef: RefObject<HTMLElement | null>) {
  return useCallback(
    (event: WheelEvent | ReactWheelEvent<Element>) => {
      const el = scrollRef.current;
      if (!el) return;
      const target = event.target;
      if (target instanceof Node && el.contains(target)) return;
      const dy =
        event.deltaMode === 1 ? event.deltaY * 16
        : event.deltaMode === 2 ? event.deltaY * el.clientHeight
        : event.deltaY;
      if (dy === 0) return;
      el.scrollTop += dy;
    },
    [scrollRef],
  );
}
