import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Container } from "../../layouts/Container";
import { Stack } from "../../layouts/Stack";
import styles from "./Hero.module.css";

export interface HeroProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  media?: ReactNode;
  /** Layout of copy vs media. Defaults to `split`. */
  layout?: "split" | "stack";
}

/**
 * Portfolio hero: one composition - brand/title, lead, CTAs, optional media.
 * No overlay stickers or promo chips.
 */
export const Hero = forwardRef<HTMLElement, HeroProps>(function Hero(
  {
    eyebrow,
    title,
    lead,
    actions,
    media,
    layout = "split",
    className,
    ...rest
  },
  ref,
) {
  return (
    <section
      ref={ref}
      className={cn(styles.hero, className)}
      data-layout={layout}
      {...rest}
    >
      <Container className={styles.inner}>
        <Stack gap={6} className={styles.copy}>
          {eyebrow != null && <div className={styles.eyebrow}>{eyebrow}</div>}
          <div className={styles.title}>{title}</div>
          {lead != null && <div className={styles.lead}>{lead}</div>}
          {actions != null && <div className={styles.actions}>{actions}</div>}
        </Stack>
        {media != null && <div className={styles.media}>{media}</div>}
      </Container>
    </section>
  );
});
