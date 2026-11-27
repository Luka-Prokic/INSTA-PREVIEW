"use client";

import { ChoiceGroup } from "@/lib/caka-admin";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { extractVideoFrame, focusToObjectPosition, loadImageFile } from "@/features/planner/media";
import { useWorkspace } from "@/features/planner/store";
import type { PlannedItem } from "@/features/planner/types";
import { useForwardWheelScroll } from "@/hooks/useForwardWheelScroll";
import { usePresence } from "@/hooks/usePresence";
import styles from "./AddMediaModal.module.css";
import motion from "./ModalMotion.module.css";
import shell from "./Shell.module.css";

type Kind = PlannedItem["kind"];

export function AddMediaModal({
  open,
  onOpenChange,
  seed = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** File already chosen (picker / app-wide drop) — skip the empty upload step. */
  seed?: { file: File; kindHint?: Kind } | null;
}) {
  const { addPlanned } = useWorkspace();
  const presence = usePresence(open);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onWheel = useForwardWheelScroll(scrollRef);
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Kind>("image");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [name, setName] = useState("");
  const [focusX, setFocusX] = useState(0.5);
  const [focusY, setFocusY] = useState(0.5);
  const [busy, setBusy] = useState(false);
  const [drop, setDrop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  previewUrlRef.current = previewUrl;
  const seedHandled = useRef<File | null>(null);

  useEffect(() => {
    if (presence.mounted) return;
    const url = previewUrlRef.current;
    if (url) URL.revokeObjectURL(url);
    setPreviewUrl(null);
    setBlob(null);
    setName("");
    setFocusX(0.5);
    setFocusY(0.5);
    setKind("image");
    setDrop(false);
    setError(null);
    seedHandled.current = null;
  }, [presence.mounted]);

  useEffect(() => {
    if (!presence.mounted) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !presence.closing) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [presence.mounted, presence.closing, onOpenChange]);

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBlob(null);
    setName("");
    setFocusX(0.5);
    setFocusY(0.5);
    setKind("image");
    setError(null);
  };

  const onFile = useCallback(async (file: File | null | undefined, kindHint?: Kind) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      if (file.type.startsWith("video/")) {
        const frame = await extractVideoFrame(file);
        setPreviewUrl(frame.url);
        setBlob(frame.blob);
        setName(file.name);
        setKind(kindHint ?? "reel");
      } else if (file.type.startsWith("image/")) {
        const image = await loadImageFile(file);
        setPreviewUrl(image.url);
        setBlob(file);
        setName(file.name);
        setKind(kindHint ?? "image");
      } else {
        setError("Use an image or video file.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setBusy(false);
      setDrop(false);
    }
  }, []);

  // Seed from picker / whole-app drop — load as soon as the dialog mounts.
  useEffect(() => {
    if (!presence.mounted || !seed?.file) return;
    if (seedHandled.current === seed.file) return;
    seedHandled.current = seed.file;
    void onFile(seed.file, seed.kindHint);
  }, [presence.mounted, seed, onFile]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, fx: focusX, fy: focusY };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = (event.clientX - drag.current.x) / rect.width;
    const dy = (event.clientY - drag.current.y) / rect.height;
    setFocusX(Math.min(1, Math.max(0, drag.current.fx - dx)));
    setFocusY(Math.min(1, Math.max(0, drag.current.fy - dy)));
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const submit = async () => {
    if (!blob || !previewUrl) return;
    setBusy(true);
    setError(null);
    try {
      const id = `planned-${crypto.randomUUID()}`;
      await addPlanned(
        {
          id,
          kind,
          image: { kind: "blob", key: `pending-${id}` },
          name: name || "Untitled",
          createdAt: Date.now(),
          focusX,
          focusY,
        },
        blob,
      );
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that file.");
    } finally {
      setBusy(false);
    }
  };

  if (!presence.mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`${shell.modalBackdrop} ${presence.closing ? motion.backdropClosing : motion.backdrop}`}
      role="presentation"
      onWheel={onWheel}
      onClick={() => {
        if (!presence.closing) onOpenChange(false);
      }}
    >
      <div
        className={`${shell.modalCard} ${presence.closing ? motion.dialogClosing : motion.dialog}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-media-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={shell.modalHeader}>
          <h2 id="add-media-title">Add</h2>
          <div className={shell.modalHeaderActions}>
            <button type="button" className={shell.modalSecondary} onClick={() => onOpenChange(false)}>
              Cancel
            </button>
            <button type="button" className={shell.modalPrimary} onClick={() => void submit()} disabled={!blob || busy}>
              {busy ? "Saving…" : "Insert"}
            </button>
          </div>
        </header>

        <div ref={scrollRef} className={shell.modalPad} data-modal-scroll>
          <div className={`${shell.modalBody} ${styles.mediaField}`}>
            {!previewUrl ?
              <button
                type="button"
                className={styles.upload}
                disabled={busy}
                data-drop={drop || undefined}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!busy) setDrop(true);
                }}
                onDragLeave={() => setDrop(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDrop(false);
                  void onFile(event.dataTransfer.files?.[0] ?? null);
                }}
              >
                <span className={styles.uploadLabel}>{busy ? "Reading…" : "Upload image or video"}</span>
                <span className={styles.uploadHint}>Drop a file here, or choose one</span>
              </button>
            : <figure className={styles.preview}>
                <div
                  className={styles.crop}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt=""
                    className={styles.cropImg}
                    style={{ objectPosition: focusToObjectPosition(focusX, focusY) }}
                    draggable={false}
                  />
                </div>
                <div className={styles.meta}>
                  <p className={styles.metaTitle}>Grid crop (3:4)</p>
                  {name ? <p className={styles.fileName}>{name}</p> : null}
                  <label className={styles.kindField}>
                    Type
                    <ChoiceGroup
                      ariaLabel="Post type"
                      value={kind}
                      onChange={(value) => setKind(value as Kind)}
                      options={[
                        { value: "image", label: "Post" },
                        { value: "carousel", label: "Carousel" },
                        { value: "reel", label: "Reel" },
                      ]}
                    />
                  </label>
                  <div className={styles.actions}>
                    <button type="button" className={styles.linkBtn} disabled={busy} onClick={() => inputRef.current?.click()}>
                      Replace
                    </button>
                    <button type="button" className={styles.linkBtn} disabled={busy} onClick={reset}>
                      Remove
                    </button>
                  </div>
                </div>
              </figure>
            }

            {error ?
              <p className={shell.modalError} role="alert">
                {error}
              </p>
            : null}

            <input
              ref={inputRef}
              className={styles.file}
              type="file"
              accept="image/*,video/*"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
