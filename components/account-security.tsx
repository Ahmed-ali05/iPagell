"use client";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/components/i18n-provider";
import { apiErrorKey } from "@/lib/i18n/errors";
import type { MessageKey } from "@/lib/i18n";
export function AccountSecurity({
  id,
  username,
  disabled,
  onChanged,
}: {
  id: string;
  username: string;
  disabled: boolean;
  onChanged: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"password" | "delete">("password"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<MessageKey | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || disabled) return;
    setError(null);
    setBusy(true);
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget));
      const result = await fetch("/api/auth/security", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          operation: mode,
          expectedUserId: id,
        }),
      });
      const body = (await result.json()) as { error?: string; code?: string };
      if (!result.ok) {
        setError(apiErrorKey(body.code, "error.operationFailed"));
        return;
      }
      await onChanged();
    } catch {
      setError("error.connectionUnavailable");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="security-settings">
      <summary>{t("security.title")}</summary>
      <p>
        {t("security.passwordHint")}
      </p>
      <div className="auth-links">
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
      </div>
      {disabled && (
        <p>
          {t("security.pendingChanges")}
        </p>
      )}
      <form onSubmit={submit} key={mode}>
        <fieldset disabled={disabled || busy} className="form-grid">
          <label className="full">
            {t("security.currentPassword")}
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              maxLength={128}
              required
            />
          </label>
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
                {t("security.confirmUsername", { username })}
                <input
                  name="confirmation"
                  autoComplete="off"
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
        {error && (
          <p role="alert" className="form-error">
            {t(error)}
          </p>
        )}
      </form>
    </details>
  );
}
