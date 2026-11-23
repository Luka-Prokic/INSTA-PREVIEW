import { forwardRef, type ElementType, type ForwardedRef } from "react";
import { Text, type TextOwnProps, type TextSize } from "../Text/Text";
import type { PolymorphicComponent, PolymorphicProps } from "../../utils/polymorphic";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const LEVEL_TAGS = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const;

const LEVEL_SIZE: Record<HeadingLevel, TextSize> = {
  1: "2xl",
  2: "xl",
  3: "lg",
  4: "md",
  5: "sm",
  6: "xs",
};

export interface HeadingOwnProps extends Omit<TextOwnProps, "size"> {
  /** Semantic heading level. Defaults to `1`. */
  level?: HeadingLevel;
  /** Override the visual size independently of the semantic level. */
  size?: TextSize;
  /**
   * When set, marks this heading for AppShell chrome title sync
   * (`data-explorer-heading`). Pass the display string (usually the same as children text).
   */
  chromeTitle?: string;
}

export type HeadingProps<E extends ElementType = "h1"> = PolymorphicProps<E, HeadingOwnProps>;

/**
 * Semantic heading built on `Text`. Keeps document outline correct while
 * allowing visual size overrides.
 */
export const Heading = forwardRef(function Heading(
  {
    as,
    level = 1,
    size,
    weight = "semibold",
    tracking = "tighter",
    chromeTitle,
    ...rest
  }: PolymorphicProps<ElementType, HeadingOwnProps>,
  ref: ForwardedRef<Element>,
) {
  const Component = (as ?? LEVEL_TAGS[level]) as ElementType;

  return (
    <Text
      as={Component}
      ref={ref}
      size={size ?? LEVEL_SIZE[level]}
      weight={weight}
      tracking={tracking}
      data-explorer-heading={chromeTitle}
      {...rest}
    />
  );
}) as PolymorphicComponent<"h1", HeadingOwnProps>;
