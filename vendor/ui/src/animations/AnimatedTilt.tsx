"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./Tilt.module.css";

export interface AnimatedTiltProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Max tilt degrees (idle amp + pointer). Defaults to 8. */
  maxTilt?: number;
  perspective?: number;
  /**
   * Idle orbit period in seconds (soft full cycle). Defaults to `12`.
   * Two out-of-phase sines keep the card alive without a rigid loop feel.
   */
  period?: number;
  /**
   * When true, tracks the pointer across the whole viewport. After the pointer
   * stops moving for `idleDelay`, idle orbit resumes from the current pose.
   * Defaults to `false`.
   */
  global?: boolean;
  /** ms to wait after pointer stops before idle resumes (global). Defaults to `1000`. */
  idleDelay?: number;
  /**
   * How quickly the face eases toward pointer / idle targets (higher = snappier).
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

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Idle-breathing perspective tilt with smooth handoff to pointer tracking.
 * Idle orbits are phase-matched to the current pose so resume never snaps.
 * Pointer targets ease in - no stutter to the cursor.
 */
export const AnimatedTilt = forwardRef<HTMLDivElement, AnimatedTiltProps>(
  function AnimatedTilt(
    {
      children,
      maxTilt = 8,
      perspective = 800,
      period = 12,
      global = false,
      idleDelay = 1000,
      smoothing = 10,
      className,
      style,
      onPointerEnter,
      onPointerMove,
      onPointerLeave,
      ...rest
    },
    forwardedRef,
  ) {
    const shellRef = useRef<HTMLDivElement | null>(null);
    const faceRef = useRef<HTMLDivElement | null>(null);
    const trackingRef = useRef(false);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentRef = useRef({ x: 0, y: 0 });
    const targetRef = useRef({ x: 0, y: 0 });
    /** Idle phases so orbit passes through the pose at resume. */
    const idlePhaseRef = useRef({ x: 0, y: 0, origin: 0 });
    const reduced = usePrefersReducedMotion();
    const [finePointer, setFinePointer] = useState(false);

    const propsRef = useRef({
      maxTilt,
      perspective,
      period,
      smoothing,
      reduced,
      global,
      idleDelay,
    });
    propsRef.current = {
      maxTilt,
      perspective,
      period,
      smoothing,
      reduced,
      global,
      idleDelay,
    };

    const clearIdleTimer = () => {
      if (idleTimerRef.current != null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };

    const beginIdleFromCurrent = (now = performance.now()) => {
      const { maxTilt: amp } = propsRef.current;
      const ampX = amp * 0.85;
      const ampY = amp;
      const cur = currentRef.current;
      idlePhaseRef.current = {
        x: Math.asin(clamp(ampX === 0 ? 0 : cur.x / ampX, -1, 1)),
        y: Math.acos(clamp(ampY === 0 ? 0 : cur.y / ampY, -1, 1)),
        origin: now,
      };
      trackingRef.current = false;
    };

    const armIdleResume = () => {
      clearIdleTimer();
      idleTimerRef.current = setTimeout(() => {
        idleTimerRef.current = null;
        beginIdleFromCurrent();
      }, Math.max(0, propsRef.current.idleDelay));
    };

    useEffect(() => {
      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      const apply = () => setFinePointer(mq.matches);
      apply();
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }, []);

    const canAnimate = finePointer && !reduced;

    useEffect(() => {
      if (!canAnimate) {
        trackingRef.current = false;
        currentRef.current = { x: 0, y: 0 };
        targetRef.current = { x: 0, y: 0 };
        const face = faceRef.current;
        if (face) face.style.transform = "";
        return;
      }

      beginIdleFromCurrent();
      let raf = 0;
      let last = performance.now();

      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const {
          maxTilt: amp,
          period: per,
          perspective: p,
          smoothing: s,
        } = propsRef.current;

        if (!trackingRef.current) {
          const speed = (Math.PI * 2) / Math.max(0.5, per);
          const t = ((now - idlePhaseRef.current.origin) / 1000) * speed;
          const phase = idlePhaseRef.current;
          targetRef.current = {
            x: Math.sin(t + phase.x) * amp * 0.85,
            y: Math.cos(t * 0.72 + phase.y) * amp,
          };
        }

        const alpha = 1 - Math.exp(-s * dt);
        const cur = currentRef.current;
        const tgt = targetRef.current;
        cur.x += (tgt.x - cur.x) * alpha;
        cur.y += (tgt.y - cur.y) * alpha;

        const face = faceRef.current;
        if (face) {
          face.style.transform = `perspective(${p}px) rotateX(${cur.x.toFixed(2)}deg) rotateY(${cur.y.toFixed(2)}deg)`;
        }

        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(raf);
        clearIdleTimer();
      };
    }, [canAnimate]);

    useEffect(() => {
      if (!global || !canAnimate) return;

      const onMove = (event: globalThis.PointerEvent) => {
        if (event.pointerType === "touch") return;
        trackingRef.current = true;
        targetRef.current = tiltFromViewport(
          event.clientX,
          event.clientY,
          propsRef.current.maxTilt,
        );
        armIdleResume();
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      return () => {
        window.removeEventListener("pointermove", onMove);
        clearIdleTimer();
      };
    }, [canAnimate, global]);

    const setShellRefs = (node: HTMLDivElement | null) => {
      shellRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    const handleEnter = (event: PointerEvent<HTMLDivElement>) => {
      onPointerEnter?.(event);
      if (global || reduced || event.pointerType === "touch") return;
      trackingRef.current = true;
      clearIdleTimer();
    };

    const handleMove = (event: PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event);
      if (global || reduced || event.pointerType === "touch") return;
      trackingRef.current = true;
      clearIdleTimer();
      const el = shellRef.current;
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
      clearIdleTimer();
      beginIdleFromCurrent();
    };

    return (
      <div
        ref={setShellRefs}
        className={cn(styles.shell, className)}
        style={style}
        data-global={global || undefined}
        onPointerEnter={handleEnter}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        {...rest}
      >
        <div
          ref={faceRef}
          className={cn(styles.root, styles.animated)}
          data-reduced={reduced || undefined}
          data-animated={canAnimate || undefined}
        >
          {children}
        </div>
      </div>
    );
  },
);
