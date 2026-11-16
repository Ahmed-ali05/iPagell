"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, FileText, Sigma } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { PublicFooter, PublicHeader, PublicLink } from "@/components/public-header";
import { ProductImage } from "@/components/product-image";
import { InstallAppOffer } from "@/components/install-app";
import { publicAveragePaths, publicDiaryPaths, publicNotesPaths } from "@/lib/i18n/public-routes";
import shell from "@/app/public-space.module.css";
import styles from "@/app/public-overview.module.css";

export function PublicOverview() {
  const { t, locale } = useI18n();
  const title = t("public.homeTitle").split("\n");
  return <div className={shell.page}><PublicHeader current="home" /><main className={styles.main}>
    <section className={styles.opening} aria-labelledby="public-title">
      <div className={styles.heroCopy}><p className={styles.kicker}>{t("public.homeKicker")}</p><h1 id="public-title" aria-label={title.join(" ")}>{title[0]}{" "}<span>{title[1]}</span></h1><p className={styles.intro}>{t("public.homeText")}</p><div className={styles.actions}><PublicLink className={shell.primaryButton} href={publicNotesPaths[locale]}>{t("public.openNotes")}<ArrowUpRight size={17} aria-hidden="true" /></PublicLink><PublicLink className={styles.textLink} href={publicDiaryPaths[locale]}>{t("public.discover")}<ArrowRight size={17} aria-hidden="true" /></PublicLink></div></div>
      <div className={styles.cover}><div className={styles.coverHeader}><BookOpen size={19} aria-hidden="true" /><span>{t("public.diary")}</span><span className={styles.coverNumber}>02</span></div><h2>{t("public.diaryPreviewTitle")}</h2><div className={styles.screenshot}><ProductImage view="overview" priority /></div><div className={styles.coverFooter}><span>{t("landing.realScreensCaption")}</span><PublicLink href={publicDiaryPaths[locale]} className={styles.coverLink}>{t("public.discover")}<ArrowUpRight size={18} aria-hidden="true" /></PublicLink></div></div>
    </section>
    <section className={styles.paths} aria-labelledby="paths-title"><div className={styles.sectionHeader}><h2 id="paths-title">{t("public.startHere")}</h2><ArrowDownRight size={23} aria-hidden="true" /></div><div className={styles.tools}>
      <PublicLink className={`${styles.tool} ${styles.noteTool}`} href={publicNotesPaths[locale]}><div className={styles.toolTop}><span>03 / {t("landing.tourNotes")}</span><FileText size={25} strokeWidth={1.3} aria-hidden="true" /></div><h3>{t("public.notesCard")}</h3><p>{t("public.notesCardText")}</p><div className={styles.toolBottom}><span>PDF · Markdown</span><span>{t("public.openNotes")}<ArrowUpRight size={18} aria-hidden="true" /></span></div></PublicLink>
      <PublicLink className={`${styles.tool} ${styles.averageTool}`} href={publicAveragePaths[locale]}><div className={styles.toolTop}><span>04 / {t("public.average")}</span><Sigma size={27} strokeWidth={1.3} aria-hidden="true" /></div><h3>{t("public.averageCard")}</h3><p>{t("public.averageCardText")}</p><div className={styles.toolBottom}><span>1 — 6</span><span>{t("public.openAverage")}<ArrowUpRight size={18} aria-hidden="true" /></span></div></PublicLink>
    </div></section>
    <section className={styles.schoolContext} aria-labelledby="school-context-title">
      <h2 id="school-context-title">{t("public.swissTitle")}</h2>
      <p>{t("public.swissText")}</p>
      <p>{t("public.swissScale")}</p>
    </section>
    <section className={styles.diaryInvitation}><div><h2>{t("landing.readyTitle")}</h2><p>{t("landing.readyText")}</p></div><div className={styles.diaryActions}><PublicLink className={shell.primaryButton} href={`/app?mode=register&uiLocale=${locale}`}>{t("landing.create")}<ArrowUpRight size={17} aria-hidden="true" /></PublicLink><InstallAppOffer placement="landing" /></div></section>
  </main><PublicFooter /></div>;
}
