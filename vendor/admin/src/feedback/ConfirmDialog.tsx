"use client";

import { useEffect, useState } from "react";
import styles from "./ConfirmDialog.module.css";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmPhrase,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmPhrase?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const phraseRequired = Boolean(confirmPhrase?.trim());
  const phraseMatches = !phraseRequired || typed.trim() === confirmPhrase?.trim();

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        {phraseRequired ? (
          <label className={styles.phrase}>
            Type {confirmPhrase} to confirm
            <input value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" spellCheck={false} />
          </label>
        ) : null}
        <div className={styles.actions}>
          <button type="button" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.danger}
            disabled={!phraseMatches}
            onClick={() => {
              if (!phraseMatches) return;
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
