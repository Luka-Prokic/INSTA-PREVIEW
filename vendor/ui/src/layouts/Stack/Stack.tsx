import {
  forwardRef,
  type CSSProperties,
  type ElementType,
  type ForwardedRef,
} from "react";
import { cn } from "../../utils/cn";
import type { PolymorphicComponent, PolymorphicProps } from "../../utils/polymorphic";
import type { SpaceScale } from "../Box/Box";
import styles from "./Stack.module.css";

export type StackDirection = "row" | "column" | "row-reverse" | "column-reverse";
export type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type StackJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

export interface StackOwnProps {
  /** Main-axis direction. Defaults to `column`. */
  direction?: StackDirection;
  /** Gap between children, from the spacing scale. */
  gap?: SpaceScale;
  /** Cross-axis alignment (`align-items`). */
  align?: StackAlign;
  /** Main-axis distribution (`justify-content`). */
  justify?: StackJustify;
  /** Allow children to wrap. Defaults to `false`. */
  wrap?: boolean;
  /** Render as `inline-flex` instead of `flex`. */
  inline?: boolean;
}

export type StackProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  StackOwnProps
>;

/**
 * Stack arranges children along one axis with a token-based gap. It replaces
 * repeated flexbox boilerplate across the framework.
 */
export const Stack = forwardRef(function Stack(
  {
    as,
    direction = "column",
    gap,
    align,
    justify,
    wrap = false,
    inline = false,
    className,
    style,
    ...rest
  }: PolymorphicProps<ElementType, StackOwnProps>,
  ref: ForwardedRef<Element>,
) {
  const Component = (as ?? "div") as ElementType;
  const stackStyle: CSSProperties = {
    ...(gap !== undefined ? { ["--stack-gap" as string]: `var(--space-${gap})` } : null),
    ...(style as CSSProperties),
  };

  return (
    <Component
      ref={ref}
      className={cn(styles.stack, inline && styles.inline, className)}
      data-direction={direction}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap ? "wrap" : "nowrap"}
      style={stackStyle}
      {...rest}
    />
  );
}) as PolymorphicComponent<"div", StackOwnProps>;
