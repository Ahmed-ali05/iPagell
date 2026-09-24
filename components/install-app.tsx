"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Download, Ellipsis, Share2, Smartphone, X } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import {
  INSTALL_COMPLETE_KEY,
  INSTALL_DISMISS_KEY,
  installExperience,
  isDismissed,
  isStandalone,
  shouldShowHomeOffer,
  type InstallExperience,
} from "@/lib/install-app";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __ipagellInstallPrompt?: InstallPromptEvent | null;
    __ipagellAppInstalled?: boolean;
  }
}

type InstallState = {
  experience: InstallExperience;
  dismissed: boolean;
  dismiss: () => void;
  prompt: () => Promise<void>;
  homeOfferReady: (hasRealContent: boolean) => boolean;
};

const InstallContext = createContext<InstallState | null>(null);
const COMPLETE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function storageGet(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function storageSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Private mode still works for this session. */ }
}

export function InstallAppProvider({ children }: { children: React.ReactNode }) {
  const promptRef = useRef<InstallPromptEvent | null>(null);
  const startedAt = useRef(0);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ready, setReady] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [userAgent, setUserAgent] = useState("");
  const [ipadDesktopMode, setIpadDesktopMode] = useState(false);

  useEffect(() => {
    startedAt.current = Date.now();
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
        .then((registration) => registration.update()).catch(() => undefined);
    const updateDisplayMode = () => setInstalled(isStandalone(
      (query) => window.matchMedia(query).matches,
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    ));
    queueMicrotask(() => {
      updateDisplayMode();
      setUserAgent(navigator.userAgent);
      setIpadDesktopMode(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setDismissedAt(storageGet(INSTALL_DISMISS_KEY));
      setNow(Date.now());
      const completeAt = Number(storageGet(INSTALL_COMPLETE_KEY));
      if (window.__ipagellAppInstalled || (Number.isFinite(completeAt) && completeAt > 0 && Date.now() - completeAt < COMPLETE_TTL_MS)) setInstalled(true);
    });

    const displayMode = window.matchMedia("(display-mode: standalone)");
    const onBeforeInstall = (event: Event) => {
      const prompt = event as InstallPromptEvent;
      if (typeof prompt.prompt !== "function") return;
      prompt.preventDefault();
      if (isStandalone((query) => window.matchMedia(query).matches, (navigator as Navigator & { standalone?: boolean }).standalone === true)) return;
      promptRef.current = prompt;
      setHasPrompt(true);
      setInstalled(false);
      try { localStorage.removeItem(INSTALL_COMPLETE_KEY); } catch { /* Ignore blocked storage. */ }
    };
    const onInstalled = () => {
      promptRef.current = null;
      setHasPrompt(false);
      setInstalled(true);
      storageSet(INSTALL_COMPLETE_KEY, String(Date.now()));
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    if (window.__ipagellInstallPrompt) onBeforeInstall(window.__ipagellInstallPrompt);
    if (window.__ipagellAppInstalled) onInstalled();
    displayMode.addEventListener("change", updateDisplayMode);
    const onStorage = (event: StorageEvent) => {
      if (event.key === INSTALL_COMPLETE_KEY && event.newValue) setInstalled(true);
      if (event.key === INSTALL_DISMISS_KEY) setDismissedAt(event.newValue);
    };
    window.addEventListener("storage", onStorage);
    const timer = window.setInterval(() => setNow(Date.now()), 5_000);

    // Chromium can report an installation opened in another browser window.
    // Other engines omit this API; no negative inference is made from that.
    const relatedNavigator = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<Array<{ platform: string; id?: string }>> };
    if (relatedNavigator.getInstalledRelatedApps) {
      void relatedNavigator.getInstalledRelatedApps().then((apps) => {
        if (apps.some((app) => app.platform === "webapp" && app.id === `${location.origin}/`)) setInstalled(true);
      }).catch(() => undefined).finally(() => setReady(true));
    } else queueMicrotask(() => setReady(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("storage", onStorage);
      displayMode.removeEventListener("change", updateDisplayMode);
      window.clearInterval(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    const value = String(Date.now());
    setDismissedAt(value);
    storageSet(INSTALL_DISMISS_KEY, value);
  }, []);
  const prompt = useCallback(async () => {
    const event = promptRef.current;
    if (!event) return;
    promptRef.current = null;
    setHasPrompt(false);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "dismissed") dismiss();
    } catch { /* Browser may withdraw an install offer. */ }
  }, [dismiss]);
  const experience = ready ? installExperience(userAgent, hasPrompt, installed, ipadDesktopMode) : "none";
  const dismissed = isDismissed(dismissedAt, now);
  const state = useMemo<InstallState>(() => ({
    experience,
    dismissed,
    dismiss,
    prompt,
    homeOfferReady: (hasRealContent) => shouldShowHomeOffer(experience, hasRealContent, now - startedAt.current, dismissedAt, now),
  }), [experience, dismissed, dismiss, prompt, now, dismissedAt]);
  return <InstallContext.Provider value={state}>{children}</InstallContext.Provider>;
}

export function useInstallApp() {
  const state = useContext(InstallContext);
  if (!state) throw new Error("InstallAppProvider mancante");
  return state;
}

function InstallSteps({ experience }: { experience: InstallExperience }) {
  const {t}=useI18n();
  if (experience === "ios-safari") return (
    <ol className="install-steps" aria-label={t("install.safariStepsLabel")}>
      <li><Share2 aria-hidden="true" /><span>{t("install.safariStepOne")}</span></li>
      <li><ArrowDown aria-hidden="true" /><span>{t("install.safariStepTwo")}</span></li>
      <li><Smartphone aria-hidden="true" /><span>{t("install.safariStepThree")}</span></li>
    </ol>
  );
  const instruction = {
    "android-chrome": t("install.chromeSteps"),
    "android-samsung": t("install.samsungSteps"),
    "android-edge": t("install.edgeSteps"),
    "android-firefox": t("install.firefoxSteps"),
  }[experience as "android-chrome" | "android-samsung" | "android-edge" | "android-firefox"];
  return instruction ? <p className="install-instruction"><Ellipsis aria-hidden="true" />{instruction}</p> : null;
}

export function InstallAppOffer({ placement, hasRealContent = false }: { placement: "landing" | "home" | "settings"; hasRealContent?: boolean }) {
  const {t}=useI18n();
  const install = useInstallApp();
  const [expanded, setExpanded] = useState(false);
  if (install.experience === "none") return null;
  if (placement === "home" && !install.homeOfferReady(hasRealContent)) return null;
  if (placement === "landing" && install.dismissed) return null;
  const isPrompt = install.experience === "prompt";
  const isShortcut = install.experience === "android-firefox" || install.experience === "android-edge";
  return (
    <section className={`install-offer install-offer--${placement}`} aria-label={t("install.offerLabel")}>
      <div className="install-offer__icon" aria-hidden="true"><Smartphone size={20} /></div>
      <div className="install-offer__body">
        <b>{t("install.headline")}</b>
        <p>{isShortcut
          ? t("install.shortcutBody")
          : t("install.installedBody")}</p>
        {expanded && !isPrompt && <InstallSteps experience={install.experience} />}
      </div>
      <div className="install-offer__actions">
        {isPrompt ? <button type="button" className="install-offer__action" onClick={() => void install.prompt()}><Download size={17} aria-hidden="true" /> {t("install.install")}</button>
          : <button type="button" className="install-offer__action" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? t("install.closeGuide") : t("install.howTo")}</button>}
        {placement !== "settings" && <button type="button" className="install-offer__dismiss" onClick={install.dismiss} aria-label={t("install.dismiss")}><X size={17} aria-hidden="true" /></button>}
      </div>
    </section>
  );
}
