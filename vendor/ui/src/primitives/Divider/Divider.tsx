import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./Divider.module.css";

export type DividerProps = HTMLAttributes<HTMLHRElement> & {
  /** Spacing density around the rule. */
  spacing?: "none" | "sm" | "md";
};

/**
 * Horizontal rule for separating chrome sections (side nav blocks, etc.).
 */
export const Divider = forwardRef<HTMLHRElement, DividerProps>(function Divider(
  { spacing = "sm", className, ...rest },
  ref,
) {
  return (
    <hr
      ref={ref}
      className={cn(styles.divider, className)}
      data-spacing={spacing}
      {...rest}
    />
  );
});
