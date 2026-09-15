"use client";
import { useState, type FormEvent } from "react";
import { BookOpen, Cloud, ShieldCheck, WifiOff } from "lucide-react";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { registerSchema, type Registration } from "@/lib/validation";
import {
  credentialsSchema,
  recoverySchema,
  signupSchema,
} from "@/lib/auth-validation";
import type { AccountIdentity } from "@/types/domain";

type Props = {
  user: AccountIdentity | null;
  onRegister: (input: Registration) => Promise<void>;
  onAuthenticated: () => Promise<void>;
  onLogout: () => Promise<void>;
};
export function AccountGate({
  user,
  onRegister,
  onAuthenticated,
  onLogout,
}: Props) {
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState<{
    code: string;
    username: string;
    reset: boolean;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const year = new Date().getFullYear() - (new Date().getMonth() < 7 ? 1 : 0);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = (
      user
        ? registerSchema
        : mode === "register"
          ? signupSchema
          : mode === "recover"
            ? recoverySchema
            : credentialsSchema
    ).safeParse(fields);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Controlla i campi.");
      return;
    }
    setBusy(true);
    try {
      if (user) {
        await onRegister(parsed.data as Registration);
        return;
      }
      const response = await fetch("/api/auth/" + mode, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = (await response.json()) as {
        error?: string;
        recoveryCode?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Accesso non riuscito");
      if (result.recoveryCode) {
        setRecovery({
          code: result.recoveryCode,
          username: String(fields.username),
          reset: mode === "recover",
        });
        setSaved(false);
      } else await onAuthenticated();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Connessione non disponibile. Riprova online.",
      );
    } finally {
      setBusy(false);
    }
  }
  const changeMode = (next: typeof mode) => {
    setMode(next);
    setError("");
  };
  function downloadRecovery() {
    if (!recovery) return;
    const blob = new Blob(
      [
        "iPagell — Codice di recupero\nUtente: " +
          recovery.username +
          "\nCodice: " +
          recovery.code +
          "\n\nConservalo in un posto sicuro e non condividerlo. Permette di cambiare la password. È monouso.\n",
      ],
      { type: "text/plain" },
    );
    const href = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = href;
    a.download = "ipagell-codice-recupero.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  return (
    <main className="account-page">
      <section className="account-card">
        <div className="account-brand">
          <span className="brand-mark">iP</span>
          <b>iPagell</b>
        </div>
        <span className="eyebrow">Il tuo diario scolastico</span>
        <h1>
          {recovery
            ? "Conserva la tua chiave."
            : user
              ? "Crea il tuo profilo"
              : mode === "register"
                ? "Il tuo nuovo diario."
                : mode === "recover"
                  ? "Recupera l’account."
                  : "Bentornato."}
        </h1>
        {recovery ? (
          <div className="recovery-panel">
            <p>
              Questo codice permette di reimpostare la password. Verrà mostrato
              solo ora: conservalo in un gestore di password o in un posto
              sicuro.
            </p>
            <label>
              Codice di recupero
              <textarea readOnly value={recovery.code} rows={3} />
            </label>
            <button className="soft-button" onClick={downloadRecovery}>
              Scarica il codice
            </button>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={saved}
                onChange={(e) => setSaved(e.target.checked)}
              />
              Ho conservato il codice in un posto sicuro
            </label>
            <button
              className="primary-button"
              disabled={!saved}
              onClick={async () => {
                const reset = recovery.reset;
                setRecovery(null);
                if (reset) changeMode("login");
                else await onAuthenticated();
              }}
            >
              Continua
            </button>
          </div>
        ) : (
          <form onSubmit={submit} key={user?.id ?? mode}>
            <fieldset disabled={busy} className="form-grid">
              {user ? (
                <>
                  <p className="account-email full">
                    Account: @{user.username}
                  </p>
                  <label>
                    Come ti chiami?
                    <input
                      name="name"
                      autoComplete="given-name"
                      maxLength={120}
                      required
                      placeholder="Il tuo nome"
                    />
                  </label>
                  <label>
                    Scuola o percorso
                    <input
                      name="school"
                      maxLength={150}
                      placeholder="Facoltativo"
                    />
                  </label>
                  <label>
                    Primo periodo
                    <input
                      name="semester"
                      defaultValue="Semestre 1"
                      maxLength={120}
                      required
                    />
                  </label>
                  <label>
                    Anno scolastico
                    <input
                      name="schoolYear"
                      defaultValue={year + "/" + String(year + 1).slice(-2)}
                      maxLength={120}
                      required
                    />
                  </label>
                  <label>
                    Inizio
                    <input
                      name="startDate"
                      type="date"
                      defaultValue={year + "-08-24"}
                      required
                    />
                  </label>
                  <label>
                    Fine
                    <input
                      name="endDate"
                      type="date"
                      defaultValue={year + 1 + "-01-31"}
                      required
                    />
                  </label>
                  <label className="full">
                    Materie iniziali
                    <NativeSelect name="preset">
                      <NativeSelectOption value="empty">
                        Le aggiungo io
                      </NativeSelectOption>
                      <NativeSelectOption value="sig">
                        Base SIG (personalizzabile)
                      </NativeSelectOption>
                    </NativeSelect>
                  </label>
                </>
              ) : (
                <>
                  <p className="account-note full">
                    {mode === "register"
                      ? "Crea un account iPagell indipendente. Scegli un nome utente e una password unica."
                      : mode === "recover"
                        ? "Usa il codice ricevuto alla registrazione. Tutte le sessioni verranno revocate."
                        : "Accedi con il tuo account iPagell."}
                  </p>
                  <label className="full">
                    Nome utente
                    <input
                      name="username"
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      minLength={3}
                      maxLength={32}
                      required
                      placeholder="es. studente_26"
                    />
                  </label>
                  {mode === "recover" && (
                    <label className="full">
                      Codice di recupero
                      <input
                        name="recoveryCode"
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        maxLength={64}
                        required
                      />
                    </label>
                  )}
                  <label className="full">
                    {mode === "recover" ? "Nuova password" : "Password"}
                    <input
                      name="password"
                      type="password"
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      minLength={mode === "login" ? 1 : 15}
                      maxLength={128}
                      required
                    />
                    <small>
                      {mode === "login"
                        ? "Puoi usare il gestore password del dispositivo."
                        : "Almeno 15 caratteri. Una frase lunga è più facile da ricordare."}
                    </small>
                  </label>
                  {mode === "register" && (
                    <p className="account-note full">
                      Non raccogliamo un’email: il recupero avviene tramite un
                      codice personale. Senza password e codice non potremo
                      ripristinare l’accesso.
                    </p>
                  )}
                </>
              )}
            </fieldset>
            {user && (
              <p className="account-note">
                Il diario viene salvato nell’account e su questo dispositivo per
                l’uso offline. Su dispositivi condivisi, esci quando hai finito.
              </p>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary-button signin-button" disabled={busy}>
              {busy
                ? "Attendi…"
                : user
                  ? "Crea il mio diario"
                  : mode === "register"
                    ? "Crea account"
                    : mode === "recover"
                      ? "Reimposta password"
                      : "Accedi"}
            </button>
            {user ? (
              <button
                type="button"
                className="text-link"
                disabled={busy}
                onClick={() =>
                  void onLogout().catch((e) => setError(e.message))
                }
              >
                Usa un altro account
              </button>
            ) : (
              <div className="auth-links">
                <button
                  type="button"
                  className="text-link"
                  disabled={busy}
                  onClick={() =>
                    changeMode(mode === "register" ? "login" : "register")
                  }
                >
                  {mode === "register"
                    ? "Ho già un account"
                    : "Crea un account"}
                </button>
                <button
                  type="button"
                  className="text-link"
                  disabled={busy}
                  onClick={() =>
                    changeMode(mode === "recover" ? "login" : "recover")
                  }
                >
                  {mode === "recover"
                    ? "Torna all’accesso"
                    : "Password dimenticata?"}
                </button>
              </div>
            )}
          </form>
        )}
        {!user && !recovery && (
          <div className="account-features">
            <span>
              <BookOpen />
              Il tuo percorso
            </span>
            <span>
              <ShieldCheck />
              Account personale
            </span>
            <span>
              <Cloud />
              Tra dispositivi
            </span>
            <span>
              <WifiOff />
              Copia offline
            </span>
          </div>
        )}
      </section>
    </main>
  );
}
