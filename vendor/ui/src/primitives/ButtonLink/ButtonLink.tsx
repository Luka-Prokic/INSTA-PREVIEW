import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import type { ButtonSize, ButtonTone, ButtonVariant } from "../Button";
import buttonStyles from "../Button/Button.module.css";

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  fullWidth?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  iconOnly?: boolean;
}

/**
 * Anchor that reuses Button visual tokens. Prefer this over `router.push` for
 * portfolio CTAs that navigate.
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  {
    variant = "solid",
    size = "md",
    tone = "neutral",
    fullWidth = false,
    iconStart,
    iconEnd,
    iconOnly = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <a
      ref={ref}
      data-variant={variant}
      data-size={size}
      data-tone={tone}
      className={cn(
        buttonStyles.button,
        fullWidth && buttonStyles.fullWidth,
        iconOnly && buttonStyles.iconOnly,
        className,
      )}
      {...rest}
    >
      {iconStart && (
        <span className={buttonStyles.icon} aria-hidden="true">
          {iconStart}
        </span>
      )}
      {!iconOnly && children != null && (
        <span className={buttonStyles.label}>{children}</span>
      )}
      {iconOnly && (
        <span className={buttonStyles.icon} aria-hidden="true">
          {children}
        </span>
      )}
      {iconEnd && (
        <span className={buttonStyles.icon} aria-hidden="true">
          {iconEnd}
        </span>
      )}
    </a>
  );
});
