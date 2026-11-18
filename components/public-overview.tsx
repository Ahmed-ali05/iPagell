"use client";

import { ArrowRight, ArrowUpRight, BookOpen, FileText, Sigma } from "lucide-react";
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
  const registerHref = `/app?mode=register&uiLocale=${locale}`;
  const choices = [
    { id: "diary", icon: BookOpen, badge: t("public.accountRequired"), title: t("public.diary"), text: t("public.diaryCardText"), action: t("landing.create"), href: registerHref, secondary: { label: t("public.discover"), href: publicDiaryPaths[locale] } },
    { id: "notes", icon: FileText, badge: t("public.noAccount"), title: t("public.notesCard"), text: t("public.notesCardText"), action: t("public.openNotes"), href: publicNotesPaths[locale] },
    { id: "average", icon: Sigma, badge: t("public.noAccount"), title: t("public.averageCard"), text: t("public.averageCardText"), action: t("public.openAverage"), href: publicAveragePaths[locale] },
  ];
  return <div className={shell.page}><PublicHeader current="home" /><main className={styles.main}>
    <section className={styles.opening} aria-labelledby="public-title">
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>{t("public.homeKicker")}</p>
        <h1 id="public-title" aria-label={title.join(" ")}>{title[0]}{" "}<span>{title[1]}</span></h1>
        <p className={styles.intro}>{t("public.homeText")}</p>
        <div className={styles.actions}>
          <PublicLink className={shell.primaryButton} href={registerHref}>{t("landing.create")}<ArrowRight size={17} aria-hidden="true" /></PublicLink>
          <PublicLink className={shell.secondaryButton} href={`/app?uiLocale=${locale}`}>{t("common.login")}</PublicLink>
        </div>
      </div>
      <figure className={styles.cover}>
        <div className={styles.screenshot}><ProductImage view="overview" priority /></div>
        <figcaption className={styles.coverFooter}><span>{t("public.diaryPreviewTitle")}</span><small>{t("landing.realScreensCaption")}</small></figcaption>
      </figure>
    </section>

    <section className={styles.paths} aria-labelledby="paths-title">
      <h2 id="paths-title" className={styles.sectionTitle}>{t("public.chooseTitle")}</h2>
      <div className={styles.tools}>
        {choices.map(({ id, icon: Icon, badge, title: choiceTitle, text, action, href, secondary }) => <article key={id} className={`${styles.tool} ${id === "diary" ? styles.diaryTool : ""}`} aria-labelledby={`choice-${id}`}>
          <div className={styles.toolTop}><span className={styles.toolIcon}><Icon size={22} strokeWidth={1.8} aria-hidden="true" /></span><span className={id === "diary" ? styles.badgeAccount : styles.badgeFree}>{badge}</span></div>
          <h3 id={`choice-${id}`}>{choiceTitle}</h3>
          <p>{text}</p>
          <div className={styles.toolBottom}>
            <PublicLink className={id === "diary" ? shell.primaryButton : shell.secondaryButton} href={href}>{action}<ArrowUpRight size={16} aria-hidden="true" /></PublicLink>
            {secondary && <PublicLink className={styles.textLink} href={secondary.href}>{secondary.label}<ArrowRight size={16} aria-hidden="true" /></PublicLink>}
          </div>
        </article>)}
      </div>
    </section>

    <section className={styles.schoolContext} aria-labelledby="school-context-title">
      <h2 id="school-context-title">{t("public.swissTitle")}</h2>
      <p>{t("public.swissText")}</p>
      <p>{t("public.swissScale")}</p>
    </section>
    <div className={styles.installSlot}><InstallAppOffer placement="landing" /></div>
  </main><PublicFooter /></div>;
}
