import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  elevated?: boolean;
}

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { children, padding = "md", elevated = false, className, ...rest },
  ref,
) {
  return (
    <article
      ref={ref}
      className={cn(styles.card, className)}
      data-padding={padding}
      data-elevated={elevated || undefined}
      {...rest}
    >
      {children}
    </article>
  );
});

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.header, className)} {...rest} />;
}
export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.body, className)} {...rest} />;
}
export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.footer, className)} {...rest} />;
}
