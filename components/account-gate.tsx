"use client";
import { useState, type FormEvent } from "react";
import { LanguageSelect, useI18n } from "@/components/i18n-provider";
import { apiErrorKey } from "@/lib/i18n/errors";
import { RequestError } from "@/lib/client-http";
import type { MessageKey } from "@/lib/i18n";
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
  const { t } = useI18n();
  const [mode, setMode] = useState<"login" | "register" | "recover">(initialMode);
  const [error, setError] = useState<MessageKey | null>(null);
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
    setError(null);
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
      setError(user ? "auth.invalidDiary" : mode === "recover" ? "auth.invalidRecovery" : mode === "register" ? "auth.invalidSignup" : "auth.invalidCredentials");
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
      setBusy(false);
    }
  }
  const changeMode = (next: typeof mode) => {
    setMode(next);
    setError(null);
  };
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
        <LanguageSelect className="language-select" />
        <span className="eyebrow">{t("auth.tagline")}</span>
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
              disabled={!saved}
              onClick={async () => {
                const reset = recovery.reset;
                setRecovery(null);
                if (reset) changeMode("login");
                else await onAuthenticated();
              }}
            >
              {t("common.continue")}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} key={user?.id ?? mode}>
            <fieldset disabled={busy} className="form-grid">
              {user ? (
                <>
                  <p className="account-email full">
                    {t("auth.account", { username: user.username })}
                  </p>
                  <label>
                    {t("auth.name")}
                    <input
                      name="name"
                      autoComplete="given-name"
                      maxLength={120}
                      required
                      placeholder={t("auth.namePlaceholder")}
                    />
                  </label>
                  <label>
                    {t("auth.school")}
                    <input
                      name="school"
                      maxLength={150}
                      placeholder={t("common.optional")}
                    />
                  </label>
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
                    <input
                      name="startDate"
                      type="date"
                      defaultValue={year + "-08-24"}
                      required
                    />
                  </label>
                  <label>
                    {t("auth.end")}
                    <input
                      name="endDate"
                      type="date"
                      defaultValue={year + 1 + "-01-31"}
                      required
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
                </>
              ) : (
                <>
                  <p className="account-note full">
                    {mode === "register"
                      ? t("auth.registerInfo")
                      : mode === "recover"
                        ? t("auth.recoverInfo")
                        : t("auth.loginInfo")}
                  </p>
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
                    />
                  </label>
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
                      type="password"
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      minLength={mode === "login" ? 1 : 12}
                      maxLength={128}
                      required
                    />
                    <small>
                      {mode === "login"
                        ? t("auth.passwordManager")
                        : t("auth.passwordHint")}
                    </small>
                  </label>
                  {mode === "register" && (
                    <p className="account-note full">
                      {t("auth.noEmail")}
                    </p>
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
                <button
                  type="button"
                  className="text-link"
                  disabled={busy}
                  onClick={() =>
                    changeMode(mode === "recover" ? "login" : "recover")
                  }
                >
                  {mode === "recover"
                    ? t("auth.backLogin")
                    : t("auth.forgot")}
                </button>
              </div>
            )}
          </form>
        )}
        {!user && !recovery && (
          <div className="account-features">
            <span>
              <BookOpen />
              {t("auth.path")}
            </span>
            <span>
              <ShieldCheck />
              {t("auth.personalAccount")}
            </span>
            <span>
              <Cloud />
              {t("auth.devices")}
            </span>
            <span>
              <WifiOff />
              {t("auth.offlineCopy")}
            </span>
          </div>
        )}
      </section>
    </main>
  );
}
