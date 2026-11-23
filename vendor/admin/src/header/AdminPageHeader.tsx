"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { IonIcon } from "../icons/Icon";
import { useSectionNav, type SectionBack } from "./SectionNav";
import styles from "./AdminPageHeader.module.css";

const IOS_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const IOS_MS = 420;

function reducedMotion() {
  if (document.querySelector("[data-reduce-motion]")) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AdminPageHeader({
  title,
  showDemoTag = false,
  addHref,
  addLabel = "Add",
  addMobileLabel = "Add",
  addDisabled = false,
  headerAction,
  search,
  sticky = true,
  backLink,
  editValue,
  onTitleSave,
}: {
  title: string;
  addHref?: string;
  addLabel?: string;
  addMobileLabel?: string;
  addDisabled?: boolean;
  headerAction?: ReactNode;
  search?: ReactNode;
  sticky?: boolean;
  showDemoTag?: boolean;
  backLink?: SectionBack | null;
  editValue?: string;
  onTitleSave?: (value: string) => void;
}) {
  const defaultAction =
    addHref &&
    (addDisabled ? (
      <span className={styles.primaryActionDisabled} aria-disabled="true" aria-label={addLabel}>
        <span className={styles.addLabelDesktop}>+ {addLabel}</span>
        <span className={styles.addLabelMobile}>{addMobileLabel}</span>
      </span>
    ) : (
      <Link href={addHref} className={styles.primaryAction} aria-label={addLabel}>
        <span className={styles.addLabelDesktop}>+ {addLabel}</span>
        <span className={styles.addLabelMobile}>{addMobileLabel}</span>
      </Link>
    ));

  const action = headerAction ?? defaultAction ?? null;
  const section = useSectionNav();
  const [back, setBack] = useState<SectionBack | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const backRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipSave = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const seenNav = useRef("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const canEdit = Boolean(onTitleSave);

  useLayoutEffect(() => {
    if (!section) return;
    const next = backLink !== undefined ? backLink : (section.back ?? null);
    if ((back?.href ?? "") !== (next?.href ?? "") || (back?.label ?? "") !== (next?.label ?? "")) {
      setBack(next);
      return;
    }
    const titleEl = titleRef.current;
    const backEl = backRef.current;
    const titleBox = titleEl?.getBoundingClientRect() ?? null;
    const backBox = backEl?.getBoundingClientRect() ?? null;
    if (seenNav.current !== section.navId) {
      seenNav.current = section.navId;
      const stage = titleEl?.closest("[data-section-stage]") as HTMLElement | null;
      if (!reducedMotion() && section.direction !== "none") {
        stage?.setAttribute("data-play", section.direction);
        if (section.direction === "forward") {
          if (section.flyFrom && backEl && backBox) {
            const dx = section.flyFrom.left - backBox.left;
            const dy = section.flyFrom.top - backBox.top;
            const scale = section.flyFrom.height / Math.max(backBox.height, 1);
            backEl.animate(
              [
                { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, transformOrigin: "0px 50%" },
                { transform: "translate(0px, 0px) scale(1)", transformOrigin: "0px 50%" },
              ],
              { duration: IOS_MS, easing: IOS_EASE },
            );
          }
          titleEl?.animate(
            [
              { transform: "translateX(24px)", opacity: 0, filter: "blur(10px)" },
              { transform: "translateX(0px)", opacity: 1, filter: "blur(0px)" },
            ],
            { duration: IOS_MS, easing: IOS_EASE },
          );
        }
        if (section.direction === "back" && section.popFrom && titleEl && titleBox) {
          const dx = section.popFrom.left - titleBox.left;
          const dy = section.popFrom.top - titleBox.top;
          const scale = section.popFrom.height / Math.max(titleBox.height, 1);
          titleEl.animate(
            [
              { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, transformOrigin: "0px 50%" },
              { transform: "translate(0px, 0px) scale(1)", transformOrigin: "0px 50%" },
            ],
            { duration: IOS_MS, easing: IOS_EASE },
          );
        }
      }
      section.report(title, titleBox, backBox);
      return;
    }
    const animating = [...(titleEl?.getAnimations() ?? []), ...(backEl?.getAnimations() ?? [])].some((item) => item.playState === "running");
    if (!animating) section.report(title, titleBox, backBox);
  }, [section, back, title, backLink]);

  useLayoutEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!sticky || !wrap) return;
    const root = document.documentElement;
    const write = () => root.style.setProperty("--admin-page-header", `${wrap.offsetHeight}px`);
    write();
    const observer = new ResizeObserver(write);
    observer.observe(wrap);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--admin-page-header");
    };
  }, [sticky]);

  function beginEdit() {
    setDraft(editValue ?? "");
    setEditing(true);
  }

  function commit() {
    if (skipSave.current) {
      skipSave.current = false;
      setEditing(false);
      return;
    }
    setEditing(false);
    onTitleSave?.(draft.trim());
  }

  return (
    <div ref={wrapRef} className={sticky ? styles.stickyWrap : styles.wrap}>
      {sticky ? <style>{`.${styles.stickyWrap} { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }`}</style> : null}
      <header className={search ? styles.headerWithSearch : styles.header}>
        <div className={styles.line}>
          {back ? (
            <Link className={styles.back} href={back.href} aria-label={`Back to ${back.label}`}>
              <IonIcon name="chevron-back-outline" />
              <span ref={backRef} className={styles.backLabel}>
                {back.label}
              </span>
            </Link>
          ) : null}
          <h1 ref={titleRef} className={styles.title}>
            {canEdit && editing ? (
              <span className={styles.titleEdit}>
                <input
                  ref={inputRef}
                  className={styles.titleInput}
                  aria-label="Project name"
                  placeholder="Project"
                  value={draft}
                  size={Math.max(draft.length, 7)}
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={commit}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                    if (event.key === "Escape") {
                      skipSave.current = true;
                      event.currentTarget.blur();
                    }
                  }}
                />
                <button
                  className={styles.clear}
                  type="button"
                  aria-label="Clear name"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setDraft("");
                    inputRef.current?.focus();
                  }}
                >
                  ×
                </button>
              </span>
            ) : canEdit ? (
              <button className={styles.titleHit} type="button" onClick={beginEdit}>
                <span className={styles.titleText} data-placeholder={editValue?.trim() ? undefined : ""}>
                  {title}
                </span>
              </button>
            ) : (
              <span className={styles.titleText}>{title}</span>
            )}
            {showDemoTag ? <span className={styles.demoTag}>Demo</span> : null}
          </h1>
        </div>
        {search ? <div className={styles.searchSlot}>{search}</div> : null}
        {action ? <div className={styles.headerAction}>{action}</div> : null}
      </header>
    </div>
  );
}
