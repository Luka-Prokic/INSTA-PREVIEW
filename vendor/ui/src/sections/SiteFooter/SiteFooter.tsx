import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Divider } from "../../primitives/Divider";
import styles from "./SiteFooter.module.css";

export interface SiteFooterProps extends HTMLAttributes<HTMLElement> {
  /** Primary column content (brand, short blurb). */
  brand?: ReactNode;
  /** Nav / link columns. */
  nav?: ReactNode;
  /** Bottom meta row (legal, social). */
  meta?: ReactNode;
}

/**
 * Quiet portfolio/marketing footer with optional brand, nav, and meta slots.
 */
export const SiteFooter = forwardRef<HTMLElement, SiteFooterProps>(function SiteFooter(
  { brand, nav, meta, className, children, ...rest },
  ref,
) {
  return (
    <footer ref={ref} className={cn(styles.footer, className)} {...rest}>
      <div className={styles.inner}>
        {(brand != null || nav != null) && (
          <div className={styles.top}>
            {brand != null && <div className={styles.brand}>{brand}</div>}
            {nav != null && <div className={styles.nav}>{nav}</div>}
          </div>
        )}
        {children}
        {(meta != null || brand != null || nav != null) && (
          <Divider spacing="none" className={styles.rule} />
        )}
        {meta != null && <div className={styles.meta}>{meta}</div>}
      </div>
    </footer>
  );
});
