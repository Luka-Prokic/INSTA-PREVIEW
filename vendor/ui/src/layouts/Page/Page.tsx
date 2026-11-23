import {
  forwardRef,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import styles from "./Page.module.css";

export type PageProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
  /** Root element. Default `main`. */
  as?: ElementType;
};

/**
 * Full-bleed page shell. No max-width - use Section / Container for measures.
 */
export const Page = forwardRef<HTMLElement, PageProps>(function Page(
  { as: Comp = "main", children, className, id = "top", ...rest },
  ref,
) {
  return (
    <Comp ref={ref} id={id} className={cn(styles.root, className)} {...rest}>
      {children}
    </Comp>
  );
});
