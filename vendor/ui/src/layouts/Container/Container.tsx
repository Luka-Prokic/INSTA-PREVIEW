import { forwardRef, type ElementType, type ForwardedRef } from "react";
import { cn } from "../../utils/cn";
import type { PolymorphicComponent, PolymorphicProps } from "../../utils/polymorphic";
import styles from "./Container.module.css";

/**
 * @deprecated Prefer `narrow` + Section `measure`. Mapped to content / narrow / full.
 */
export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ContainerOwnProps {
  /** Cap at 48rem instead of `--content-max`. */
  narrow?: boolean;
  /**
   * @deprecated Prefer `narrow`. `sm`/`md` → narrow; `lg`/`xl` → content; `full` → uncapped.
   */
  size?: ContainerSize;
}

export type ContainerProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  ContainerOwnProps
>;

function resolveNarrow(narrow: boolean | undefined, size: ContainerSize | undefined): boolean {
  if (narrow != null) return narrow;
  return size === "sm" || size === "md";
}

/**
 * Centers content with Lavanda measure math:
 * `width: min(100% - 2×gutter, content-max)`.
 */
export const Container = forwardRef(function Container(
  {
    as,
    narrow,
    size,
    className,
    ...rest
  }: PolymorphicProps<ElementType, ContainerOwnProps>,
  ref: ForwardedRef<Element>,
) {
  const Component = (as ?? "div") as ElementType;
  const isNarrow = resolveNarrow(narrow, size);
  const isFull = size === "full" && narrow == null;

  return (
    <Component
      ref={ref}
      className={cn(
        styles.root,
        isNarrow && styles.narrow,
        isFull && styles.full,
        className,
      )}
      {...rest}
    />
  );
}) as PolymorphicComponent<"div", ContainerOwnProps>;
