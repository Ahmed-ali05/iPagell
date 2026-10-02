/* eslint-disable @next/next/no-html-link-for-pages -- Full-page navigation avoids the Vinext client-router crash between landing and diary. */
"use client";

import { useEffect } from "react";
import { ArrowRight, BookOpen, CalendarCheck2, Check, GraduationCap, LockKeyhole, UsersRound } from "lucide-react";
import { LegacyEntryRedirect } from "@/components/legacy-entry-redirect";
import { ProductTour } from "@/components/product-tour";
import { InstallAppOffer } from "@/components/install-app";
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
    { icon: CalendarCheck2, title: t("landing.feature2Title"), text: t("landing.feature2Text") },
    { icon: GraduationCap, title: t("landing.feature1Title"), text: t("landing.feature1Text") },
    { icon: BookOpen, title: t("landing.feature4Title"), text: t("landing.feature4Text") },
    { icon: UsersRound, title: t("landing.feature3Title"), text: t("landing.feature3Text") },
  ];
  const steps = [
    { title: t("landing.step1Title"), text: t("landing.step1Text") },
    { title: t("landing.step2Title"), text: t("landing.step2Text") },
    { title: t("landing.step3Title"), text: t("landing.step3Text") },
  ];
  const faqs = [
    { question: t("landing.faq1Q"), answer: t("landing.faq1A") },
    { question: t("landing.faq2Q"), answer: t("landing.faq2A") },
    { question: t("landing.faq3Q"), answer: t("landing.faq3A") },
    { question: t("landing.faq4Q"), answer: t("landing.faq4A") },
    { question: t("landing.faq5Q"), answer: t("landing.faq5A") },
    { question: t("landing.faq6Q"), answer: t("landing.faq6A") },
  ];
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
          <p className={styles.eyebrow}>{t("landing.audience")}</p>
          <h1>{t("landing.title")}</h1>
          <p className={styles.lead}>{t("landing.lead")}</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryCta} href={registerHref}>{t("landing.create")} <ArrowRight size={18} aria-hidden="true" /></a>
            <a className={styles.secondaryCta} href={publicAveragePaths[locale]}>{t("landing.tryAverage")}</a>
          </div>
          <ul className={styles.trustList}>
            <li><Check size={15} aria-hidden="true" />{t("landing.supportedScale")}</li>
            <li><Check size={15} aria-hidden="true" />{t("landing.personalDiary")}</li>
            <li><Check size={15} aria-hidden="true" />{t("landing.browserAccess")}</li>
          </ul>
          <InstallAppOffer placement="landing" />
        </div>
        <ProductTour />
      </section>
      <section className={styles.featureSection} id="funzioni"><div className={styles.sectionHeading}><h2>{t("landing.featuresTitle")}</h2></div><div className={styles.featureGrid}>
        {features.map(({ icon: Icon, title, text }) => <article className={styles.featureCard} key={title}><Icon size={24} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}
      </div><a className={styles.toolLink} href={publicAveragePaths[locale]}>{t("landing.averageToolLink")} <ArrowRight size={16} aria-hidden="true" /></a></section>
      <section className={styles.stepsSection} id="inizia" aria-labelledby="start-title">
        <div className={styles.sectionHeading}><h2 id="start-title">{t("landing.stepsTitle")}</h2><p>{t("landing.stepsIntro")}</p></div>
        <ol className={styles.steps}>{steps.map((step, index) => <li key={step.title}><span aria-hidden="true">{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
      </section>
      <section className={styles.privacySection} id="privacy">
        <div className={styles.privacyVisual} aria-hidden="true"><div className={styles.privateCard}><span><LockKeyhole size={17} /> {t("workspace.private")}</span><b>{t("landing.personalData")}</b></div><div className={styles.separator}><span /></div><div className={styles.sharedCard}><span><UsersRound size={17} /> {t("workspace.shared")}</span><b>{t("landing.sharedActivity")}</b></div></div>
        <div className={styles.privacyCopy}><h2>{t("landing.privacyTitle")}</h2><p>{t("landing.privacyText")}</p></div>
      </section>
      <section className={styles.faqSection} id="domande"><div className={styles.faqIntro}><h2>{t("landing.faqTitle")}</h2></div><div className={styles.faqList}>
        {faqs.map((item) => <details key={item.question}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}
      </div></section>
      <section className={styles.finalCta}><div><h2>{t("landing.readyTitle")}</h2><p>{t("landing.readyText")}</p></div><a className={styles.lightCta} href={registerHref}>{t("landing.create")} <ArrowRight size={18} aria-hidden="true" /></a></section>
    </main>
    <section className={styles.githubSection} aria-labelledby="github-title"><div className={styles.githubCopy}><h2 id="github-title">{t("landing.openSource")}</h2><p>{t("landing.opensource")}</p></div><a className={styles.githubLink} href="https://github.com/Ahmed-ali05/iPagell" target="_blank" rel="noopener noreferrer">{t("landing.github")}</a></section>
    <footer className={styles.footer}><div className={styles.brand}><span className={styles.logo}>iP</span><span>iPagell</span></div><p>{t("landing.footer")}</p><a href={appHref}>{t("common.login")}</a></footer>
  </div>;
}
