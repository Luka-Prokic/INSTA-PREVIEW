import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./ProjectMeta.module.css";

export type ProjectMetaItem = {
  label: string;
  value: ReactNode;
};

export interface ProjectMetaProps extends HTMLAttributes<HTMLDListElement> {
  items: ProjectMetaItem[];
  /** Layout of label/value pairs. Defaults to `inline`. */
  layout?: "inline" | "stack";
}

/**
 * Role / client / year / duration meta for case studies.
 */
export const ProjectMeta = forwardRef<HTMLDListElement, ProjectMetaProps>(
  function ProjectMeta({ items, layout = "inline", className, ...rest }, ref) {
    return (
      <dl
        ref={ref}
        className={cn(styles.list, className)}
        data-layout={layout}
        {...rest}
      >
        {items.map((item) => (
          <div key={item.label} className={styles.item}>
            <dt className={styles.label}>{item.label}</dt>
            <dd className={styles.value}>{item.value}</dd>
          </div>
        ))}
      </dl>
    );
  },
);
