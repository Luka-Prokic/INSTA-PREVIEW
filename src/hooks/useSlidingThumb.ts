"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

export function useSlidingThumb<T extends HTMLElement>(value: string) {
  const rootRef = useRef<T>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0 });
  const [moving, setMoving] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const el = root.querySelector<HTMLElement>(`[data-thumb-item="${CSS.escape(value)}"]`);
    if (!el) return;

    setThumb({ left: el.offsetLeft, width: el.offsetWidth });
    setMoving(true);

    const thumbEl = root.querySelector<HTMLElement>("[data-thumb]");
    if (!thumbEl) return;

    const onEnd = (event: TransitionEvent) => {
      if (event.propertyName === "left" || event.propertyName === "width") {
        setMoving(false);
      }
    };
    thumbEl.addEventListener("transitionend", onEnd);
    return () => thumbEl.removeEventListener("transitionend", onEnd);
  }, [value]);

  const thumbStyle = {
    ["--nav-thumb-left" as string]: `${thumb.left}px`,
    ["--nav-thumb-width" as string]: `${thumb.width}px`,
  } as CSSProperties;

  return { rootRef, moving, thumbStyle };
}
