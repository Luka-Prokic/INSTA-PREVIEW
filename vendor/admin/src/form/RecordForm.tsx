"use client";

import { useMemo, useState, type ReactNode } from "react";
import { SelectField } from "../controls/SelectField";
import { MediaField } from "../media/MediaField";
import styles from "./RecordForm.module.css";

export type FieldSpec =
  | {
      kind: "text" | "email" | "textarea" | "number";
      name: string;
      label: string;
      required?: boolean;
      hint?: string;
    }
  | {
      kind: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
      hint?: string;
    }
  | {
      kind: "image";
      name: string;
      label: string;
      hint?: string;
    };

export type FieldValues = Record<string, string>;

function snapshot(values: FieldValues): string {
  return JSON.stringify(values);
}

export function RecordForm({
  fields,
  initial,
  groups,
  extra,
  privateFields,
  onSave,
  onPublish,
  saveLabel = "Save",
  publishLabel = "Publish",
  previewHref,
  disabled = false,
  disabledReason,
}: {
  fields: FieldSpec[];
  initial: FieldValues;
  groups?: { title: string; names: string[] }[];
  extra?: ReactNode;
  privateFields?: ReactNode;
  onSave: (values: FieldValues) => Promise<{ ok: boolean; error?: string; message?: string }>;
  onPublish?: (values: FieldValues) => Promise<{ ok: boolean; error?: string; message?: string }>;
  saveLabel?: string;
  publishLabel?: string;
  previewHref?: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [values, setValues] = useState<FieldValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<"save" | "publish" | null>(null);
  const dirty = useMemo(() => snapshot(values) !== snapshot(initial), [values, initial]);

  function setValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function run(
    kind: "save" | "publish",
    action: (values: FieldValues) => Promise<{ ok: boolean; error?: string; message?: string }>,
  ) {
    setError(null);
    setMessage(null);
    const missing = fields.find((field) => field.kind !== "image" && field.kind !== "select" && field.required && !values[field.name]?.trim());
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    setPending(kind);
    const result = await action(values);
    setPending(null);
    if (!result.ok) setError(result.error ?? "Could not save.");
    else setMessage(result.message ?? "Saved.");
  }

  const grouped = groups ?? [{ title: "", names: fields.map((field) => field.name) }];

  return (
    <form
      className={`${styles.form} adminStagger`}
      data-invalid={error ? "" : undefined}
      onSubmit={(event) => {
        event.preventDefault();
        void run("save", onSave);
      }}
    >
      {disabled && disabledReason ? <p className={styles.notice}>{disabledReason}</p> : null}
      {grouped.map((group) => (
        <section key={group.title || "fields"} className={`${styles.section} adminRise`}>
          {group.title ? <h2 className={styles.sectionTitle}>{group.title}</h2> : null}
          <div className={styles.row}>
            {group.names.map((name) => {
              const field = fields.find((item) => item.name === name);
              if (!field) return null;
              return (
                <div key={field.name} className={styles.field}>
                  <label htmlFor={field.name}>{field.label}</label>
                  {field.kind === "textarea" ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={values[field.name] ?? ""}
                      onChange={(event) => setValue(field.name, event.target.value)}
                      disabled={disabled}
                    />
                  ) : field.kind === "select" ? (
                    <SelectField
                      id={field.name}
                      name={field.name}
                      value={values[field.name] ?? ""}
                      options={field.options}
                      disabled={disabled}
                      onChange={(value) => setValue(field.name, value)}
                    />
                  ) : field.kind === "image" ? (
                    <MediaField
                      images={values[field.name] ? [{ url: values[field.name], alt: "" }] : []}
                      onChange={(images) => setValue(field.name, images[0]?.url ?? "")}
                      disabled={disabled}
                    />
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.kind === "number" ? "number" : field.kind === "email" ? "email" : "text"}
                      value={values[field.name] ?? ""}
                      onChange={(event) => setValue(field.name, event.target.value)}
                      disabled={disabled}
                    />
                  )}
                  {field.hint ? <p className={styles.hint}>{field.hint}</p> : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {extra}
      {privateFields ? (
        <section className={styles.private}>
          <h2 className={styles.privateTitle}>Private</h2>
          {privateFields}
        </section>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className={`${styles.notice} adminSettle`}>{message}</p> : null}
      <div className={styles.actions}>
        <button className={styles.primary} type="submit" disabled={disabled || pending !== null || !dirty}>
          {pending === "save" ? "Saving…" : saveLabel}
        </button>
        {onPublish ? (
          <button
            className={styles.secondary}
            type="button"
            disabled={disabled || pending !== null}
            onClick={() => void run("publish", onPublish)}
          >
            {pending === "publish" ? "Publishing…" : publishLabel}
          </button>
        ) : null}
        {previewHref ? (
          <a className={styles.preview} href={previewHref}>
            Preview
          </a>
        ) : null}
      </div>
    </form>
  );
}

export function FormNotice({ children }: { children: ReactNode }) {
  return <p className={styles.notice}>{children}</p>;
}

export { styles as recordFormStyles };
