import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import styles from "./ImageGrid.module.css";

export type ImageGridProps = HTMLAttributes<HTMLUListElement> & {
  children?: ReactNode;
  /** Fixed column count at all breakpoints. */
  columns?: number;
  columnsPhone?: number;
  columnsTablet?: number;
  columnsDesktop?: number;
  gap?: string;
  emptyMessage?: string;
  as?: "ul" | "div";
};

export function ImageGrid({
  children,
  columns,
  columnsPhone,
  columnsTablet,
  columnsDesktop,
  gap,
  emptyMessage = "No items",
  as = "ul",
  className,
  style,
  ...rest
}: ImageGridProps) {
  const hasChildren =
    children != null && !(Array.isArray(children) && children.length === 0);

  if (!hasChildren) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  const vars: CSSProperties = {
    ...(gap ? ({ "--image-grid-gap": gap } as CSSProperties) : null),
    ...(columnsPhone != null
      ? ({ "--image-grid-cols-phone": columnsPhone } as CSSProperties)
      : null),
    ...(columnsTablet != null
      ? ({ "--image-grid-cols-tablet": columnsTablet } as CSSProperties)
      : null),
    ...(columnsDesktop != null
      ? ({ "--image-grid-cols-desktop": columnsDesktop } as CSSProperties)
      : null),
    ...(columns != null
      ? ({ "--image-grid-cols": columns } as CSSProperties)
      : null),
    ...style,
  };

  const Tag = as;

  return (
    <Tag
      className={cn(styles.grid, className)}
      data-cols={columns ?? undefined}
      style={vars}
      {...(rest as HTMLAttributes<HTMLElement>)}
    >
      {children}
    </Tag>
  );
}

export type ImageGridCellProps = HTMLAttributes<HTMLLIElement> & {
  children?: ReactNode;
  as?: "li" | "div";
};

export function ImageGridCell({
  children,
  as = "li",
  className,
  ...rest
}: ImageGridCellProps) {
  const Tag = as;
  return (
    <Tag
      className={cn(styles.cell, className)}
      {...(rest as HTMLAttributes<HTMLElement>)}
    >
      {children}
    </Tag>
  );
}
