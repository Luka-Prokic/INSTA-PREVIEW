import {
  forwardRef,
  type CSSProperties,
  type ElementType,
  type ForwardedRef,
} from "react";
import { cn } from "../../utils/cn";
import type { PolymorphicComponent, PolymorphicProps } from "../../utils/polymorphic";
import styles from "./Text.module.css";

export type TextSize =
  | "2xs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl";
export type TextWeight = "regular" | "medium" | "semibold" | "bold";
export type TextTone =
  | "default"
  | "muted"
  | "subtle"
  | "primary"
  | "on-accent"
  | "success"
  | "warning"
  | "danger"
  | "info";
export type TextAlign = "start" | "center" | "end";
export type TextTransform = "none" | "uppercase" | "capitalize";
export type TextTracking =
  | "tighter"
  | "tight"
  | "normal"
  | "wide"
  | "wider"
  | "caps";

export interface TextOwnProps {
  size?: TextSize;
  weight?: TextWeight;
  tone?: TextTone;
  align?: TextAlign;
  transform?: TextTransform;
  /** Letter-spacing token. Uppercase defaults to `wider` unless set. */
  tracking?: TextTracking;
  /** Truncate to a single line with an ellipsis. */
  truncate?: boolean;
  /** Clamp to N lines with an ellipsis. Overrides `truncate`. */
  lineClamp?: number;
}

export type TextProps<E extends ElementType = "p"> = PolymorphicProps<E, TextOwnProps>;

/**
 * Text is the typographic primitive. Choose the rendered element with `as`
 * (keeping document semantics correct) independently of the visual `size`.
 */
export const Text = forwardRef(function Text(
  {
    as,
    size = "md",
    weight,
    tone = "default",
    align,
    transform,
    tracking,
    truncate = false,
    lineClamp,
    className,
    style,
    ...rest
  }: PolymorphicProps<ElementType, TextOwnProps>,
  ref: ForwardedRef<Element>,
) {
  const Component = (as ?? "p") as ElementType;
  const textStyle: CSSProperties = {
    ...(lineClamp ? { ["--text-clamp" as string]: String(lineClamp) } : null),
    ...(style as CSSProperties),
  };
  const resolvedTracking =
    tracking ??
    (transform === "uppercase" ? "wider" : undefined);

  return (
    <Component
      ref={ref}
      className={cn(
        styles.text,
        truncate && !lineClamp && styles.truncate,
        lineClamp && styles.clamp,
        className,
      )}
      data-size={size}
      data-weight={weight}
      data-tone={tone}
      data-align={align}
      data-transform={transform && transform !== "none" ? transform : undefined}
      data-tracking={resolvedTracking}
      style={textStyle}
      {...rest}
    />
  );
}) as PolymorphicComponent<"p", TextOwnProps>;
