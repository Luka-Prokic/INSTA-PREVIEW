import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./Spinner.module.css";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  label?: string;
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = "md", label = "Loading", className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(styles.spinner, className)}
      data-size={size}
      role="status"
      aria-label={label}
      {...rest}
    />
  );
});
