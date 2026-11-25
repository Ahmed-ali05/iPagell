"use client";
import { useRef, useState } from "react";
import { Laptop, Smartphone } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { RequestError, requestJson } from "@/lib/client-http";
import { formatDate, intlLocales, selectPlural, type Locale, type MessageKey } from "@/lib/i18n";
import { apiErrorKey } from "@/lib/i18n/errors";
import { isMobileSystem, parseClientCode, type SessionBrowser, type SessionSummary, type SessionSystem } from "@/lib/session-devices";

const browserKeys: Record<SessionBrowser, MessageKey> = {
  safari: "sessions.browserSafari",
  chrome: "sessions.browserChrome",
  firefox: "sessions.browserFirefox",
  edge: "sessions.browserEdge",
  samsung: "sessions.browserSamsung",
  opera: "sessions.browserOpera",
  other: "sessions.browserOther",
};
const systemKeys: Record<SessionSystem, MessageKey> = {
  ios: "sessions.systemIos",
  android: "sessions.systemAndroid",
  macos: "sessions.systemMacos",
  windows: "sessions.systemWindows",
  chromeos: "sessions.systemChromeos",
  linux: "sessions.systemLinux",
  other: "sessions.systemOther",
};
/** Matches the server's last-activity precision. */
const ACTIVE_WINDOW_MS = 15 * 60 * 1000;
const LEAVE_MS = 180;

type Confirm = (request: { title: string; description: string; actionLabel: string; run: () => Promise<void> }) => void;
type Load = "idle" | "loading" | "ready" | "failed";

function relativeTime(locale: Locale, timestamp: number, now: number) {
  const format = new Intl.RelativeTimeFormat(intlLocales[locale], { numeric: "auto" });
  const minutes = Math.round((timestamp - now) / 60000);
  if (Math.abs(minutes) < 60) return format.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return format.format(hours, "hour");
  return format.format(Math.round(hours / 24), "day");
}

function reducedMotion() {
  return document.documentElement.dataset.reduceMotion === "true"
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AccountSessions({ userId, method, confirm }: {
  userId: string;
  method?: "password" | "google";
  /** Opens the shared confirmation dialog of the Settings. */
  confirm: Confirm;
}) {
  const { t, locale } = useI18n();
  const [load, setLoad] = useState<Load>("idle"),
    [sessions, setSessions] = useState<SessionSummary[]>([]),
    // Times are relative to when the list was loaded (render stays pure).
    [loadedAt, setLoadedAt] = useState(0),
    [busy, setBusy] = useState<string | null>(null),
    [leaving, setLeaving] = useState<string[]>([]),
    [status, setStatus] = useState(""),
    [error, setError] = useState<MessageKey | null>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const busyRef = useRef(false);

  const errorKey = (cause: unknown) =>
    cause instanceof RequestError ? apiErrorKey(cause.code, "error.operationFailed") : "error.connectionUnavailable";

  async function refresh() {
    setLoad("loading");
    setError(null);
    setStatus("");
    try {
      const value = await requestJson<{ sessions: SessionSummary[] }>("/api/auth/sessions");
      setSessions(value.sessions);
      setLoadedAt(Date.now());
      setLoad("ready");
    } catch (cause) {
      setError(errorKey(cause));
      setLoad("failed");
    }
  }

  function label(session: SessionSummary) {
    const client = parseClientCode(session.client);
    if (!client) return t("sessions.unknownDevice");
    if (client.system === "other") return t(browserKeys[client.browser]);
    return t("sessions.deviceLabel", { browser: t(browserKeys[client.browser]), system: t(systemKeys[client.system]) });
  }

  function details(session: SessionSummary, now: number) {
    const parts: string[] = [];
    if (session.method) parts.push(t(session.method === "google" ? "sessions.methodGoogle" : "sessions.methodPassword"));
    if (session.createdAt) parts.push(t("sessions.signedIn", { date: formatDate(locale, new Date(session.createdAt), { day: "numeric", month: "short" }) }));
    const seen = session.current ? now : session.lastSeenAt;
    if (seen) parts.push(now - seen < ACTIVE_WINDOW_MS ? t("sessions.activeNow") : t("sessions.lastActive", { time: relativeTime(locale, seen, now) }));
    return parts.join(" · ");
  }

  // Rows leave only after the server confirmed: no optimistic removal.
  function remove(ids: string[], focusAfter: () => void) {
    const done = () => {
      setSessions((list) => list.filter((session) => !ids.includes(session.id)));
      setLeaving([]);
      requestAnimationFrame(focusAfter);
    };
    if (reducedMotion()) return done();
    setLeaving(ids);
    window.setTimeout(done, LEAVE_MS);
  }

  async function post(body: Record<string, string>) {
    return requestJson<{ revoked: number }>("/api/auth/sessions", {
      method: "POST",
      body: JSON.stringify({ ...body, expectedUserId: userId }),
    });
  }

  async function revoke(session: SessionSummary) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(session.id);
    setError(null);
    setStatus("");
    try {
      const { revoked } = await post({ operation: "revoke", id: session.id });
      setStatus(t(revoked ? "sessions.revokedOne" : "sessions.alreadyClosed"));
      const others = sessions.filter((item) => !item.current && item.id !== session.id);
      const index = sessions.findIndex((item) => item.id === session.id);
      const next = others.find((item) => sessions.indexOf(item) > index) ?? others.at(-1);
      remove([session.id], () => (next ? buttons.current.get(next.id) : summaryRef.current)?.focus());
    } catch (cause) {
      setError(errorKey(cause));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }

  function revokeOthers() {
    confirm({
      title: t("sessions.revokeOthersConfirm"),
      description: t("sessions.revokeOthersDescription"),
      actionLabel: t("sessions.revokeOthers"),
      run: async () => {
        setError(null);
        setStatus("");
        try {
          const { revoked } = await post({ operation: "revoke-others" });
          setStatus(t(selectPlural(locale, revoked, "sessions.revokedCountOne", "sessions.revokedCountMany"), { count: revoked }));
          remove(sessions.filter((item) => !item.current).map((item) => item.id), () => summaryRef.current?.focus());
        } catch (cause) {
          setError(errorKey(cause));
        }
      },
    });
  }

  const now = loadedAt;
  const others = sessions.filter((session) => !session.current);
  return (
    <details
      className="security-settings account-sessions"
      onToggle={(event) => {
        if (event.currentTarget.open && load !== "loading") void refresh();
      }}
    >
      <summary ref={summaryRef}>{t("sessions.title")}</summary>
      <p>{t("sessions.intro")}</p>
      {load === "loading" && sessions.length === 0 && <p className="sessions-muted">{t("sessions.loading")}</p>}
      {load === "failed" && sessions.length === 0 && (
        <button type="button" className="soft-button" onClick={() => void refresh()}>{t("common.retry")}</button>
      )}
      {sessions.length > 0 && (
        <ul className="session-list" aria-label={t("sessions.title")}>
          {sessions.map((session) => {
            const name = label(session);
            const client = parseClientCode(session.client);
            const Icon = client && isMobileSystem(client.system) ? Smartphone : Laptop;
            return (
              <li key={session.id} data-leaving={leaving.includes(session.id) || undefined}>
                <Icon aria-hidden="true" />
                <div>
                  <strong>
                    {name}
                    {session.current && <span className="session-current">{t("sessions.thisDevice")}</span>}
                  </strong>
                  <small>{details(session, now)}</small>
                </div>
                {!session.current && (
                  <button
                    type="button"
                    className="soft-button compact"
                    ref={(node) => {
                      if (node) buttons.current.set(session.id, node);
                      else buttons.current.delete(session.id);
                    }}
                    disabled={busy !== null}
                    aria-busy={busy === session.id}
                    aria-label={t("sessions.revokeNamed", { device: name })}
                    onClick={() => void revoke(session)}
                  >
                    {busy === session.id ? t("common.pleaseWait") : t("sessions.revoke")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {load === "ready" && others.length === 0 && <p className="sessions-muted">{t("sessions.none")}</p>}
      {others.length > 0 && (
        <button type="button" className="soft-button" disabled={busy !== null} onClick={revokeOthers}>
          {t("sessions.revokeOthers")}
        </button>
      )}
      <p className="sessions-muted">{t(method === "google" ? "sessions.hintGoogle" : "sessions.hintPassword")}</p>
      <p role="status" className="sessions-status">{status}</p>
      {error && <p role="alert" className="form-error">{t(error)}</p>}
    </details>
  );
}
