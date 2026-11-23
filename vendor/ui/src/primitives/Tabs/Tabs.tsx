"use client";

import {
  Children,
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import styles from "./Tabs.module.css";

type TabsCtx = {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
};

const Ctx = createContext<TabsCtx | null>(null);

export type TabsProps = {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md";
};

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
  size = "md",
}: TabsProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value ?? uncontrolled;
  const baseId = useId();
  const setValue = (v: string) => {
    if (value === undefined) setUncontrolled(v);
    onValueChange?.(v);
  };
  return (
    <div className={cn(styles.root, className)} data-size={size}>
      <Ctx.Provider value={{ value: current, setValue, baseId }}>{children}</Ctx.Provider>
    </div>
  );
}

export function TabsList({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("TabsList must be used within Tabs");

  const listRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0 });
  const [moving, setMoving] = useState(false);
  const childCount = Children.count(children);

  useLayoutEffect(() => {
    const root = listRef.current;
    if (!root) return;

    const el = root.querySelector<HTMLElement>(
      `[data-tab-value="${CSS.escape(ctx.value)}"]`,
    );
    if (!el) return;

    setThumb({ left: el.offsetLeft, width: el.offsetWidth });
    setMoving(true);

    const thumbEl = root.querySelector<HTMLElement>(`.${styles.thumb}`);
    if (!thumbEl) return;

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === "left" || e.propertyName === "width") {
        setMoving(false);
      }
    };
    thumbEl.addEventListener("transitionend", onEnd);
    return () => thumbEl.removeEventListener("transitionend", onEnd);
  }, [ctx.value, childCount]);

  const thumbStyle = {
    ["--nav-thumb-left" as string]: `${thumb.left}px`,
    ["--nav-thumb-width" as string]: `${thumb.width}px`,
  } as CSSProperties;

  return (
    <div ref={listRef} role="tablist" className={cn(styles.list, className)} {...rest}>
      <span
        className={cn(styles.thumb, moving && styles.thumbMoving)}
        style={thumbStyle}
        aria-hidden
      />
      {children}
    </div>
  );
}

export type TabsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & { value: string };

export function TabsTrigger({ value, className, children, ...rest }: TabsTriggerProps) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
  const selected = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${ctx.baseId}-tab-${value}`}
      data-tab-value={value}
      aria-selected={selected}
      aria-controls={`${ctx.baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      className={cn(styles.trigger, className)}
      data-selected={selected || undefined}
      onClick={(e) => {
        rest.onClick?.(e);
        ctx.setValue(value);
      }}
      {...rest}
    >
      <span className={styles.label}>{children}</span>
    </button>
  );
}

export type TabsContentProps = HTMLAttributes<HTMLDivElement> & { value: string };

export function TabsContent({ value, className, children, ...rest }: TabsContentProps) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");
  const selected = ctx.value === value;
  if (!selected) return null;
  return (
    <div
      role="tabpanel"
      id={`${ctx.baseId}-panel-${value}`}
      aria-labelledby={`${ctx.baseId}-tab-${value}`}
      className={cn(styles.content, className)}
      {...rest}
    >
      {children}
    </div>
  );
}
