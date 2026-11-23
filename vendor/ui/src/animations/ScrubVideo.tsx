"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  type VideoHTMLAttributes,
} from "react";
import { cn } from "../utils/cn";
import { useScrollProgress } from "./useScrollProgress";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./ScrubVideo.module.css";

export interface ScrubVideoProps
  extends Omit<VideoHTMLAttributes<HTMLVideoElement>, "controls"> {
  /** Wrapper class for the scroll-measured section. */
  containerClassName?: string;
}

/**
 * Maps section scroll progress (0-1) to `video.currentTime`. Falls back to
 * poster / first frame when reduced-motion is preferred.
 */
export const ScrubVideo = forwardRef<HTMLVideoElement, ScrubVideoProps>(
  function ScrubVideo({ containerClassName, className, poster, muted = true, playsInline = true, ...rest }, forwardedRef) {
    const sectionRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const progress = useScrollProgress(sectionRef, { start: 1, end: 0 });
    const reduced = usePrefersReducedMotion();

    useEffect(() => {
      const video = videoRef.current;
      if (!video || reduced) return;

      const apply = () => {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        video.pause();
        video.currentTime = progress * video.duration;
      };

      if (video.readyState >= 1) apply();
      else video.addEventListener("loadedmetadata", apply, { once: true });

      apply();
    }, [progress, reduced]);

    const setVideoRef = (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    return (
      <div
        ref={sectionRef}
        className={cn(styles.section, containerClassName)}
        data-reduced={reduced || undefined}
      >
        <video
          ref={setVideoRef}
          className={cn(styles.video, "caka-media", className)}
          muted={muted}
          playsInline={playsInline}
          preload="auto"
          poster={poster}
          tabIndex={-1}
          aria-hidden={reduced ? undefined : true}
          {...rest}
        />
      </div>
    );
  },
);
