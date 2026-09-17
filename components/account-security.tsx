"use client";
import { useState, type FormEvent } from "react";
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
  const [mode, setMode] = useState<"password" | "delete">("password"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || disabled) return;
    setError("");
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
      const body = (await result.json()) as { error?: string };
      if (!result.ok) throw new Error(body.error ?? "Operazione non riuscita");
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connessione non disponibile");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="security-settings">
      <summary>Sicurezza e gestione account</summary>
      <p>
        Il cambio password chiude tutte le sessioni. Il tuo codice di recupero
        rimane valido.
      </p>
      <div className="auth-links">
        <button
          type="button"
          className="soft-button"
          onClick={() => {
            setMode("password");
            setError("");
          }}
        >
          Cambia password
        </button>
        <button
          type="button"
          className="soft-button danger"
          onClick={() => {
            setMode("delete");
            setError("");
          }}
        >
          Elimina account
        </button>
      </div>
      {disabled && (
        <p>
          Sincronizza o esporta e risolvi le modifiche in attesa prima di
          gestire l’account.
        </p>
      )}
      <form onSubmit={submit} key={mode}>
        <fieldset disabled={disabled || busy} className="form-grid">
          <label className="full">
            Password attuale
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
              Nuova password
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
                L’eliminazione rimuove definitivamente l’account e il diario dal
                server. Le copie esportate e quelle offline su altri dispositivi
                non possono essere cancellate a distanza. Esporta prima un
                backup.
              </p>
              <label className="full">
                Scrivi {username} per confermare
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
              ? "Attendi…"
              : mode === "password"
                ? "Cambia password e chiudi le sessioni"
                : "Elimina definitivamente il mio account"}
          </button>
        </fieldset>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
      </form>
    </details>
  );
}
