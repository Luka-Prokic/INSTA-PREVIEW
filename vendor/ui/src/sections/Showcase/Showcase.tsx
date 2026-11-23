import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Heading } from "../../primitives/Heading";
import { Text } from "../../primitives/Text";
import { Eyebrow } from "../../primitives/Eyebrow";
import { Stack } from "../../layouts/Stack";
import styles from "./Showcase.module.css";

export type PageHeaderProps = {
  title: string;
  lead?: string;
  className?: string;
};

/**
 * Page title + lead used at the top of documentation / showcase pages.
 */
export function PageHeader({ title, lead, className }: PageHeaderProps) {
  return (
    <header className={cn(styles.pageHeader, className)}>
      <Heading level={1} chromeTitle={title} tracking="tighter">
        {title}
      </Heading>
      {lead ? (
        <Text as="p" size="md" tone="muted" className={styles.pageLead}>
          {lead}
        </Text>
      ) : null}
    </header>
  );
}

export type ShowcasePageProps = {
  title: string;
  lead: string;
  children: ReactNode;
  className?: string;
};

export function ShowcasePage({ title, lead, children, className }: ShowcasePageProps) {
  return (
    <article className={cn(styles.page, className)}>
      <PageHeader title={title} lead={lead} />
      {children}
    </article>
  );
}

export type DemoProps = {
  title: string;
  description?: string;
  children: ReactNode;
  align?: "start" | "center";
  column?: boolean;
  className?: string;
};

export function Demo({
  title,
  description,
  children,
  align,
  column,
  className,
}: DemoProps) {
  return (
    <section className={cn(styles.demo, className)}>
      <Stack gap={1} className={styles.demoHead}>
        <Eyebrow as="h2" variant="section" data-explorer-heading={title}>
          {title}
        </Eyebrow>
        {description ? (
          <Text as="p" size="sm" tone="muted">
            {description}
          </Text>
        ) : null}
      </Stack>
      <div
        className={styles.canvas}
        data-align={align === "start" ? "start" : undefined}
        data-column={column ? "true" : undefined}
      >
        {children}
      </div>
    </section>
  );
}

export type SwatchProps = {
  name: string;
  variable: string;
  value?: string;
};

export function Swatch({ name, variable, value }: SwatchProps) {
  return (
    <div className={styles.swatch}>
      <div className={styles.swatchChip} style={{ background: `var(${variable})` }} />
      <div className={styles.swatchMeta}>
        <Text as="strong" size="sm" weight="semibold">
          {name}
        </Text>
        <Text as="code" size="xs" tone="muted">
          {variable}
        </Text>
        {value ? (
          <Text as="span" size="xs" tone="muted">
            {value}
          </Text>
        ) : null}
      </div>
    </div>
  );
}

export type QuickNotesProps = {
  items: string[];
  className?: string;
};

export function QuickNotes({ items, className }: QuickNotesProps) {
  return (
    <ul className={cn(styles.quickNotes, className)}>
      {items.map((item) => (
        <li key={item}>
          <Text as="span" size="sm" tone="muted">
            {item}
          </Text>
        </li>
      ))}
    </ul>
  );
}
