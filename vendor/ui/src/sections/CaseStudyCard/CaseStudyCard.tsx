import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Link } from "../../primitives/Link";
import { MediaFrame } from "../../primitives/MediaFrame";
import { Eyebrow } from "../../primitives/Eyebrow";
import { Heading } from "../../primitives/Heading";
import { Text } from "../../primitives/Text";
import styles from "./CaseStudyCard.module.css";

export interface CaseStudyCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  summary?: ReactNode;
  meta?: ReactNode;
  media?: ReactNode;
  href?: string;
  eyebrow?: ReactNode;
}

/**
 * Project / case teaser for portfolio indexes. When `href` is set the card
 * is wrapped in a semantic link.
 */
export const CaseStudyCard = forwardRef<HTMLElement, CaseStudyCardProps>(
  function CaseStudyCard(
    { title, summary, meta, media, href, eyebrow, className, ...rest },
    ref,
  ) {
    const body = (
      <>
        {media != null && (
          <MediaFrame aspect="4/3" className={styles.media}>
            {media}
          </MediaFrame>
        )}
        <div className={styles.body}>
          {eyebrow != null && (
            <Eyebrow as="span" className={styles.eyebrow}>
              {eyebrow}
            </Eyebrow>
          )}
          <Heading as="h3" level={3} size="lg" className={styles.title}>
            {title}
          </Heading>
          {summary != null && (
            <Text size="sm" tone="muted" className={styles.summary}>
              {summary}
            </Text>
          )}
          {meta != null && <div className={styles.meta}>{meta}</div>}
        </div>
      </>
    );

    if (href) {
      return (
        <article ref={ref} className={cn(styles.card, className)} {...rest}>
          <Link href={href} variant="inherit" className={styles.link}>
            {body}
          </Link>
        </article>
      );
    }

    return (
      <article ref={ref} className={cn(styles.card, className)} {...rest}>
        {body}
      </article>
    );
  },
);
