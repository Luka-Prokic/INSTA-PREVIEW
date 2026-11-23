"use client";

import { IonIcon } from "@/lib/caka-admin";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildSharePayload } from "@/features/share/buildSharePayload";
import { downloadDeviceImage } from "@/features/share/captureDeviceImage";
import { useWorkspace } from "@/features/planner/store";
import { PHONE_MODELS, type PhoneModelId } from "@/features/preview/devices";
import { usePresence } from "@/hooks/usePresence";
import {
  getActiveDeviceLabel,
  type PreviewDeviceId,
} from "./DeviceCarousel";
import shell from "./Shell.module.css";
import styles from "./ShareButton.module.css";

type Panel = "root" | "devices";

const EXTRA_DEVICES: {
  id: "bare" | "desktop" | "macbook";
  name: string;
  subtitle: string;
}[] = [
  { id: "bare", name: "No device", subtitle: "Full feed" },
  { id: "desktop", name: "Desktop", subtitle: "16:9" },
  { id: "macbook", name: "MacBook", subtitle: "16:10" },
];

function activeDeviceId(
  viewMode: "mobile" | "desktop" | "macbook" | "bare",
  phoneModelId: PhoneModelId,
): PreviewDeviceId {
  if (viewMode === "desktop" || viewMode === "macbook" || viewMode === "bare") {
    return viewMode;
  }
  return phoneModelId;
}

export function ShareButton({ variant = "row" }: { variant?: "row" | "icon" }) {
  const {
    snapshot,
    planned,
    username,
    viewMode,
    phoneModelId,
    phoneScaleMode,
    setViewMode,
    setPhoneModelId,
  } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("root");
  const [busy, setBusy] = useState<"link" | "image" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [menuHeight, setMenuHeight] = useState<number | null>(null);
  const [heightReady, setHeightReady] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const presence = usePresence(open, 420);

  const disabled = !snapshot || busy !== null;
  const activeId = activeDeviceId(viewMode, phoneModelId);
  const activeLabel = getActiveDeviceLabel(viewMode, phoneModelId);

  const placeMenu = () => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setMenuPos({
      top: Math.round(rect.bottom + 8),
      right: Math.round(window.innerWidth - rect.right),
    });
  };

  const measureHeight = useCallback(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const next = Math.ceil(inner.scrollHeight);
    const max = Math.round(Math.min(window.innerHeight * 0.7, 28 * 16));
    setMenuHeight(Math.min(next, max));
  }, []);

  useLayoutEffect(() => {
    if (!presence.mounted) {
      setMenuPos(null);
      setMenuHeight(null);
      setHeightReady(false);
      return;
    }
    placeMenu();
    measureHeight();
    const id = window.requestAnimationFrame(() => setHeightReady(true));
    window.addEventListener("resize", placeMenu);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", placeMenu);
    };
  }, [presence.mounted, measureHeight]);

  useLayoutEffect(() => {
    if (!presence.mounted) return;
    measureHeight();
  }, [panel, busy, error, presence.mounted, measureHeight]);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || !presence.mounted || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measureHeight());
    ro.observe(inner);
    return () => ro.disconnect();
  }, [presence.mounted, panel, measureHeight]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const timer = window.setTimeout(() => {
      window.addEventListener("mousedown", onPointer);
    }, 0);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPanel("root");
      setError(null);
    }
  }, [open]);

  const ensureSelected = (id: PreviewDeviceId) => {
    if (id === "desktop" || id === "macbook" || id === "bare") {
      setViewMode(id);
      return;
    }
    setPhoneModelId(id);
    setViewMode("mobile");
  };

  const onCopyLink = async () => {
    if (!snapshot || busy) return;
    setBusy("link");
    setError(null);
    try {
      const payload = await buildSharePayload({
        snapshot,
        planned,
        viewMode,
        phoneModelId,
        phoneScaleMode,
      });
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as
        | { id?: string; url?: string; error?: string }
        | null;
      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? "Could not create share link.");
      }
      const absolute = new URL(data.url, window.location.origin).toString();
      try {
        await navigator.clipboard.writeText(absolute);
      } catch {
        setError(absolute);
        setBusy(null);
        return;
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Share failed.");
    } finally {
      setBusy(null);
    }
  };

  const onDownload = async (deviceId: PreviewDeviceId) => {
    if (!snapshot || busy) return;
    setBusy("image");
    setError(null);
    try {
      await downloadDeviceImage({
        deviceId,
        username: username || snapshot.username,
        activeId,
        ensureSelected,
      });
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not capture preview.";
      setError(message || "Could not capture preview.");
    } finally {
      setBusy(null);
    }
  };

  const trigger =
    variant === "icon" ?
      <button
        ref={triggerRef}
        type="button"
        className={shell.iconBtn}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={presence.mounted ? menuId : undefined}
        aria-label={busy ? "Sharing…" : "Share"}
        title={busy ? "Sharing…" : "Share"}
        onClick={() => setOpen((v) => !v)}
      >
        <IonIcon name="share-outline" />
      </button>
    : <button
        ref={triggerRef}
        type="button"
        className={shell.row}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={presence.mounted ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={shell.rowLabel}>
          <IonIcon name="share-outline" />
          {busy === "link" ? "Sharing…" : busy === "image" ? "Saving image…" : "Share plan"}
        </span>
      </button>;

  const menu =
    presence.mounted && menuPos && typeof document !== "undefined" ?
      createPortal(
        <div
          className={styles.anchor}
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <div
            ref={menuRef}
            id={menuId}
            className={styles.menu}
            role="menu"
            data-panel={panel}
            data-ready={heightReady || undefined}
            data-closing={presence.closing || undefined}
            aria-label="Share options"
            style={menuHeight ? { height: menuHeight } : undefined}
          >
            <div ref={innerRef} className={styles.inner}>
              {error ?
                <p className={styles.error} role="alert">
                  {error}
                </p>
              : null}
              {panel === "root" ?
                <>
                  <button
                    type="button"
                    className={styles.item}
                    role="menuitem"
                    disabled={busy !== null}
                    onClick={() => void onCopyLink()}
                  >
                    <span className={styles.itemLabel}>
                      <IonIcon name="link-outline" />
                      {busy === "link" ? "Copying link…" : "Copy share link"}
                    </span>
                  </button>
                  <div className={styles.sep} role="separator" />
                  <p className={styles.sectionTitle}>Download image</p>
                  <button
                    type="button"
                    className={styles.item}
                    role="menuitem"
                    disabled={busy !== null}
                    onClick={() => void onDownload(activeId)}
                  >
                    <span className={styles.itemLabel}>
                      <IonIcon name="image-outline" />
                      {busy === "image" ? "Saving…" : "Current"}
                    </span>
                    <span className={styles.itemMeta}>{activeLabel.name}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.item}
                    role="menuitem"
                    disabled={busy !== null}
                    onClick={() => setPanel("devices")}
                  >
                    <span className={styles.itemLabel}>
                      <IonIcon name="scan-outline" />
                      Select device
                    </span>
                    <IonIcon name="chevron-forward-outline" />
                  </button>
                </>
              : <>
                  <button type="button" className={styles.back} onClick={() => setPanel("root")}>
                    <IonIcon name="chevron-back-outline" />
                    Download image
                  </button>
                  {PHONE_MODELS.map((model) => {
                    const selected = model.id === activeId;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        className={styles.item}
                        role="menuitem"
                        disabled={busy !== null}
                        onClick={() => void onDownload(model.id)}
                      >
                        <span className={styles.itemLabel}>
                          <span className={styles.deviceDot} data-active={selected || undefined} />
                          {model.name}
                        </span>
                        <span className={styles.itemMeta}>{model.sizeLabel}</span>
                      </button>
                    );
                  })}
                  {EXTRA_DEVICES.map((device) => {
                    const selected = device.id === activeId;
                    return (
                      <button
                        key={device.id}
                        type="button"
                        className={styles.item}
                        role="menuitem"
                        disabled={busy !== null}
                        onClick={() => void onDownload(device.id)}
                      >
                        <span className={styles.itemLabel}>
                          <span className={styles.deviceDot} data-active={selected || undefined} />
                          {device.name}
                        </span>
                        <span className={styles.itemMeta}>{device.subtitle}</span>
                      </button>
                    );
                  })}
                </>
              }
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={styles.wrap}>
      {trigger}
      {menu}
    </div>
  );
}
