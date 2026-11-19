"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { publicLandingPaths } from "@/lib/i18n/public-routes";
import { LanguageSelect, useI18n } from "@/components/i18n-provider";
import { NativeDateInput } from "@/components/ui/native-date-input";
import { apiErrorKey } from "@/lib/i18n/errors";
import { RequestError } from "@/lib/client-http";
import type { MessageKey } from "@/lib/i18n";
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
  initialMode?: "login" | "register";
  onRegister: (input: Registration) => Promise<void>;
  onAuthenticated: () => Promise<void>;
  onLogout: () => Promise<void>;
};
export function AccountGate({
  user,
  initialMode = "login",
  onRegister,
  onAuthenticated,
  onLogout,
}: Props) {
  const { t, locale } = useI18n();
  const [mode, setMode] = useState<"login" | "register" | "recover">(initialMode);
  const [error, setError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [recovery, setRecovery] = useState<{
    code: string;
    username: string;
    reset: boolean;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const year = new Date().getFullYear() - (new Date().getMonth() < 7 ? 1 : 0);
  useEffect(() => {
    if (user) return;
    // Outcome of a returning Google redirect; the flag is removed from the address.
    const url = new URL(window.location.href);
    const outcome = url.searchParams.get("accesso");
    const returned: MessageKey | null = outcome === "google-error" ? "auth.googleFailed" : outcome === "google-cancelled" ? "auth.googleCancelled" : null;
    if (outcome) {
      url.searchParams.delete("accesso");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
    let active = true;
    fetch("/api/auth/providers", { credentials: "same-origin", cache: "no-store" })
      .then((response) => (response.ok ? response.json() as Promise<{ google?: boolean }> : null))
      .catch(() => null)
      .then((result) => {
        if (!active) return;
        setGoogleReady(result?.google === true);
        if (returned) setError(returned);
      });
    return () => { active = false; };
  }, [user]);
  async function startGoogle() {
    if (busyRef.current) return;
    setError(null);
    busyRef.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/auth/oauth/google/start", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageConfirmed: true }),
      });
      const result = (await response.json()) as { url?: string; error?: string; code?: string };
      if (!response.ok || typeof result.url !== "string" || !result.url.startsWith("https://accounts.google.com/"))
        throw new RequestError(response.status, result.error ?? "Accesso non riuscito", result.code);
      // Stay busy: the browser is leaving for Google.
      window.location.assign(result.url);
    } catch (e) {
      setError(e instanceof RequestError ? apiErrorKey(e.code, "auth.googleFailed") : e instanceof TypeError ? "auth.network" : "auth.googleFailed");
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    setError(null);
    const formFields = Object.fromEntries(new FormData(event.currentTarget));
    const fields: Record<string, FormDataEntryValue | boolean> = !user && mode === "register"
      ? { ...formFields, ageConfirmed: formFields.ageConfirmed === "on" }
      : formFields;
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
      setError(user ? "auth.invalidDiary" : mode === "recover" ? "auth.invalidRecovery" : mode === "register" ? "auth.invalidSignup" : "auth.invalidCredentials");
      return;
    }
    busyRef.current = true;
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
        code?: string;
        recoveryCode?: string;
      };
      if (!response.ok) throw new RequestError(response.status, result.error ?? "Accesso non riuscito", result.code);
      if (result.recoveryCode) {
        setRecovery({
          code: result.recoveryCode,
          username: String(fields.username),
          reset: mode === "recover",
        });
        setSaved(false);
      } else await onAuthenticated();
    } catch (e) {
      setError(e instanceof RequestError ? apiErrorKey(e.code, "error.generic") : e instanceof TypeError ? "auth.network" : "error.generic");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const changeMode = (next: typeof mode) => {
    setMode(next);
    setShowPassword(false);
    setError(null);
  };
  async function continueAfterRecovery() {
    if (!recovery || !saved || busyRef.current) return;
    if (recovery.reset) { setRecovery(null); changeMode("login"); return; }
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await onAuthenticated();
      setRecovery(null);
    } catch (e) {
      setError(e instanceof RequestError ? apiErrorKey(e.code, "error.generic") : e instanceof TypeError ? "auth.network" : "error.generic");
    } finally { busyRef.current = false; setBusy(false); }
  }
  function downloadRecovery() {
    if (!recovery) return;
    const blob = new Blob(
      [
        `${t("auth.recoveryFileTitle")}\n${t("auth.user")}: ${recovery.username}\n${t("auth.code")}: ${recovery.code}\n\n${t("auth.recoveryFileWarning")}\n`,
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
        <div className="account-entry-navigation">
          {!user && !recovery && <a
            className="account-public-return"
            href={publicLandingPaths[locale]}
            aria-disabled={busy || undefined}
            onClick={event => { if (busyRef.current) event.preventDefault(); }}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span>{t("auth.backPublic")}</span>
          </a>}
          <LanguageSelect className="language-select" />
        </div>
        <h1>
          {recovery
            ? t("auth.recoveryTitle")
            : user
              ? t("auth.onboardingTitle")
              : mode === "register"
                ? t("auth.registerTitle")
                : mode === "recover"
                  ? t("auth.recoverTitle")
                  : t("auth.loginTitle")}
        </h1>
        {(!recovery || !recovery.reset) && (user || mode === "register") && <ol className="account-progress">
          {[t("auth.stepAccount"), t("auth.stepRecovery"), t("auth.stepDiary")].map((label, index) => {
            const current = user ? 2 : recovery ? 1 : 0;
            return <li key={label} aria-current={index === current ? "step" : undefined} data-complete={index < current ? "true" : undefined}><span aria-hidden="true">{index + 1}</span>{label}</li>;
          })}
        </ol>}
        {!recovery && mode !== "recover" && <p className="account-note">{user ? t("auth.onboardingIntro") : mode === "register" ? t("auth.registerIntro") : t("auth.loginIntro")}</p>}
        {recovery ? (
          <div className="recovery-panel">
            <p>
              {t("auth.recoveryInfo")}
            </p>
            <label>
              {t("auth.recoveryCode")}
              <textarea readOnly value={recovery.code} rows={3} />
            </label>
            <button className="soft-button" onClick={downloadRecovery}>
              {t("auth.downloadCode")}
            </button>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={saved}
                onChange={(e) => setSaved(e.target.checked)}
              />
              {t("auth.savedCode")}
            </label>
            <button
              className="primary-button"
              disabled={!saved || busy}
              onClick={() => void continueAfterRecovery()}
            >
              {busy ? t("common.wait") : t("common.continue")}
            </button>
            {error && <p className="form-error" role="alert">{t(error)}</p>}
          </div>
        ) : (
          <>
          {!user && mode !== "recover" && googleReady && (
            <div className="oauth-entry">
              <button type="button" className="soft-button oauth-button" disabled={busy} onClick={() => void startGoogle()}>
                <GoogleMark />
                {t("auth.continueGoogle")}
              </button>
              <p className="account-note oauth-consent">
                {t("auth.googleConsent")}{" "}
                <a href="/legale" target="_blank" rel="noopener noreferrer">{t("legal.footerLink")}</a>
              </p>
              <p className="oauth-divider"><span>{t("auth.orUsername")}</span></p>
            </div>
          )}
          <form onSubmit={submit} key={user?.id ?? mode}>
            <fieldset disabled={busy} className="form-grid">
              {user ? (
                <>
                  <p className="account-email full">
                    {t("auth.account", { username: user.username })}
                  </p>
                  <label className="full">
                    {t("auth.name")}
                    <input
                      name="name"
                      autoComplete="given-name"
                      maxLength={120}
                      required
                      placeholder={t("auth.namePlaceholder")}
                    />
                  </label>
                  <label className="full">
                    {t("auth.initialSubjects")}
                    <NativeSelect name="preset">
                      <NativeSelectOption value="empty">
                        {t("auth.addSubjectsMyself")}
                      </NativeSelectOption>
                      <NativeSelectOption value="basic">
                        {t("auth.basicSubjects")}
                      </NativeSelectOption>
                    </NativeSelect>
                  </label>
                  <details className="full onboarding-optional">
                    <summary>{t("auth.periodOptions")}</summary>
                    <p className="account-note">{t("auth.periodHelp")}</p>
                    <div className="form-grid">
                      <label>
                        {t("auth.firstTerm")}
                        <input
                          name="semester"
                          defaultValue={`${t("common.semester")} 1`}
                          maxLength={120}
                          required
                        />
                      </label>
                      <label>
                        {t("auth.schoolYear")}
                        <input
                          name="schoolYear"
                          defaultValue={year + "/" + String(year + 1).slice(-2)}
                          maxLength={120}
                          required
                        />
                      </label>
                      <label>
                        {t("auth.start")}
                        <NativeDateInput
                          name="startDate"
                          type="date"
                          defaultValue={year + "-08-24"}
                          required
                        />
                      </label>
                      <label>
                        {t("auth.end")}
                        <NativeDateInput
                          name="endDate"
                          type="date"
                          defaultValue={year + 1 + "-01-31"}
                          required
                        />
                      </label>
                    </div>
                  </details>
                  <details className="full onboarding-optional">
                    <summary>{t("auth.schoolOptional")}</summary>
                    <label>
                      {t("auth.school")}
                      <input name="school" maxLength={150} />
                    </label>
                  </details>
                </>
              ) : (
                <>
                  {mode === "recover" && <p className="account-note full">{t("auth.recoverInfo")}</p>}
                  <label className="full">
                    {t("auth.username")}
                    <input
                      name="username"
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      minLength={3}
                      maxLength={32}
                      required
                      placeholder={t("auth.usernameExample")}
                      aria-describedby={mode === "register" ? "username-help" : undefined}
                    />
                  </label>
                  {mode === "register" && <small id="username-help" className="account-note full">{t("auth.usernameHint")}</small>}
                  {mode === "recover" && (
                    <label className="full">
                      {t("auth.recoveryCode")}
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
                    {mode === "recover" ? t("auth.newPassword") : t("auth.password")}
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      minLength={mode === "login" ? 1 : 12}
                      maxLength={128}
                      aria-describedby={mode !== "login" ? "password-help" : undefined}
                      required
                    />
                    {mode !== "login" && <small id="password-help">{t("auth.passwordHint")}</small>}
                  </label>
                  <button type="button" className="text-link password-toggle full" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? t("auth.hidePassword") : t("auth.showPassword")}</button>
                  {mode === "register" && (
                    <p className="account-note full">
                      {t("auth.noEmail")}
                    </p>
                  )}
                  {mode === "register" && (
                    <label className="account-consent full">
                      <input type="checkbox" name="ageConfirmed" required />
                      <span>
                        {t("auth.ageConfirm")}{" "}
                        <a href="/legale" target="_blank" rel="noopener noreferrer">{t("legal.footerLink")}</a>
                      </span>
                    </label>
                  )}
                </>
              )}
            </fieldset>
            {user && (
              <p className="account-note">
                {t("auth.storageInfo")}
              </p>
            )}
            {error && (
              <p className="form-error" role="alert">
                {t(error)}
              </p>
            )}
            <button className="primary-button signin-button" disabled={busy}>
              {busy
                ? t("common.wait")
                : user
                  ? t("auth.createDiary")
                  : mode === "register"
                    ? t("common.register")
                    : mode === "recover"
                      ? t("auth.resetPassword")
                      : t("common.login")}
            </button>
            {user ? (
              <button
                type="button"
                className="text-link"
                disabled={busy}
                onClick={() =>
                  void onLogout().catch((e) => setError(e instanceof RequestError ? apiErrorKey(e.code) : "error.generic"))
                }
              >
                {t("auth.useOther")}
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
                    ? t("auth.haveAccount")
                    : t("common.register")}
                </button>
                {mode !== "register" && <button
                  type="button"
                  className="text-link"
                  disabled={busy}
                  onClick={() => changeMode(mode === "recover" ? "login" : "recover")}
                >
                  {mode === "recover" ? t("auth.backLogin") : t("auth.forgot")}
                </button>}
              </div>
            )}
          </form>
          </>
        )}
      </section>
    </main>
  );
}

// Google's standard "G" mark, as its branding guidelines require next to the label.
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
