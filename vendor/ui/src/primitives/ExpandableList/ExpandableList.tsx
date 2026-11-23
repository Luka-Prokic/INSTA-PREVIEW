"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import styles from "./ExpandableList.module.css";

export type ExpandableListMode = "independent" | "accordion";
export type ExpandableListPadding = "page" | "description" | "none";
export type ExpandableListTone = "ink" | "onInk";

type ExpandableListContextValue = {
  mode: ExpandableListMode;
  tone: ExpandableListTone;
  openId: string | null;
  setOpenId: (id: string | null) => void;
};

const ExpandableListContext = createContext<ExpandableListContextValue | null>(null);

function useExpandableList() {
  const ctx = useContext(ExpandableListContext);
  if (!ctx) {
    throw new Error("ExpandableList.Item / Link must be used inside ExpandableList");
  }
  return ctx;
}

export type ExpandableListProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  mode?: ExpandableListMode;
  /**
   * `page` - `--page-pad-inline`.
   * `description` - `--description-pad-inline`.
   * `none` - no inline pad.
   */
  padding?: ExpandableListPadding;
  tone?: ExpandableListTone;
  dividers?: boolean;
  as?: "div" | "nav" | "ul";
  defaultOpenId?: string | null;
};

function PlusGlyph({ open }: { open: boolean }) {
  return (
    <span className={styles.glyph} data-open={open || undefined} aria-hidden>
      <span className={styles.glyphBar} data-axis="h" />
      <span className={styles.glyphBar} data-axis="v" />
    </span>
  );
}

/**
 * Disclosure / nav list - label left, plus glyph right.
 * Compose with `ExpandableList.Item` and `ExpandableList.Link`.
 */
export function ExpandableList({
  children,
  mode = "independent",
  padding = "page",
  tone = "ink",
  dividers = false,
  as: Tag = "div",
  defaultOpenId = null,
  className,
  ...rest
}: ExpandableListProps) {
  const [openId, setOpenId] = useState<string | null>(
    mode === "accordion" ? defaultOpenId : null,
  );

  return (
    <ExpandableListContext.Provider value={{ mode, tone, openId, setOpenId }}>
      <Tag
        className={cn(
          styles.root,
          padding === "page" && styles.padPage,
          padding === "description" && styles.padDescription,
          padding === "none" && styles.padNone,
          tone === "onInk" && styles.toneOnInk,
          dividers && styles.dividers,
          className,
        )}
        data-mode={mode}
        data-dividers={dividers || undefined}
        {...rest}
      >
        {children}
      </Tag>
    </ExpandableListContext.Provider>
  );
}

export type ExpandableListItemProps = {
  id?: string;
  title: ReactNode;
  children?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

function ExpandableListItem({
  id: idProp,
  title,
  children,
  defaultOpen = false,
  className,
}: ExpandableListItemProps) {
  const { mode, openId, setOpenId } = useExpandableList();
  const reactId = useId();
  const id = idProp ?? reactId;
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = mode === "accordion" ? openId === id : localOpen;

  const toggle = useCallback(() => {
    if (mode === "accordion") {
      setOpenId(open ? null : id);
      return;
    }
    setLocalOpen((v) => !v);
  }, [mode, open, id, setOpenId]);

  const panelId = `${id}-panel`;
  const buttonId = `${id}-trigger`;

  return (
    <div
      className={cn(styles.item, open && styles.itemOpen, className)}
      data-open={open || undefined}
    >
      <button
        id={buttonId}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <span className={styles.label}>{title}</span>
        <PlusGlyph open={open} />
      </button>
      <div className={styles.panelShell} data-open={open || undefined}>
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className={styles.panel}
          aria-hidden={!open}
          inert={open ? undefined : true}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export type ExpandableListLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
};

function ExpandableListLink({ children, className, ...rest }: ExpandableListLinkProps) {
  return (
    <a className={cn(styles.link, className)} {...rest}>
      <span className={styles.label}>{children}</span>
      <PlusGlyph open={false} />
    </a>
  );
}

ExpandableList.Item = ExpandableListItem;
ExpandableList.Link = ExpandableListLink;
