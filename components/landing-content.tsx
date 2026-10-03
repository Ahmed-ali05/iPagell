"use client";

import { useEffect } from "react";
import { LockKeyhole, UsersRound } from "lucide-react";
import { LegacyEntryRedirect } from "@/components/legacy-entry-redirect";
import { ProductImage } from "@/components/product-image";
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
      <a className={styles.brand} href={localePath ? `/${localePath}` : "/"} aria-label="iPagell"><span className={styles.logo}>iP</span><span>iPagell</span></a>
      <nav className={styles.nav} aria-label={t("landing.navFeatures")}>
        <a href="#funzioni">{t("landing.navFeatures")}</a>
        <a href="#privacy">{t("landing.navPrivacy")}</a>
        <a href="#domande">{t("landing.navQuestions")}</a>
      </nav>
      <div className={styles.headerActions}>
        <LanguageSelect className={styles.languageSelect} publicRoute />
        <a className={styles.headerCta} href={appHref}>{t("common.login")}</a>
      </div>
    </header>
    <main>
      <section className={styles.hero} aria-labelledby="landing-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t("landing.audience")}</p>
          <h1 id="landing-title">{t("landing.title").split("\n").map(line => <span key={line}>{line}</span>)}</h1>
          <p className={styles.lead}>{t("landing.lead")}</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryCta} href={registerHref}>{t("landing.create")}</a>
            <a className={styles.textLink} href="#funzioni">{t("landing.explore")}</a>
          </div>
          <InstallAppOffer placement="landing" />
        </div>
        <figure className={styles.overview}>
          <ProductImage view="overview" priority />
          <figcaption>{t("landing.realScreensCaption")}</figcaption>
        </figure>
        <ul className={styles.productFacts}>
          <li>{t("landing.browserAccess")}</li><li>{t("landing.personalDiary")}</li><li>{t("landing.supportedScale")}</li>
        </ul>
      </section>
      <section className={styles.featureSection} id="funzioni" aria-label={t("landing.navFeatures")}>
        <article className={styles.featureRow}>
          <div className={styles.featureCopy}>
            <p className={styles.eyebrow}>{t("landing.tourGrades")}</p>
            <h2>{t("landing.feature1Title")}</h2>
            <p>{t("landing.feature1Text")}</p>
            <a className={styles.textLink} href={publicAveragePaths[locale]}>{t("landing.averageToolLink")}</a>
          </div>
          <div className={`${styles.imageStage} ${styles.gradeStage}`}><ProductImage view="grades" /></div>
        </article>
        <article className={`${styles.featureRow} ${styles.reverseRow}`}>
          <div className={styles.featureCopy}>
            <p className={styles.eyebrow}>{t("landing.tourNotes")}</p>
            <h2>{t("landing.feature4Title")}</h2>
            <p>{t("landing.feature4Text")}</p>
          </div>
          <div className={`${styles.imageStage} ${styles.noteStage}`}><ProductImage view="notes" /></div>
        </article>
      </section>
      <section className={styles.sharingSection} id="privacy" aria-labelledby="sharing-title">
        <div className={styles.sharingCopy}>
          <p className={styles.eyebrow}>{t("landing.classLabel")}</p>
          <h2 id="sharing-title">{t("landing.feature3Title")}</h2>
          <p>{t("landing.feature3Text")}</p>
        </div>
        <div className={styles.sharingDetails}>
          <div><LockKeyhole size={22} aria-hidden="true" /><h3>{t("landing.privacyTitle")}</h3><p>{t("landing.privacyText")}</p></div>
          <div><UsersRound size={22} aria-hidden="true" /><h3>{t("landing.sharedActivity")}</h3><p>{t("landing.sharingChoice")}</p></div>
        </div>
      </section>
      <section className={styles.stepsSection} aria-labelledby="start-title">
        <div className={styles.sectionHeading}><h2 id="start-title">{t("landing.stepsTitle")}</h2></div>
        <ol className={styles.steps}>{steps.map((step, index) => <li key={step.title}><span aria-hidden="true">0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
      </section>
      <section className={styles.faqSection} id="domande" aria-labelledby="faq-title">
        <div className={styles.faqIntro}><h2 id="faq-title">{t("landing.faqTitle")}</h2></div>
        <div className={styles.faqList}>{faqs.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
      </section>
      <section className={styles.finalCta} aria-labelledby="ready-title">
        <h2 id="ready-title">{t("landing.readyTitle")}</h2>
        <p>{t("landing.readyText")}</p>
        <a className={styles.primaryCta} href={registerHref}>{t("landing.create")}</a>
      </section>
    </main>
    <footer className={styles.footer}>
      <div><a className={styles.brand} href={localePath ? `/${localePath}` : "/"}><span className={styles.logo}>iP</span><span>iPagell</span></a><p>{t("landing.footer")}</p></div>
      <div className={styles.footerLinks}><a href="https://github.com/Ahmed-ali05/iPagell" target="_blank" rel="noopener noreferrer">{t("landing.github")}</a><a href={appHref}>{t("common.login")}</a></div>
    </footer>
  </div>;
}
