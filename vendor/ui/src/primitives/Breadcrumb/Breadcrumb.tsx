import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Link } from "../Link";
import styles from "./Breadcrumb.module.css";

export type BreadcrumbItem = {
  label: ReactNode;
  href?: string;
};

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: ReactNode;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  { items, separator = "/", className, ...rest },
  ref,
) {
  return (
    <nav ref={ref} className={cn(styles.nav, className)} aria-label="Breadcrumb" {...rest}>
      <ol className={styles.list}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className={styles.item}>
              {i > 0 && <span className={styles.sep} aria-hidden>{separator}</span>}
              {last || !item.href ? (
                <span className={styles.current} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} variant="quiet" className={styles.link}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
