"use client";

import { IonIcon } from "@/lib/caka-admin";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useWorkspace } from "@/features/planner/store";
import { useForwardWheelScroll } from "@/hooks/useForwardWheelScroll";
import shell from "./Shell.module.css";
import styles from "./ConnectForm.module.css";
import motion from "./ModalMotion.module.css";

export function ConnectForm({
  variant = "panel",
  closing = false,
  onClose,
}: {
  variant?: "panel" | "dialog";
  closing?: boolean;
  onClose?: () => void;
}) {
  const {
    usernameInput,
    setUsernameInput,
    tokenInput,
    setTokenInput,
    connectProfile,
    startBlankProfile,
    status,
    error,
  } = useWorkspace();
  const [showToken, setShowToken] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onWheel = useForwardWheelScroll(scrollRef);
  const busy = status === "loading";
  const dismissible = variant === "dialog" && Boolean(onClose);
  const canLoad = Boolean(usernameInput.trim()) && !busy;

  const submit = useCallback(() => {
    if (!canLoad) return;
    void connectProfile(usernameInput, tokenInput);
  }, [canLoad, connectProfile, usernameInput, tokenInput]);

  const measure = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    const header = el.querySelector("header");
    const scroll = el.querySelector("[data-modal-scroll]");
    const prevH = el.style.height;
    const prevMax = el.style.maxHeight;
    el.style.height = "auto";
    el.style.maxHeight = "none";
    let body = 0;
    if (scroll instanceof HTMLElement) {
      const h = scroll.style.height;
      const f = scroll.style.flex;
      const m = scroll.style.minHeight;
      const o = scroll.style.overflow;
      scroll.style.height = "auto";
      scroll.style.flex = "0 0 auto";
      scroll.style.minHeight = "0";
      scroll.style.overflow = "visible";
      body = scroll.scrollHeight;
      scroll.style.height = h;
      scroll.style.flex = f;
      scroll.style.minHeight = m;
      scroll.style.overflow = o;
    } else {
      body = el.scrollHeight;
    }
    const head = header instanceof HTMLElement ? header.offsetHeight : 0;
    el.style.height = prevH;
    el.style.maxHeight = prevMax;
    const max = Math.min(Math.round(window.innerHeight * 0.9), 48 * 16);
    const next = Math.max(1, Math.ceil(Math.min(head + body, max)));
    setCardHeight((prev) => (prev === next ? prev : next));
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, error, showToken, advancedOpen, busy, canLoad]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    const scroll = el.querySelector("[data-modal-scroll]");
    if (scroll) ro.observe(scroll);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (variant !== "dialog" || !dismissible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closing) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [variant, dismissible, closing, onClose]);

  const dialogMotion =
    variant === "dialog" ? (closing ? motion.dialogClosing : motion.dialog) : undefined;

  const card = (
    <div
      ref={cardRef}
      className={[shell.modalCard, styles.card, dialogMotion].filter(Boolean).join(" ")}
      role={variant === "dialog" ? "dialog" : undefined}
      aria-modal={variant === "dialog" || undefined}
      aria-labelledby="connect-title"
      style={cardHeight ? { height: cardHeight } : undefined}
      onClick={variant === "dialog" ? (e) => e.stopPropagation() : undefined}
    >
      <header className={shell.modalHeader}>
        <h2 id="connect-title">Connect profile</h2>
        <div className={shell.modalHeaderActions}>
          <button type="submit" form="connect-form" className={shell.modalPrimary} disabled={!canLoad}>
            {busy ? "Loading…" : "Load profile"}
          </button>
          {dismissible ?
            <button type="button" className={shell.modalClose} aria-label="Close" onClick={onClose}>
              <IonIcon name="close-outline" />
            </button>
          : null}
        </div>
      </header>

      <div ref={scrollRef} className={shell.modalPad} data-modal-scroll>
        <form
          id="connect-form"
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className={shell.field}>
            @
            <input
              id="ig-username"
              name="username"
              autoComplete="username"
              placeholder="username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                submit();
              }}
              disabled={busy}
              autoFocus={variant === "dialog"}
            />
          </label>

          <details
            className={styles.advanced}
            open={advancedOpen || undefined}
            onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary>Advanced</summary>
            <div className={styles.advancedBody}>
              <label className={shell.field}>
                Access token
                <div className={styles.password}>
                  <input
                    id="ig-token"
                    name="token"
                    autoComplete="off"
                    spellCheck={false}
                    type={showToken ? "text" : "password"}
                    placeholder="IGAA…"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className={styles.toggle}
                    onClick={() => setShowToken((v) => !v)}
                    tabIndex={-1}
                  >
                    {showToken ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
            </div>
          </details>

          {error ?
            <p className={shell.modalError} role="alert">
              {error}
            </p>
          : null}

          <button
            type="button"
            className={styles.blankLink}
            disabled={busy || !usernameInput.trim()}
            onClick={() => void startBlankProfile(usernameInput)}
          >
            Blank grid
          </button>
        </form>
      </div>
    </div>
  );

  if (variant === "dialog") {
    if (typeof document === "undefined") return null;
    return createPortal(
      <div
        className={`${shell.modalBackdrop} ${closing ? motion.backdropClosing : motion.backdrop}`}
        role="presentation"
        onWheel={onWheel}
        onClick={() => {
          if (dismissible && !closing) onClose?.();
        }}
      >
        {card}
      </div>,
      document.body,
    );
  }

  return (
    <div className={`${styles.panel} ${motion.panel}`} onWheel={onWheel}>
      {card}
    </div>
  );
}
