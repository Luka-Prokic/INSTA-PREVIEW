import {
  forwardRef,
  type CSSProperties,
  type ElementType,
  type ForwardedRef,
} from "react";
import { cn } from "../../utils/cn";
import type { PolymorphicComponent, PolymorphicProps } from "../../utils/polymorphic";

/** Spacing scale keys that map to `--space-*` tokens (Caka: rule of 4s). */
export type SpaceScale =
  | 0
  | "px"
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 10
  | 12
  | 16
  | 20
  | 24
  | 32
  | 64
  | 128;

/** Surface color tokens Box can paint as a background. */
export type SurfaceTone = "bg" | "surface" | "surface-raised" | "surface-sunken";
export type RadiusScale = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
export type ShadowScale = "xs" | "sm" | "md" | "lg" | "xl";

export interface BoxOwnProps {
  /** Padding (all sides). */
  p?: SpaceScale;
  px?: SpaceScale;
  py?: SpaceScale;
  pt?: SpaceScale;
  pr?: SpaceScale;
  pb?: SpaceScale;
  pl?: SpaceScale;
  /** Margin (all sides). */
  m?: SpaceScale;
  mx?: SpaceScale;
  my?: SpaceScale;
  mt?: SpaceScale;
  mr?: SpaceScale;
  mb?: SpaceScale;
  ml?: SpaceScale;
  /** Background surface token. */
  bg?: SurfaceTone;
  /** Border radius token. */
  radius?: RadiusScale;
  /** Elevation token. */
  shadow?: ShadowScale;
}

const spaceVar = (value: SpaceScale | undefined): string | undefined =>
  value === undefined ? undefined : `var(--space-${value})`;

function buildStyle(props: BoxOwnProps, style?: CSSProperties): CSSProperties {
  return {
    padding: spaceVar(props.p),
    paddingInline: spaceVar(props.px),
    paddingBlock: spaceVar(props.py),
    paddingTop: spaceVar(props.pt),
    paddingRight: spaceVar(props.pr),
    paddingBottom: spaceVar(props.pb),
    paddingLeft: spaceVar(props.pl),
    margin: spaceVar(props.m),
    marginInline: spaceVar(props.mx),
    marginBlock: spaceVar(props.my),
    marginTop: spaceVar(props.mt),
    marginRight: spaceVar(props.mr),
    marginBottom: spaceVar(props.mb),
    marginLeft: spaceVar(props.ml),
    background: props.bg ? `var(--color-${props.bg})` : undefined,
    borderRadius: props.radius ? `var(--radius-${props.radius})` : undefined,
    boxShadow: props.shadow ? `var(--shadow-${props.shadow})` : undefined,
    ...style,
  };
}

export type BoxProps<E extends ElementType = "div"> = PolymorphicProps<E, BoxOwnProps>;

/**
 * Box is the polymorphic layout primitive. It renders any element via `as`
 * and exposes token-driven spacing/surface props. Dynamic values reference
 * CSS custom properties, so they respond to theme changes.
 */
export const Box = forwardRef(function Box(
  {
    as,
    p,
    px,
    py,
    pt,
    pr,
    pb,
    pl,
    m,
    mx,
    my,
    mt,
    mr,
    mb,
    ml,
    bg,
    radius,
    shadow,
    className,
    style,
    ...rest
  }: PolymorphicProps<ElementType, BoxOwnProps>,
  ref: ForwardedRef<Element>,
) {
  const Component = (as ?? "div") as ElementType;
  const boxStyle = buildStyle(
    { p, px, py, pt, pr, pb, pl, m, mx, my, mt, mr, mb, ml, bg, radius, shadow },
    style as CSSProperties,
  );

  return <Component ref={ref} className={cn(className)} style={boxStyle} {...rest} />;
}) as PolymorphicComponent<"div", BoxOwnProps>;
