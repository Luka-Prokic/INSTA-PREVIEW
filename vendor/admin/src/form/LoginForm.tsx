"use client";

import { useActionState, useState } from "react";
import styles from "./LoginForm.module.css";

export type LoginState = { error: string | null };

function EyeIcon() {
  return (
    <svg className={styles.toggleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className={styles.toggleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.2 18.2 0 0 1-2.16 3.19" />
      <path d="M6.11 6.11A18.5 18.5 0 0 0 2 12s3.5 7 10 7a10.7 10.7 0 0 0 5.11-1.29" />
    </svg>
  );
}

export function LoginForm({
  action,
  brand,
  subtitle = "Admin",
  passwordLabel = "Password",
  submitLabel = "Log in",
  pendingLabel = "Logging in…",
  from,
}: {
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
  brand: string;
  subtitle?: string;
  passwordLabel?: string;
  submitLabel?: string;
  pendingLabel?: string;
  from?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <form action={formAction} className={styles.form}>
      <p className={styles.title}>{brand}</p>
      <p className={styles.subtitle}>{subtitle}</p>
      {from ? <input type="hidden" name="from" value={from} /> : null}
      <label className={styles.label} htmlFor="password">
        {passwordLabel}
      </label>
      <div className={styles.passwordField}>
        <input
          id="password"
          name="password"
          type={passwordVisible ? "text" : "password"}
          autoComplete="current-password"
          autoFocus
          required
          className={styles.input}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setPasswordVisible((visible) => !visible)}
          aria-label={passwordVisible ? "Hide password" : "Show password"}
          aria-pressed={passwordVisible}
        >
          {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
