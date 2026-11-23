import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./IconButton.module.css";

export type IconButtonVariant = "solid" | "ghost";
export type IconButtonSize = "sm" | "md" | "lg";
export type IconButtonRadius = "sharp" | "pill";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name - required because there is no visible label. */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Chrome / sidebar toggles use `sharp`; floating FAB defaults to `pill`. */
  radius?: IconButtonRadius;
  children: ReactNode;
}

/**
 * Icon-only control. Sharp radius is for explorer chrome; pill matches other Caka actions.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      variant = "ghost",
      size = "md",
      radius = "sharp",
      type = "button",
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(styles.button, className)}
        data-variant={variant}
        data-size={size}
        data-radius={radius}
        {...rest}
      >
        <span className={styles.icon} aria-hidden="true">
          {children}
        </span>
      </button>
    );
  },
);
