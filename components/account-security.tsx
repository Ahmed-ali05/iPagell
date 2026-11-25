"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useI18n } from "@/components/i18n-provider";
import { RequestError, requestJson } from "@/lib/client-http";
import { intlLocales, type MessageKey } from "@/lib/i18n";
import { apiErrorKey } from "@/lib/i18n/errors";
import type { ReauthOutcome } from "@/lib/reauth";
import { DELETE_WORDS } from "@/lib/account-confirmation";

const outcomeKeys: Record<Exclude<ReauthOutcome, "ok">, MessageKey> = {
  cancelled: "security.reauthCancelled",
  mismatch: "security.reauthMismatch",
  error: "security.reauthFailed",
};

export function AccountSecurity({
  userId,
  username,
  passwordless = false,
  disabled,
  reauthOutcome = null,
  onBeforeReauth,
  onSubmit,
}: {
  userId: string;
  username: string;
  /** Google accounts: no password to change; deletion needs a Google confirmation first. */
  passwordless?: boolean;
  disabled: boolean;
  /** Result of a Google confirmation that just returned to the app. */
  reauthOutcome?: ReauthOutcome | null;
  /** Saves open editors before the browser leaves for Google. */
  onBeforeReauth: () => Promise<void>;
  onSubmit: (operation:"password"|"delete", fields: Record<string, FormDataEntryValue>) => Promise<void>;
}) {
  const { t, locale } = useI18n();
  const [mode, setMode] = useState<"password" | "delete">(passwordless ? "delete" : "password"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<MessageKey | null>(reauthOutcome && reauthOutcome !== "ok" ? outcomeKeys[reauthOutcome] : null),
    // Google accounts only: until when this session's confirmation is valid.
    [reauthUntil, setReauthUntil] = useState<number | null>(null),
    [checked, setChecked] = useState(false),
    [leaving, setLeaving] = useState(false);
  const busyRef = useRef(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const googleRef = useRef<HTMLButtonElement>(null);

  async function loadReauth() {
    try {
      const value = await requestJson<{ reauthUntil: number | null }>("/api/auth/security");
      setReauthUntil(value.reauthUntil);
      return value.reauthUntil;
    } catch {
      return null;
    } finally {
      setChecked(true);
    }
  }

  // Back from Google: open the panel and move focus to the next step.
  useEffect(() => {
    if (!passwordless || !reauthOutcome || !detailsRef.current) return;
    detailsRef.current.open = true;
    let active = true;
    void loadReauth().then((until) => {
      if (!active) return;
      requestAnimationFrame(() => (until ? confirmRef.current : googleRef.current)?.focus());
    });
    return () => { active = false; };
  }, [passwordless, reauthOutcome]);

  async function confirmWithGoogle() {
    if (busyRef.current || disabled) return;
    setError(null);
    busyRef.current = true;
    setLeaving(true);
    try {
      await onBeforeReauth();
      const { url } = await requestJson<{ url: string }>("/api/auth/oauth/google/start", {
        method: "POST",
        body: JSON.stringify({ purpose: "reauth", expectedUserId: userId }),
      });
      if (!url.startsWith("https://accounts.google.com/")) throw new RequestError(502, "", "AUTH_GOOGLE_FAILED");
      // Stay busy: the browser is leaving for Google.
      window.location.assign(url);
    } catch (cause) {
      setError(cause instanceof RequestError ? apiErrorKey(cause.code, "security.reauthFailed") : "error.connectionUnavailable");
      busyRef.current = false;
      setLeaving(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current || disabled) return;
    setError(null);
    busyRef.current = true;
    setBusy(true);
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget));
      await onSubmit(mode, fields);
    } catch (error) {
      if (error instanceof RequestError && error.code === "SECURITY_REAUTH_REQUIRED") setReauthUntil(null);
      // Google accounts confirm with a fixed word, not with their technical handle.
      if (passwordless && error instanceof RequestError && error.code === "SECURITY_CONFIRMATION_MISMATCH")
        setError("security.confirmationWordMismatch");
      else setError(error instanceof RequestError ? apiErrorKey(error.code, "error.operationFailed") : "error.connectionUnavailable");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const until = reauthUntil ? new Intl.DateTimeFormat(intlLocales[locale], { hour: "2-digit", minute: "2-digit" }).format(reauthUntil) : "";
  // Google accounts see the deletion form only after confirming the account.
  const showForm = !passwordless || reauthUntil !== null;
  return (
    <details
      ref={detailsRef}
      className="security-settings"
      onToggle={(event) => {
        if (passwordless && event.currentTarget.open && !checked) void loadReauth();
      }}
    >
      <summary>{t("security.title")}</summary>
      <p>
        {passwordless ? t("security.googleHint") : t("security.passwordHint")}
      </p>
      {!passwordless && <div className="auth-links">
        <button
          type="button"
          className="soft-button"
          onClick={() => {
            setMode("password");
            setError(null);
          }}
        >
          {t("security.changePassword")}
        </button>
        <button
          type="button"
          className="soft-button danger"
          onClick={() => {
            setMode("delete");
            setError(null);
          }}
        >
          {t("security.deleteAccount")}
        </button>
      </div>}
      {disabled && (
        <p>
          {t("security.pendingChanges")}
        </p>
      )}
      {passwordless && !showForm && (
        <div className="reauth-step">
          <button
            ref={googleRef}
            type="button"
            className="soft-button"
            disabled={disabled || leaving || !checked}
            aria-busy={leaving}
            onClick={() => void confirmWithGoogle()}
          >
            {leaving ? t("common.pleaseWait") : t("security.confirmGoogle")}
          </button>
          <small className="account-note">{t("security.confirmGoogleHint")}</small>
        </div>
      )}
      <p role="status" className="sessions-status">
        {passwordless && reauthUntil !== null ? t("security.reauthConfirmed", { time: until }) : ""}
      </p>
      {showForm && <form onSubmit={submit} key={mode}>
        <fieldset disabled={disabled || busy} className="form-grid">
          {!passwordless && <label className="full">
            {t("security.currentPassword")}
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              maxLength={128}
              required
            />
          </label>}
          {mode === "password" ? (
            <label className="full">
              {t("security.newPassword")}
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </label>
          ) : (
            <>
              <p className="full form-error">
                {t("security.deleteWarning")}
              </p>
              <label className="full">
                {passwordless
                  ? t("security.confirmWord", { word: DELETE_WORDS[locale] })
                  : t("security.confirmUsername", { username })}
                <input
                  ref={confirmRef}
                  name="confirmation"
                  autoComplete="off"
                  autoCapitalize={passwordless ? "characters" : "none"}
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  maxLength={32}
                />
              </label>
            </>
          )}
          <button className="primary-button full" type="submit">
            {busy
              ? t("common.pleaseWait")
              : mode === "password"
                ? t("security.changePassword")
                : t("security.confirmDelete")}
          </button>
        </fieldset>
      </form>}
      {error && (
        <p role="alert" className="form-error">
          {t(error)}
        </p>
      )}
    </details>
  );
}
