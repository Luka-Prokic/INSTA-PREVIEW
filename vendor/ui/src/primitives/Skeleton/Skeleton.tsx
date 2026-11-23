import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./Skeleton.module.css";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { width, height, circle, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(styles.root, circle && styles.circle, className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height ?? (circle ? undefined : "1em"),
        ...style,
      }}
      aria-hidden
      {...rest}
    />
  );
});
