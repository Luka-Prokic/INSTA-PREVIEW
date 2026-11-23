import { cn } from "../../utils/cn";
import styles from "./GallerySkeleton.module.css";

export type GallerySkeletonProps = {
  tiles?: number;
  className?: string;
};

/** Pulsing square placeholders for the gallery grid. */
export function GallerySkeleton({
  tiles = 18,
  className,
}: GallerySkeletonProps) {
  return (
    <section
      className={cn(styles.grid, className)}
      aria-busy="true"
      aria-hidden
    >
      {Array.from({ length: tiles }, (_, index) => (
        <span key={index} className={styles.tile} />
      ))}
    </section>
  );
}
