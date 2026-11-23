"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./Tilt.module.css";

export interface TiltProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Max tilt degrees. Defaults to 8. */
  maxTilt?: number;
  perspective?: number;
  /**
   * When true, tracks the pointer across the whole viewport (not only while
   * hovering the element). Defaults to `false`.
   */
  global?: boolean;
  /**
   * How quickly the face eases toward the pointer (higher = snappier).
   * Defaults to `10`.
   */
  smoothing?: number;
}

function tiltFromViewport(clientX: number, clientY: number, maxTilt: number) {
  const px = clientX / window.innerWidth - 0.5;
  const py = clientY / window.innerHeight - 0.5;
  return {
    x: -(py * maxTilt * 2),
    y: px * maxTilt * 2,
  };
}

function tiltFromElement(
  clientX: number,
  clientY: number,
  el: HTMLElement,
  maxTilt: number,
) {
  const rect = el.getBoundingClientRect();
  const px = (clientX - rect.left) / rect.width - 0.5;
  const py = (clientY - rect.top) / rect.height - 0.5;
  return {
    x: -(py * maxTilt * 2),
    y: px * maxTilt * 2,
  };
}

/**
 * Pointer-driven CSS perspective tilt for subtle 3D feel. Eases toward the
 * target so pointer jumps never snap. Disabled for reduced-motion.
 */
export const Tilt = forwardRef<HTMLDivElement, TiltProps>(function Tilt(
  {
    children,
    maxTilt = 8,
    perspective = 800,
    global = false,
    smoothing = 10,
    className,
    style,
    onPointerMove,
    onPointerLeave,
    ...rest
  },
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const currentRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const propsRef = useRef({ maxTilt, perspective, smoothing, reduced, global });
  propsRef.current = { maxTilt, perspective, smoothing, reduced, global };

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  useEffect(() => {
    if (reduced) {
      const el = localRef.current;
      if (el) el.style.transform = "";
      currentRef.current = { x: 0, y: 0 };
      targetRef.current = { x: 0, y: 0 };
      return;
    }

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { perspective: p, smoothing: s } = propsRef.current;
      const alpha = 1 - Math.exp(-s * dt);
      const cur = currentRef.current;
      const tgt = targetRef.current;
      cur.x += (tgt.x - cur.x) * alpha;
      cur.y += (tgt.y - cur.y) * alpha;
      const el = localRef.current;
      if (el) {
        el.style.transform = `perspective(${p}px) rotateX(${cur.x.toFixed(2)}deg) rotateY(${cur.y.toFixed(2)}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  useEffect(() => {
    if (!global || reduced) return;

    const onMove = (event: globalThis.PointerEvent) => {
      if (event.pointerType === "touch") return;
      targetRef.current = tiltFromViewport(
        event.clientX,
        event.clientY,
        propsRef.current.maxTilt,
      );
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [global, reduced]);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (global || reduced || event.pointerType === "touch") return;
    const el = localRef.current;
    if (!el) return;
    targetRef.current = tiltFromElement(
      event.clientX,
      event.clientY,
      el,
      propsRef.current.maxTilt,
    );
  };

  const handleLeave = (event: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    if (global) return;
    targetRef.current = { x: 0, y: 0 };
  };

  const rootStyle: CSSProperties = { ...style };

  return (
    <div
      ref={setRefs}
      className={cn(styles.root, className)}
      data-reduced={reduced || undefined}
      data-global={global || undefined}
      data-animated={!reduced || undefined}
      style={rootStyle}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      {...rest}
    >
      {children}
    </div>
  );
});
