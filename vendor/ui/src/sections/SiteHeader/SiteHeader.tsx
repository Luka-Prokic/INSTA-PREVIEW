import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./SiteHeader.module.css";

export interface SiteHeaderProps extends HTMLAttributes<HTMLElement> {
  brand?: ReactNode;
  nav?: ReactNode;
  actions?: ReactNode;
  /** Stick to the top of the viewport. Defaults to true. */
  sticky?: boolean;
  /** Apply frosted chrome (`.caka-glass`). Defaults to true. */
  glass?: boolean;
}

/**
 * Marketing / portfolio site header with brand, nav, and actions slots.
 * Prefer this over AppShell for personal sites.
 */
export const SiteHeader = forwardRef<HTMLElement, SiteHeaderProps>(function SiteHeader(
  {
    brand,
    nav,
    actions,
    sticky = true,
    glass = true,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <header
      ref={ref}
      className={cn(
        styles.header,
        sticky && styles.sticky,
        glass && "caka-glass",
        className,
      )}
      {...rest}
    >
      <div className={styles.inner}>
        {brand != null && <div className={styles.brand}>{brand}</div>}
        {nav != null && <nav className={styles.nav}>{nav}</nav>}
        {actions != null && <div className={styles.actions}>{actions}</div>}
        {children}
      </div>
    </header>
  );
});
