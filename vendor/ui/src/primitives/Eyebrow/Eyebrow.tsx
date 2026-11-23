import { forwardRef, type ElementType, type ForwardedRef } from "react";
import { Text, type TextOwnProps } from "../Text/Text";
import type { PolymorphicComponent, PolymorphicProps } from "../../utils/polymorphic";

export type EyebrowVariant = "nav" | "section";

export interface EyebrowOwnProps extends Omit<TextOwnProps, "size" | "transform" | "tracking"> {
  /**
   * `nav` - side-nav section labels (2xs + caps tracking).
   * `section` - demo / in-page section labels (xs + wider tracking).
   */
  variant?: EyebrowVariant;
}

export type EyebrowProps<E extends ElementType = "p"> = PolymorphicProps<E, EyebrowOwnProps>;

/**
 * Uppercase label used for chrome nav blocks and showcase section titles.
 */
export const Eyebrow = forwardRef(function Eyebrow(
  {
    as,
    variant = "section",
    weight,
    tone = "subtle",
    ...rest
  }: PolymorphicProps<ElementType, EyebrowOwnProps>,
  ref: ForwardedRef<Element>,
) {
  return (
    <Text
      as={(as ?? "p") as ElementType}
      ref={ref}
      size={variant === "nav" ? "2xs" : "xs"}
      weight={weight ?? (variant === "section" ? "semibold" : "medium")}
      tone={tone}
      transform="uppercase"
      tracking={variant === "nav" ? "caps" : "wider"}
      {...rest}
    />
  );
}) as PolymorphicComponent<"p", EyebrowOwnProps>;
