import { createElement, forwardRef, type ElementType, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import type { PolymorphicComponent, PolymorphicProps, PolymorphicRef } from "../../utils/polymorphic";
import styles from "./Link.module.css";

export type LinkVariant = "inherit" | "underline" | "quiet";

type LinkOwnProps = {
  variant?: LinkVariant;
  children?: ReactNode;
  className?: string;
};

const LinkInner = forwardRef(function Link(
  props: PolymorphicProps<ElementType, LinkOwnProps>,
  ref: PolymorphicRef<ElementType>,
) {
  const {
    as,
    variant = "underline",
    className,
    children,
    ...rest
  } = props;
  const Component = (as ?? "a") as ElementType;

  return createElement(
    Component,
    {
      ref,
      className: cn(styles.link, className),
      "data-variant": variant,
      ...rest,
    },
    children,
  );
});

/**
 * Semantic navigation / inline link. Use `as={NextLink}` (or similar) for
 * client routers. Prefer ButtonLink when the control must look like a Button.
 */
export const Link = LinkInner as PolymorphicComponent<"a", LinkOwnProps>;

export type LinkProps<E extends ElementType = "a"> = PolymorphicProps<E, LinkOwnProps>;
