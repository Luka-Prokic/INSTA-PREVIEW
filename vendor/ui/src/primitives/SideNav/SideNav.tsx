import {
  forwardRef,
  type ElementType,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import type { PolymorphicComponent, PolymorphicProps } from "../../utils/polymorphic";
import { Eyebrow } from "../Eyebrow";
import styles from "./SideNav.module.css";

export type SideNavProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
  /** Horizontal inset used by flush links (matches padding). */
  inset?: string;
};

export const SideNav = forwardRef<HTMLElement, SideNavProps>(function SideNav(
  { children, className, inset = "1rem", style, ...rest },
  ref,
) {
  return (
    <nav
      ref={ref}
      className={cn(styles.root, className)}
      style={{ ["--sidenav-inset" as string]: inset, ...style }}
      {...rest}
    >
      {children}
    </nav>
  );
});

export type SideNavSectionProps = HTMLAttributes<HTMLDivElement> & {
  /** Optional uppercase section label. */
  label?: string;
  children: ReactNode;
};

export const SideNavSection = forwardRef<HTMLDivElement, SideNavSectionProps>(
  function SideNavSection({ label, children, className, ...rest }, ref) {
    return (
      <div ref={ref} className={cn(styles.section, className)} {...rest}>
        {label ? (
          <Eyebrow variant="nav" className={styles.heading}>
            {label}
          </Eyebrow>
        ) : null}
        {children}
      </div>
    );
  },
);

export type SideNavListProps = HTMLAttributes<HTMLUListElement>;

export const SideNavList = forwardRef<HTMLUListElement, SideNavListProps>(
  function SideNavList({ className, ...rest }, ref) {
    return <ul ref={ref} className={cn(styles.list, className)} {...rest} />;
  },
);

export interface SideNavLinkOwnProps {
  /** Marks the current page / active collection. */
  current?: boolean;
}

export type SideNavLinkProps<E extends ElementType = "a"> = PolymorphicProps<
  E,
  SideNavLinkOwnProps
>;

/**
 * Sharp flush nav link (secondary fill when current). Use `as={Link}` with Next.js.
 */
export const SideNavLink = forwardRef(function SideNavLink(
  {
    as,
    current = false,
    className,
    children,
    ...rest
  }: PolymorphicProps<ElementType, SideNavLinkOwnProps>,
  ref: ForwardedRef<Element>,
) {
  const Component = (as ?? "a") as ElementType;

  return (
    <li className={styles.item}>
      <Component
        ref={ref}
        className={cn(styles.link, className)}
        aria-current={current ? "page" : undefined}
        data-active={current || undefined}
        {...rest}
      >
        {children}
      </Component>
    </li>
  );
}) as PolymorphicComponent<"a", SideNavLinkOwnProps>;
