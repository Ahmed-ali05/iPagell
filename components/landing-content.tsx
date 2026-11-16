"use client";

import { useEffect } from "react";
import { ArrowRight, BarChart3, BookOpen, CalendarDays, CalendarOff, Check, GraduationCap, LockKeyhole, UsersRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LegacyEntryRedirect } from "@/components/legacy-entry-redirect";
import { ProductImage } from "@/components/product-image";
import { PublicOverview } from "@/components/public-overview";
import { PublicHeader, PublicFooter } from "@/components/public-header";
import shell from "@/app/public-space.module.css";
import { useI18n } from "@/components/i18n-provider";
import type { Locale } from "@/lib/i18n/locale";
import { publicAveragePaths } from "@/lib/i18n/public-routes";
import styles from "@/app/marketing-page.module.css";

export function LandingContent({ localePath, authenticated = false, section = "home" }: { localePath?: Locale; authenticated?: boolean; section?: "home" | "diary" }) {
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
  const registerHref = `/app?mode=register&uiLocale=${locale}`;
  const steps = [
    { title: t("landing.step1Title"), text: t("landing.step1Text") },
    { title: t("landing.step2Title"), text: t("landing.step2Text") },
    { title: t("landing.step3Title"), text: t("landing.step3Text") },
  ];
  const tour = [
    { id: "agenda", icon: CalendarDays, label: t("nav.agenda"), title: t("landing.agendaTitle"), text: t("landing.agendaText"), details: [t("landing.agendaDetail1"), t("landing.agendaDetail2")], view: "overview" as const },
    { id: "grades", icon: GraduationCap, label: t("landing.tourGrades"), title: t("landing.feature1Title"), text: t("landing.feature1Text"), details: [t("landing.gradesDetail1"), t("landing.gradesDetail2")], view: "grades" as const },
    { id: "notes", icon: BookOpen, label: t("landing.tourNotes"), title: t("landing.feature4Title"), text: t("landing.feature4Text"), details: [t("landing.notesDetail1"), t("landing.notesDetail2")], view: "notes" as const },
  ];
  const moreFeatures = [
    { icon: BarChart3, label: t("nav.stats"), title: t("landing.statsTitle"), text: t("landing.statsText") },
    { icon: CalendarOff, label: t("nav.absences"), title: t("landing.absencesTitle"), text: t("landing.absencesText") },
    { icon: UsersRound, label: t("nav.classes"), title: t("landing.classesTitle"), text: t("landing.classesText") },
  ];
  const faqs = [
    { question: t("landing.faq1Q"), answer: t("landing.faq1A") },
    { question: t("landing.faq2Q"), answer: t("landing.faq2A") },
    { question: t("landing.faq3Q"), answer: t("landing.faq3A") },
    { question: t("landing.faq4Q"), answer: t("landing.faq4A") },
    { question: t("landing.faq5Q"), answer: t("landing.faq5A") },
    { question: t("landing.faq6Q"), answer: t("landing.faq6A") },
  ];
  if (section === "home") return <><LegacyEntryRedirect locale={localePath} /><PublicOverview /></>;
  return <div className={`${styles.page} ${shell.page}`}>
    <PublicHeader current="diary" />
    <main>
      <div className={shell.main}><div className={shell.intro}><div><p className={shell.eyebrow}><span>02</span>{t("public.accountRequired")}</p><h1>{t("public.diaryCard")}</h1><p>{t("public.diaryCardText")}</p></div></div></div>
      <Tabs defaultValue="features" className={styles.chapters}>
        <TabsList className={styles.chapterTabs} aria-label={t("public.diary")}>
          <TabsTrigger value="features">{t("landing.navFeatures")}</TabsTrigger>
          <TabsTrigger value="together">{t("landing.navPrivacy")}</TabsTrigger>
          <TabsTrigger value="start">{t("landing.navQuestions")}</TabsTrigger>
        </TabsList>
        <TabsContent value="features" forceMount className={styles.chapterPanel}>
      <section className={styles.featureSection} id="funzioni" aria-labelledby="features-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>{t("landing.tourEyebrow")}</p>
          <h2 id="features-title">{t("landing.tourTitle")}</h2>
          <p>{t("landing.tourText")}</p>
        </div>
        <Tabs defaultValue="agenda" className={styles.productTour}>
          <TabsList className={styles.tourTabs} aria-label={t("landing.navFeatures")}>
            {tour.map(item => <TabsTrigger value={item.id} key={item.id}><item.icon size={18} aria-hidden="true" />{item.label}</TabsTrigger>)}
          </TabsList>
          {tour.map(item => <TabsContent value={item.id} key={item.id} forceMount className={styles.tourPanel}>
            <div className={styles.featureCopy}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <ul className={styles.featureDetails}>{item.details.map(detail => <li key={detail}><Check size={17} aria-hidden="true" /><span>{detail}</span></li>)}</ul>
              {item.id === "grades" && <a className={styles.textLink} href={publicAveragePaths[locale]}>{t("landing.averageToolLink")}<ArrowRight size={17} aria-hidden="true" /></a>}
            </div>
            <figure className={`${styles.imageStage} ${item.id === "grades" ? styles.gradeStage : styles.noteStage}`}><ProductImage view={item.view} /><figcaption>{t("landing.realScreensCaption")}</figcaption></figure>
          </TabsContent>)}
        </Tabs>
        <div className={styles.moreFeatures}>{moreFeatures.map(item => <article key={item.label}>
          <div className={styles.moreFeatureLabel}><item.icon size={21} aria-hidden="true" /><span>{item.label}</span></div>
          <h3>{item.title}</h3><p>{item.text}</p>
        </article>)}</div>
      </section>
        </TabsContent>
        <TabsContent value="together" forceMount className={styles.chapterPanel}>
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
        </TabsContent>
        <TabsContent value="start" forceMount className={styles.chapterPanel}>
      <section className={styles.stepsSection} aria-labelledby="start-title">
        <div className={styles.sectionHeading}><h2 id="start-title">{t("landing.stepsTitle")}</h2></div>
        <ol className={styles.steps}>{steps.map((step, index) => <li key={step.title}><span aria-hidden="true">0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
      </section>
      <section className={styles.faqSection} id="domande" aria-labelledby="faq-title">
        <div className={styles.faqIntro}><h2 id="faq-title">{t("landing.faqTitle")}</h2></div>
        <div className={styles.faqList}>{faqs.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
      </section>
        </TabsContent>
      </Tabs>
      <section className={styles.finalCta} aria-labelledby="ready-title">
        <h2 id="ready-title">{t("landing.readyTitle")}</h2>
        <p>{t("landing.readyText")}</p>
        <a className={styles.primaryCta} href={registerHref}>{t("landing.create")}</a>
      </section>
    </main>
    <PublicFooter />
  </div>;
}
