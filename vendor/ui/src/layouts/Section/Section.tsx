import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Container } from "../Container";
import styles from "./Section.module.css";

export type SectionProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
  /** Root element. Default `section`. */
  as?: ElementType;
  /** Canvas band or ink (secondary) band. Default `light`. */
  tone?: "light" | "ink";
  /** Outer block padding from `--section-pad-block`. Default `default`. */
  pad?: "default" | "none";
  /**
   * Horizontal measure.
   * - `content` / `narrow`: wrap children in `Container`
   * - `page`: `--page-pad-inline`, capped by `--page-max`
   * - `none`: leave measure to the caller
   * Default `content`.
   */
  measure?: "content" | "narrow" | "page" | "none";
};

/**
 * Page band with prescribed block padding and optional content measure.
 * Same layout API as Lavanda Section; Caka surface tokens for skin.
 */
export function Section({
  children,
  as: Comp = "section",
  tone = "light",
  pad = "default",
  measure = "content",
  className,
  ...rest
}: SectionProps) {
  const body =
    measure === "none" ? (
      children
    ) : measure === "page" ? (
      <div className={styles.page}>{children}</div>
    ) : (
      <Container narrow={measure === "narrow"}>{children}</Container>
    );

  return (
    <Comp
      className={cn(
        styles.root,
        pad === "default" && styles.pad,
        tone === "ink" ? styles.ink : styles.light,
        className,
      )}
      {...rest}
    >
      {body}
    </Comp>
  );
}
