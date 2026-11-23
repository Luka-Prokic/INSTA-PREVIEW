"use client";

import {
  useEffect,
  useState,
  type ImgHTMLAttributes,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { cn } from "../../utils/cn";
import { ImageFallback } from "../ImageFallback";
import styles from "./Image.module.css";

export type ImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "width" | "height"
> & {
  /** Null/empty → ImageFallback. */
  src?: string | null;
  alt: string;
  /** Stretch to a positioned parent (same contract as ImageFallback). */
  fill?: boolean;
  width?: number;
  height?: number;
  /** Replace the default fallback surface. */
  fallback?: ReactNode;
  fallbackClassName?: string;
  /** Optional mark for the default fallback. */
  fallbackMark?: ReactNode;
  /** Fade in on load. Default true. */
  fade?: boolean;
};

function hasSrc(src: ImageProps["src"]): src is string {
  return typeof src === "string" && src.trim().length > 0;
}

/**
 * Collection image - native `<img>` with ImageFallback on missing/broken src.
 */
export function Image({
  className,
  fallback,
  fallbackClassName,
  fallbackMark,
  fade = true,
  fill = false,
  src,
  alt,
  width,
  height,
  onLoad,
  onError,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const missing = !hasSrc(src);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  if (missing || failed) {
    if (fallback != null) return <>{fallback}</>;

    return (
      <ImageFallback
        fill={fill}
        width={width}
        height={height}
        mark={fallbackMark}
        label={alt || undefined}
        className={cn(className, fallbackClassName)}
      />
    );
  }

  function handleLoad(event: SyntheticEvent<HTMLImageElement>) {
    setLoaded(true);
    onLoad?.(event);
  }

  function handleError(event: SyntheticEvent<HTMLImageElement>) {
    setFailed(true);
    onError?.(event);
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- package stays framework-agnostic
    <img
      {...props}
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      onLoad={handleLoad}
      onError={handleError}
      ref={(node) => {
        if (!node?.complete) return;
        if (node.naturalWidth === 0) {
          setFailed(true);
          return;
        }
        setLoaded(true);
      }}
      className={cn(
        fill && styles.fill,
        fade && styles.fade,
        fade && loaded && styles.loaded,
        className,
      )}
    />
  );
}
