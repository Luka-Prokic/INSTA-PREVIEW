import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import { Text } from "../../primitives/Text";
import styles from "./AppShell.module.css";

export type AppShellProps = HTMLAttributes<HTMLDivElement> & {
  /** Controls grid columns for the sidebar. */
  sidebarOpen?: boolean;
  /**
   * `explorer` (default): shell grows with content and the window scrolls.
   * `app`: viewport is locked; sidebar, main, and nested panes scroll on their own.
   */
  layout?: "explorer" | "app";
  children: ReactNode;
};

/**
 * Two-column explorer / app chrome: sidebar + main. Compose with
 * `AppShellSidebar`, `AppShellMain`, `AppShellHeader`, `AppShellPreview`.
 */
export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  { sidebarOpen = true, layout = "explorer", className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(styles.shell, className)}
      data-sidebar={sidebarOpen ? "open" : "closed"}
      data-layout={layout}
      {...rest}
    >
      {children}
    </div>
  );
});

export type AppShellSidebarProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export const AppShellSidebar = forwardRef<HTMLElement, AppShellSidebarProps>(
  function AppShellSidebar({ className, children, ...rest }, ref) {
    return (
      <aside ref={ref} className={cn(styles.sidebar, className)} {...rest}>
        <div className={styles.sidebarInner}>{children}</div>
      </aside>
    );
  },
);

export type AppShellMainProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export const AppShellMain = forwardRef<HTMLDivElement, AppShellMainProps>(
  function AppShellMain({ className, children, ...rest }, ref) {
    return (
      <div ref={ref} className={cn(styles.main, className)} {...rest}>
        {children}
      </div>
    );
  },
);

export type AppShellHeaderProps = HTMLAttributes<HTMLElement> & {
  /** Centered chrome title (iOS-style scroll sync). */
  title?: string;
  /** Right-side controls (viewport, etc.). */
  controls?: ReactNode;
};

export const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(
  function AppShellHeader({ title, controls, className, children, ...rest }, ref) {
    return (
      <header ref={ref} className={cn(styles.header, className)} {...rest}>
        <Text
          as="p"
          size="md"
          weight="bold"
          tracking="tight"
          className={styles.headerTitle}
          data-visible={title ? "true" : undefined}
          aria-live="polite"
        >
          {title || "\u00a0"}
        </Text>
        {controls ? <div className={styles.headerControls}>{controls}</div> : null}
        {children}
      </header>
    );
  },
);

export type AppShellPreviewProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export const AppShellPreview = forwardRef<HTMLDivElement, AppShellPreviewProps>(
  function AppShellPreview({ className, children, ...rest }, ref) {
    return (
      <div ref={ref} className={cn(styles.preview, className)} {...rest}>
        <div className={styles.previewStage}>{children}</div>
      </div>
    );
  },
);

export type AppShellCanvasProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Max width for the preview canvas (`none` = fluid). */
  width?: string;
};

export const AppShellCanvas = forwardRef<HTMLDivElement, AppShellCanvasProps>(
  function AppShellCanvas({ className, children, width = "none", style, ...rest }, ref) {
    const canvasStyle = {
      ["--canvas-width" as string]: width,
      ...(style as CSSProperties),
    } as CSSProperties;

    return (
      <div ref={ref} className={cn(styles.canvas, className)} style={canvasStyle} {...rest}>
        {children}
      </div>
    );
  },
);

export type AppShellBrandProps = HTMLAttributes<HTMLDivElement> & {
  /** Brand mark / logo node. */
  mark: ReactNode;
  /** Short muted tagline under the mark. */
  tagline?: ReactNode;
  /** Trailing control (e.g. collapse). */
  action?: ReactNode;
};

export const AppShellBrand = forwardRef<HTMLDivElement, AppShellBrandProps>(
  function AppShellBrand({ mark, tagline, action, className, ...rest }, ref) {
    return (
      <div ref={ref} className={cn(styles.brandRow, className)} {...rest}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>{mark}</div>
          {tagline ? (
            <Text as="span" size="xs" tone="muted" className={styles.brandTag}>
              {tagline}
            </Text>
          ) : null}
        </div>
        {action}
      </div>
    );
  },
);
