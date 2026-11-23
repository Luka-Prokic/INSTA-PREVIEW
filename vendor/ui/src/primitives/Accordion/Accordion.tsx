"use client";

import { useId, type DetailsHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Accordion.module.css";

export type AccordionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Accordion({ children, className, ...rest }: AccordionProps) {
  return (
    <div className={cn(styles.root, className)} {...rest}>
      {children}
    </div>
  );
}

export type AccordionItemProps = DetailsHTMLAttributes<HTMLDetailsElement> & {
  title: ReactNode;
  children: ReactNode;
};

export function AccordionItem({ title, children, className, ...rest }: AccordionItemProps) {
  const id = useId();
  return (
    <details className={cn(styles.item, className)} {...rest}>
      <summary className={styles.summary} id={id}>
        <span>{title}</span>
        <span className={styles.chevron} aria-hidden />
      </summary>
      <div className={styles.panel}>{children}</div>
    </details>
  );
}
