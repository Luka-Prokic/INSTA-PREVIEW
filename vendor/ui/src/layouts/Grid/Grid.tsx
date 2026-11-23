import {
  forwardRef,
  type CSSProperties,
  type ElementType,
  type ForwardedRef,
} from "react";
import { cn } from "../../utils/cn";
import type { PolymorphicComponent, PolymorphicProps } from "../../utils/polymorphic";
import type { SpaceScale } from "../Box/Box";
import styles from "./Grid.module.css";

export interface GridOwnProps {
  /**
   * Number of equal columns, or an explicit `grid-template-columns` value.
   * A number `n` expands to `repeat(n, minmax(0, 1fr))`.
   */
  columns?: number | string;
  /** Gap between cells, from the spacing scale. */
  gap?: SpaceScale;
  /** Minimum column width for a responsive auto-fit grid (e.g. "16rem"). */
  minColumnWidth?: string;
  /** Render as `inline-grid`. */
  inline?: boolean;
}

export type GridProps<E extends ElementType = "div"> = PolymorphicProps<E, GridOwnProps>;

function resolveColumns(
  columns: number | string | undefined,
  minColumnWidth: string | undefined,
): string | undefined {
  if (minColumnWidth) {
    return `repeat(auto-fit, minmax(min(${minColumnWidth}, 100%), 1fr))`;
  }
  if (typeof columns === "number") {
    return `repeat(${columns}, minmax(0, 1fr))`;
  }
  return columns;
}

/**
 * Grid lays children out on a CSS grid. Pass `columns` for a fixed count or
 * `minColumnWidth` for a responsive auto-fit grid without media queries.
 */
export const Grid = forwardRef(function Grid(
  {
    as,
    columns,
    gap,
    minColumnWidth,
    inline = false,
    className,
    style,
    ...rest
  }: PolymorphicProps<ElementType, GridOwnProps>,
  ref: ForwardedRef<Element>,
) {
  const Component = (as ?? "div") as ElementType;
  const cols = resolveColumns(columns, minColumnWidth);
  const gridStyle: CSSProperties = {
    ...(cols ? { ["--grid-cols" as string]: cols } : null),
    ...(gap !== undefined ? { ["--grid-gap" as string]: `var(--space-${gap})` } : null),
    ...(style as CSSProperties),
  };

  return (
    <Component
      ref={ref}
      className={cn(styles.grid, inline && styles.inline, className)}
      style={gridStyle}
      {...rest}
    />
  );
}) as PolymorphicComponent<"div", GridOwnProps>;
