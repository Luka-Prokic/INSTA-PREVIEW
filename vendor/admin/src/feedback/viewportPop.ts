"use client";

import { useId, type CSSProperties } from "react";
import styles from "./ViewportPop.module.css";

type AnchorStyle = CSSProperties & { anchorName?: string; positionAnchor?: string };

/** Unique CSS anchor pair so position-try can flip the pop inside the viewport. No layout JS. */
export function useViewportPopAnchor() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const name = `--admin-pop-${id}`;
  return {
    className: styles.pop,
    anchorProps: { style: { anchorName: name } satisfies AnchorStyle },
    popProps: { style: { positionAnchor: name } satisfies AnchorStyle },
  };
}

/** Clamp a fixed/absolute box into the viewport. Pure — call from place handlers, not effects. */
export function clampToViewport(
  left: number,
  top: number,
  width: number,
  height: number,
  viewW: number,
  viewH: number,
  margin = 8,
) {
  let x = left;
  let y = top;
  if (x < margin) x = margin;
  if (x + width > viewW - margin) x = Math.max(margin, viewW - margin - width);
  if (y < margin) y = margin;
  if (y + height > viewH - margin) y = Math.max(margin, viewH - margin - height);
  return { left: x, top: y };
}
