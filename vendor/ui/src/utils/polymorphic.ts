import type { ComponentPropsWithRef, ElementType, ReactElement } from "react";

/** Ref type for a polymorphic component rendered as element `E`. */
export type PolymorphicRef<E extends ElementType> = ComponentPropsWithRef<E>["ref"];

type AsProp<E extends ElementType> = { as?: E };

type MergeProps<E extends ElementType, OwnProps> = OwnProps &
  AsProp<E> &
  Omit<ComponentPropsWithRef<E>, keyof OwnProps | "as">;

/**
 * Props for a polymorphic component: own props + the `as` element's native
 * props (own props win) + the correct `ref` for that element.
 */
export type PolymorphicProps<E extends ElementType, OwnProps = object> = MergeProps<
  E,
  OwnProps
>;

/**
 * Call signature for a polymorphic component with a default element.
 * Cast a `forwardRef` result to this to preserve `as`-based inference.
 */
export type PolymorphicComponent<Default extends ElementType, OwnProps = object> = <
  E extends ElementType = Default,
>(
  props: PolymorphicProps<E, OwnProps>,
) => ReactElement | null;
