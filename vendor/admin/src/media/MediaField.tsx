"use client";

import { useRef, useState } from "react";
import { ConfirmDialog } from "../feedback/ConfirmDialog";
import styles from "./MediaField.module.css";

export type MediaImage = {
  url: string;
  alt: string;
};

export function MediaField({
  images,
  onChange,
  multiple = false,
  disabled = false,
}: {
  images: MediaImage[];
  onChange: (images: MediaImage[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const [drop, setDrop] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | null) {
    if (!file || disabled) return;
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !payload?.url) throw new Error(payload?.error ?? "Upload failed.");
      const next = [...images, { url: payload.url, alt: "" }];
      onChange(multiple ? next : next.slice(-1));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const showUpload = multiple || images.length === 0;

  return (
    <div className={styles.wrap}>
      {images.map((image, index) => (
        <figure key={`${image.url}-${index}`} className={styles.item}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.alt || ""} />
          <div className={styles.meta}>
            {multiple ? (
              <label>
                Alt text
                <input
                  value={image.alt}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange(images.map((item, itemIndex) => (itemIndex === index ? { ...item, alt: event.target.value } : item)))
                  }
                />
              </label>
            ) : null}
            <div className={styles.actions}>
              {multiple ? null : (
                <button className={styles.replace} type="button" disabled={disabled || uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? "Uploading…" : "Replace"}
                </button>
              )}
              <button className={styles.remove} type="button" disabled={disabled} onClick={() => setRemoveIndex(index)}>
                Remove
              </button>
            </div>
          </div>
        </figure>
      ))}
      {showUpload ? (
        <button
          className={styles.upload}
          type="button"
          disabled={disabled || uploading}
          data-drop={drop || undefined}
          onClick={() => fileRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled && !uploading) setDrop(true);
          }}
          onDragLeave={() => setDrop(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDrop(false);
            void onFile(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <span className={styles.uploadLabel}>{uploading ? "Uploading…" : multiple ? "Add image" : "Upload image"}</span>
          <span className={styles.uploadHint}>Drop a file here, or choose one</span>
        </button>
      ) : null}
      <input
        ref={fileRef}
        className={styles.file}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={disabled || uploading}
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          void onFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      {error ? <p className={styles.error}>{error}</p> : null}
      <ConfirmDialog
        open={removeIndex !== null}
        title="Remove image"
        message="This removes the image from the record. The file may remain in storage."
        confirmLabel="Remove"
        onClose={() => setRemoveIndex(null)}
        onConfirm={() => {
          if (removeIndex === null) return;
          onChange(images.filter((_, index) => index !== removeIndex));
          setRemoveIndex(null);
        }}
      />
    </div>
  );
}
