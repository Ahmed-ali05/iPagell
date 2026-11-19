"use client";

import { useRef, useState, useTransition, type ReactNode, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { LanguageSelect, useI18n } from "@/components/i18n-provider";
import { publicAveragePaths, publicDiaryPaths, publicLandingPaths, publicNotesPaths } from "@/lib/i18n/public-routes";
import { flushOpenNotes } from "@/lib/notes/flush";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import styles from "@/app/public-space.module.css";

export type PublicSection = "home" | "diary" | "notes" | "average" | "legal";

/** Flush the current editor before client navigation; keep recovery explicit. */
export function PublicLink({ href, children, className, current }: { href: string; children: ReactNode; className?: string; current?: boolean }) {
  const router = useRouter();
  const { t } = useI18n();
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const navigating = useRef(false);
  const trigger = useRef<HTMLAnchorElement>(null);
  async function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (navigating.current || current) return;
    navigating.current = true;
    try { await flushOpenNotes(); startTransition(() => router.push(href)); }
    catch { setConfirm(true); }
    finally { navigating.current = false; }
  }
  return <><a ref={trigger} href={href} className={className} aria-current={current ? "page" : undefined} aria-busy={pending || undefined} onClick={event => void navigate(event)}>{children}</a>
    <Dialog open={confirm} onOpenChange={setConfirm}><DialogContent fallbackFocusRef={trigger}>
      <DialogTitle>{t("public.leaveTitle")}</DialogTitle><DialogDescription>{t("public.leaveText")}</DialogDescription>
      <div className={styles.dialogActions}><button className={styles.secondaryButton} onClick={() => setConfirm(false)}>{t("common.cancel")}</button><button className={styles.primaryButton} onClick={() => { setConfirm(false); router.push(href); }}>{t("public.leave")}</button></div>
    </DialogContent></Dialog>
  </>;
}

export function PublicHeader({ current }: { current: PublicSection }) {
  const { t, locale } = useI18n();
  const sections = [
    { id: "home", label: t("public.overview"), href: publicLandingPaths[locale] },
    { id: "diary", label: t("public.diary"), href: publicDiaryPaths[locale] },
    { id: "notes", label: t("landing.tourNotes"), href: publicNotesPaths[locale] },
    { id: "average", label: t("public.average"), href: publicAveragePaths[locale] },
  ];
  return <header className={styles.header}>
    <PublicLink className={styles.brand} href={publicLandingPaths[locale]}><span className={styles.logo}>iP</span><span>iPagell<span className={styles.brandDot}>.</span></span></PublicLink>
    <nav className={styles.navigation} aria-label={t("public.navigation")}>
      {sections.map((section, index) => <PublicLink key={section.id} href={section.href} current={current === section.id}><span aria-hidden="true">0{index + 1}</span>{section.label}</PublicLink>)}
    </nav>
    <div className={styles.headerActions}>
      <LanguageSelect className={styles.language} publicRoute averageRoute={current === "average"} notesRoute={current === "notes"} diaryRoute={current === "diary"} />
      <PublicLink className={styles.accountLink} href={`/app?uiLocale=${locale}`}>{t("common.login")}<ArrowUpRight size={15} aria-hidden="true" /></PublicLink>
    </div>
  </header>;
}

export function PublicFooter() {
  const { t } = useI18n();
  return <footer className={styles.footer}><span>iPagell<span className={styles.brandDot}>.</span></span><p>{t("landing.footer")}</p><PublicLink href="/legale">{t("legal.footerLink")}</PublicLink><a href="https://github.com/Ahmed-ali05/iPagell" target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={14} aria-hidden="true" /></a></footer>;
}
