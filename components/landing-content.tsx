/* eslint-disable @next/next/no-html-link-for-pages -- Full-page navigation avoids the Vinext client-router crash between landing and diary. */
"use client";

import { useEffect } from "react";
import { ArrowRight, BookOpenCheck, CalendarCheck2, Check, LockKeyhole, UsersRound } from "lucide-react";
import { LegacyEntryRedirect } from "@/components/legacy-entry-redirect";
import { InstallAppOffer } from "@/components/install-app";
import { formatNumber } from "@/lib/i18n";
import { LanguageSelect, useI18n } from "@/components/i18n-provider";
import type { Locale } from "@/lib/i18n/locale";
import { publicAveragePaths } from "@/lib/i18n/public-routes";
import styles from "@/app/marketing-page.module.css";

export function LandingContent({ localePath, authenticated = false }: { localePath?: Locale; authenticated?: boolean }) {
  const { t, locale } = useI18n();
  useEffect(() => {
    if (!authenticated) return;
    const current = new URL(window.location.href);
    const target = new URL("/app", current.origin);
    target.search = current.search;
    target.searchParams.set("uiLocale", localePath ?? locale);
    target.hash = current.hash;
    window.location.replace(`${target.pathname}${target.search}${target.hash}`);
  }, [authenticated, locale, localePath]);
  const appHref = localePath ? `/app?uiLocale=${localePath}` : "/app";
  const registerHref = localePath ? `/app?mode=register&uiLocale=${localePath}` : "/app?mode=register";
  const features = [
    { title: t("landing.feature1Title"), text: t("landing.feature1Text") },
    { title: t("landing.feature2Title"), text: t("landing.feature2Text") },
    { title: t("landing.feature3Title"), text: t("landing.feature3Text") },
    { title: t("landing.feature4Title"), text: t("landing.feature4Text") },
  ];
  const faqs = [
    { question: t("landing.faq1Q"), answer: t("landing.faq1A") },
    { question: t("landing.faq2Q"), answer: t("landing.faq2A") },
    { question: t("landing.faq3Q"), answer: t("landing.faq3A") },
    { question: t("landing.faq4Q"), answer: t("landing.faq4A") },
  ];
  const steps = [
    { title: t("landing.step1Title"), text: t("landing.step1Text") },
    { title: t("landing.step2Title"), text: t("landing.step2Text") },
    { title: t("landing.step3Title"), text: t("landing.step3Text") },
  ];
  const trust = [t("landing.trust1"), t("landing.trust2"), t("landing.trust3")];
  return <div className={styles.page}>
    <LegacyEntryRedirect locale={localePath} />
    <header className={styles.header}>
      <a className={styles.brand} href="/" aria-label="iPagell"><span className={styles.logo}>iP</span><span>iPagell</span></a>
      <nav className={styles.nav} aria-label={t("landing.navFeatures")}>
        <a href="#funzioni">{t("landing.navFeatures")}</a>
        <a href="#privacy">{t("landing.navPrivacy")}</a>
        <a href="#domande">{t("landing.navQuestions")}</a>
      </nav>
      <LanguageSelect className="language-select" publicRoute />
      <a className={styles.headerCta} href={appHref}>{t("common.login")} <ArrowRight size={16} aria-hidden="true" /></a>
    </header>
    <main>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> {t("landing.eyebrow")}</p>
          <h1>{t("landing.title")}</h1>
          <p className={styles.lead}>{t("landing.lead")}</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryCta} href={registerHref}>{t("landing.create")} <ArrowRight size={18} aria-hidden="true" /></a>
            <a className={styles.secondaryCta} href={appHref}>{t("common.login")}</a>
          </div>
          <ul className={styles.trustList}>
            {trust.map((item) => <li key={item}><Check size={15} aria-hidden="true" /> {item}</li>)}
          </ul>
          <InstallAppOffer placement="landing" />
        </div>
        <figure className={styles.productPreview} aria-label={t("landing.preview")}>
          <div className={styles.previewTopbar}><span className={styles.previewBrand}>iP</span><span>{t("landing.previewSemester")}</span><span className={styles.previewHome}>{t("landing.previewHome")}</span></div>
          <div className={styles.previewGrid}>
            <article className={styles.nextCard}><span className={styles.miniLabel}>{t("landing.previewNext")}</span><p>{t("landing.previewSubject")}</p><h2>{t("landing.previewTest")}</h2><small>{t("landing.previewDue")}</small></article>
            <article className={styles.averageCard}><span className={styles.miniLabel}>{t("landing.previewAverage")}</span><strong>{formatNumber(locale, 4.75, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><small>{t("landing.previewGradeCount")}<br />{t("landing.previewScale")}</small></article>
            <article className={styles.agendaCard}><div><CalendarCheck2 size={19} aria-hidden="true" /><b>{t("landing.previewWeek")}</b></div><ul>
              <li><span className={styles.purpleDot} /><p><b>{t("landing.previewPersonalTask")}</b><small>{t("workspace.private")}</small></p><span className={styles.previewDay}>{t("landing.previewPersonalDay")}</span></li>
              <li><span className={styles.orangeDot} /><p><b>{t("landing.previewClassTask")}</b><small>{t("workspace.shared")}</small></p><span className={styles.previewDay}>{t("landing.previewClassDay")}</span></li>
            </ul></article>
          </div>
          <figcaption>{t("landing.previewCaption")}</figcaption>
        </figure>
      </section>
      <section className={styles.featureSection} id="funzioni"><div className={styles.sectionHeading}><h2>{t("landing.featuresTitle")}</h2><p>{t("landing.featuresLead")}</p></div><div className={styles.featureGrid}>
        {features.map(({ title, text }, index) => <article className={styles.featureCard} key={title}><span className={styles.featureNumber}>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}
      </div><a className={styles.toolLink} href={publicAveragePaths[locale]}>{t("landing.averageToolLink")} <ArrowRight size={16} aria-hidden="true" /></a></section>
      <section className={styles.privacySection} id="privacy">
        <div className={styles.privacyVisual} aria-hidden="true"><div className={styles.privateCard}><span><LockKeyhole size={17} /> {t("workspace.private")}</span><b>{t("landing.personalData")}</b></div><div className={styles.separator}><span /></div><div className={styles.sharedCard}><span><UsersRound size={17} /> {t("workspace.shared")}</span><b>{t("landing.sharedActivity")}</b></div></div>
        <div className={styles.privacyCopy}><h2>{t("landing.privacyTitle")}</h2><p>{t("landing.privacyText")}</p><ul>
          <li><LockKeyhole size={18} aria-hidden="true" /> {t("landing.personalData")}</li>
          <li><UsersRound size={18} aria-hidden="true" /> {t("landing.sharedActivity")}</li>
          <li><BookOpenCheck size={18} aria-hidden="true" /> {t("landing.personalProgress")}</li>
        </ul></div>
      </section>
      <section className={styles.stepsSection} id="come-funziona"><div className={styles.sectionHeading}><h2>{t("landing.stepsTitle")}</h2></div><ol className={styles.steps}>
        {steps.map((step, index) => <li key={step.title}><span>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}
      </ol></section>
      <section className={styles.faqSection} id="domande"><div className={styles.faqIntro}><h2>{t("landing.faqTitle")}</h2><p>{t("landing.faqIntro")}</p></div><div className={styles.faqList}>
        {faqs.map((item) => <details key={item.question}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}
      </div></section>
      <section className={styles.finalCta}><div><h2>{t("landing.finalTitle")}</h2><p>{t("landing.finalText")}</p></div><a className={styles.lightCta} href={appHref}>{t("landing.open")} <ArrowRight size={18} aria-hidden="true" /></a></section>
    </main>
    <section className={styles.githubSection} aria-labelledby="github-title"><div className={styles.githubCopy}><h2 id="github-title">{t("landing.openSource")}</h2><p>{t("landing.opensource")}</p></div><a className={styles.githubLink} href="https://github.com/Ahmed-ali05/iPagell" target="_blank" rel="noopener noreferrer">{t("landing.github")}</a></section>
    <footer className={styles.footer}><div className={styles.brand}><span className={styles.logo}>iP</span><span>iPagell</span></div><p>{t("landing.footer")}</p><a href={appHref}>{t("common.login")}</a></footer>
  </div>;
}
