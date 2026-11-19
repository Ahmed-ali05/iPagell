"use client";

import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, FileText, GraduationCap, LockKeyhole, Sigma, UsersRound } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { PublicFooter, PublicHeader, PublicLink } from "@/components/public-header";
import { InstallAppOffer } from "@/components/install-app";
import images from "@/lib/product-media.json";
import { publicAveragePaths, publicDiaryPaths, publicNotesPaths } from "@/lib/i18n/public-routes";
import shell from "@/app/public-space.module.css";
import styles from "@/app/public-overview.module.css";

type ShotView = keyof typeof images.it;

export function PublicOverview() {
  const { t, locale } = useI18n();
  const title = t("public.homeTitle").split("\n");
  const registerHref = `/app?mode=register&uiLocale=${locale}`;
  const loginHref = `/app?uiLocale=${locale}`;
  const shots: { view: ShotView; alt: string; className: string }[] = [
    { view: "notes", alt: t("landing.notesImageAlt"), className: styles.shotNotes },
    { view: "overview", alt: t("landing.overviewImageAlt"), className: styles.shotAgenda },
    { view: "grades", alt: t("landing.gradesImageAlt"), className: styles.shotGrades },
  ];
  const features = [
    { id: "agenda", icon: CalendarDays, title: t("nav.agenda"), text: t("public.featureAgendaText") },
    { id: "grades", icon: GraduationCap, title: t("landing.tourGrades"), text: t("public.featureGradesText") },
    { id: "notes", icon: BookOpen, title: t("landing.tourNotes"), text: t("public.featureNotesText") },
    { id: "classes", icon: UsersRound, title: t("nav.classes"), text: t("public.featureClassesText") },
  ];
  const tools = [
    { id: "notes", icon: FileText, title: t("public.notesCard"), text: t("public.notesCardText"), action: t("public.openNotes"), href: publicNotesPaths[locale] },
    { id: "average", icon: Sigma, title: t("public.averageCard"), text: t("public.averageCardText"), action: t("public.openAverage"), href: publicAveragePaths[locale] },
  ];
  const facts = [
    { value: t("public.factScaleValue"), text: t("public.factScaleText") },
    { value: t("public.factLanguagesValue"), text: t("public.factLanguagesText") },
    { value: t("public.factWebValue"), text: t("public.factWebText") },
  ];
  return <div className={shell.page}><PublicHeader current="home" /><main className={styles.main}>
    <section className={styles.opening} aria-labelledby="public-title">
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>{t("public.homeKicker")}</p>
        <h1 id="public-title" aria-label={title.join(" ")}>{title[0]}{" "}<span>{title[1]}</span></h1>
        <p className={styles.intro}>{t("public.homeText")}</p>
        <div className={styles.actions}>
          <PublicLink className={shell.primaryButton} href={registerHref}>{t("landing.create")}<ArrowRight size={17} aria-hidden="true" /></PublicLink>
          <PublicLink className={shell.secondaryButton} href={loginHref}>{t("common.login")}</PublicLink>
        </div>
        <a className={styles.freeHint} href="#strumenti">{t("public.homeFreeHint")}<ArrowRight size={15} aria-hidden="true" /></a>
      </div>
      <figure className={styles.stage}>
        <div className={styles.stageMark} aria-hidden="true">iP</div>
        {shots.map(({ view, alt, className }, index) => {
          const asset = images[locale][view];
          return <div key={view} className={`${styles.shot} ${className}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Static localized screenshots; sizes are declared to avoid layout shift. */}
            <img src={asset.mobile} alt={alt} width={asset.mobileWidth} height={asset.mobileHeight} loading="eager" fetchPriority={index === 1 ? "high" : "auto"} decoding="async" />
          </div>;
        })}
        <figcaption className={styles.stageCaption}>{t("landing.realScreensCaption")}</figcaption>
      </figure>
    </section>

    <section className={styles.features} aria-labelledby="features-title">
      <h2 id="features-title" className={styles.sectionTitle}>{t("public.featuresTitle")}</h2>
      <ul className={styles.featureGrid}>
        {features.map(({ id, icon: Icon, title: featureTitle, text }) => <li key={id} className={styles.feature} data-feature={id}>
          <span className={styles.featureIcon}><Icon size={22} strokeWidth={1.8} aria-hidden="true" /></span>
          <h3>{featureTitle}</h3>
          <p>{text}</p>
        </li>)}
      </ul>
      <div className={styles.privacy}>
        <LockKeyhole size={18} aria-hidden="true" />
        <p>{t("public.privacyLine")}</p>
        <PublicLink className={styles.textLink} href={publicDiaryPaths[locale]}>{t("public.discover")}<ArrowRight size={16} aria-hidden="true" /></PublicLink>
      </div>
    </section>

    <section className={styles.tools} id="strumenti" aria-labelledby="tools-title">
      <h2 id="tools-title" className={styles.sectionTitle}>{t("public.toolsTitle")}</h2>
      <div className={styles.toolGrid}>
        {tools.map(({ id, icon: Icon, title: toolTitle, text, action, href }) => <article key={id} className={styles.tool} aria-labelledby={`tool-${id}`}>
          <span className={styles.toolIcon}><Icon size={22} strokeWidth={1.8} aria-hidden="true" /></span>
          <div className={styles.toolBody}>
            <h3 id={`tool-${id}`}>{toolTitle}</h3>
            <p>{text}</p>
          </div>
          <PublicLink className={shell.secondaryButton} href={href}>{action}<ArrowUpRight size={16} aria-hidden="true" /></PublicLink>
        </article>)}
      </div>
    </section>

    <section className={styles.swiss} aria-labelledby="swiss-title">
      <h2 id="swiss-title" className={styles.sectionTitle}>{t("public.swissTitle")}</h2>
      <dl className={styles.facts}>
        {facts.map(fact => <div key={fact.value}><dt>{fact.value}</dt><dd>{fact.text}</dd></div>)}
      </dl>
      <p className={styles.swissNote}>{t("public.swissText")}</p>
    </section>

    <section className={styles.closing} aria-labelledby="closing-title">
      <span className={styles.closingMark} aria-hidden="true">iP</span>
      <h2 id="closing-title">{t("public.ctaTitle")}</h2>
      <p>{t("public.ctaText")}</p>
      <div className={styles.closingActions}>
        <PublicLink className={styles.closingPrimary} href={registerHref}>{t("landing.create")}<ArrowRight size={17} aria-hidden="true" /></PublicLink>
        <PublicLink className={styles.closingSecondary} href={loginHref}>{t("common.login")}</PublicLink>
      </div>
    </section>
    <div className={styles.installSlot}><InstallAppOffer placement="landing" /></div>
  </main><PublicFooter /></div>;
}
