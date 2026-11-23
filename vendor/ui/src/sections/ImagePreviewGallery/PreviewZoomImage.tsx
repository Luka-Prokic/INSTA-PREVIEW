"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type TouchList as ReactTouchList,
} from "react";
import { ImageFallback } from "../../primitives/ImageFallback";
import styles from "./PreviewZoomImage.module.css";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOMED_THRESHOLD = 1.02;
const DEFAULT_ZOOM = 2;

export type PreviewZoomImageHandle = {
  toggleZoom: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  isZoomed: () => boolean;
  pinchStart: (distance: number) => void;
  pinchMove: (distance: number) => void;
  pinchEnd: () => void;
};

function clampScale(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

function pointerDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function previewTransformVars(x: number, y: number, scale: number): CSSProperties {
  return {
    ["--preview-tx" as string]: `${x}px`,
    ["--preview-ty" as string]: `${y}px`,
    ["--preview-scale" as string]: String(scale),
  };
}

export const PreviewZoomImage = forwardRef<
  PreviewZoomImageHandle,
  {
    src: string;
    alt: string;
    active: boolean;
    onZoomChange?: (zoomed: boolean) => void;
  }
>(function PreviewZoomImage({ src, alt, active, onZoomChange }, ref) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [failed, setFailed] = useState(false);

  const scaleRef = useRef(scale);
  const translateRef = useRef(translate);
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const panStartRef = useRef<{
    x: number;
    y: number;
    translateX: number;
    translateY: number;
  } | null>(null);

  const isZoomed = scale > ZOOMED_THRESHOLD;

  const reset = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    pinchStartRef.current = null;
    panStartRef.current = null;
    onZoomChange?.(false);
  }, [onZoomChange]);

  const zoomIn = useCallback(() => {
    setScale((current) => clampScale(Math.max(current, DEFAULT_ZOOM)));
    setTranslate({ x: 0, y: 0 });
  }, []);

  const zoomOut = useCallback(() => {
    reset();
  }, [reset]);

  const toggleZoom = useCallback(() => {
    if (scaleRef.current > ZOOMED_THRESHOLD) {
      reset();
      return;
    }
    zoomIn();
  }, [reset, zoomIn]);

  useImperativeHandle(
    ref,
    () => ({
      toggleZoom,
      zoomIn,
      zoomOut,
      reset,
      isZoomed: () => scaleRef.current > ZOOMED_THRESHOLD,
      pinchStart: (distance: number) => {
        pinchStartRef.current = { distance, scale: scaleRef.current };
      },
      pinchMove: (distance: number) => {
        if (!pinchStartRef.current || pinchStartRef.current.distance <= 0) return;
        setScale(
          clampScale(
            pinchStartRef.current.scale * (distance / pinchStartRef.current.distance),
          ),
        );
      },
      pinchEnd: () => {
        pinchStartRef.current = null;
        if (scaleRef.current <= ZOOMED_THRESHOLD) reset();
      },
    }),
    [reset, toggleZoom, zoomIn, zoomOut],
  );

  useEffect(() => {
    scaleRef.current = scale;
    translateRef.current = translate;
    onZoomChange?.(scale > ZOOMED_THRESHOLD);
  }, [scale, translate, onZoomChange]);

  useEffect(() => {
    if (!active) reset();
  }, [active, reset]);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (scaleRef.current <= ZOOMED_THRESHOLD) return;
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      translateX: translateRef.current.x,
      translateY: translateRef.current.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.stopPropagation();
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panStartRef.current || scaleRef.current <= ZOOMED_THRESHOLD) return;
    setTranslate({
      x: panStartRef.current.translateX + (event.clientX - panStartRef.current.x),
      y: panStartRef.current.translateY + (event.clientY - panStartRef.current.y),
    });
    event.stopPropagation();
  }, []);

  const endPan = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    panStartRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  return (
    <div
      className={isZoomed ? `${styles.surface} ${styles.surfaceZoomed}` : styles.surface}
      data-preview-image
      data-zoomed={isZoomed || undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onClick={(event) => event.stopPropagation()}
    >
      {!src || failed ? (
        <ImageFallback fill label={alt || undefined} />
      ) : (
        // Native img + contain (not Image fill/cover) so lightbox sizing matches GALERIJA_012.
        // eslint-disable-next-line @next/next/no-img-element -- intentional for zoom transform
        <img
          src={src}
          alt={alt}
          className={styles.image}
          style={previewTransformVars(translate.x, translate.y, scale)}
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
});

export function touchPinchDistance(touches: ReactTouchList): number {
  if (touches.length < 2) return 0;
  const first = touches[0];
  const second = touches[1];
  if (!first || !second) return 0;
  return pointerDistance(
    { x: first.clientX, y: first.clientY },
    { x: second.clientX, y: second.clientY },
  );
}
