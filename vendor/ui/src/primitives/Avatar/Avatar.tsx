import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./Avatar.module.css";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
}

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, alt, name, size = "md", className, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cn(styles.root, className)} data-size={size} {...rest}>
      {src ? (
        <img src={src} alt={alt ?? name ?? ""} className={styles.image} />
      ) : (
        <span className={styles.fallback} aria-hidden={name ? undefined : true}>
          {initials(name)}
        </span>
      )}
    </span>
  );
});
