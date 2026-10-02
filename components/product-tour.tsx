"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import styles from "@/app/marketing-page.module.css";

type ExpandedImage = { src: string; alt: string; title: string };

export function ProductTour() {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState<ExpandedImage | null>(null);
  const views = [
    { id: "home", label: t("landing.tourDeadlines"), title: t("landing.tourDeadlineTitle"), text: t("landing.tourDeadlineText"), alt: t("landing.homeImageAlt"), width: 1182, height: 488, mobileWidth: 537, mobileHeight: 486 },
    { id: "grades", label: t("landing.tourGrades"), title: t("landing.tourGradeTitle"), text: t("landing.tourGradeText"), alt: t("landing.gradesImageAlt"), width: 1182, height: 845, mobileWidth: 537, mobileHeight: 608 },
    { id: "notes", label: t("landing.tourNotes"), title: t("landing.tourNoteTitle"), text: t("landing.tourNoteText"), alt: t("landing.notesImageAlt"), width: 1182, height: 1016, mobileWidth: 537, mobileHeight: 986 },
  ];
  return <section className={styles.productTour} aria-label={t("landing.tourLabel")}>
    <p className={styles.tourLabel}>{t("landing.tourLabel")}</p>
    <Tabs defaultValue="home" className={styles.tourTabs}>
      <TabsList className={styles.tourTabList} aria-label={t("landing.tourLabel")}>
        {views.map((view, index) => <TabsTrigger key={view.id} value={view.id} className={styles.tourTab}><span aria-hidden="true">0{index + 1}</span>{view.label}</TabsTrigger>)}
      </TabsList>
      {views.map(view => <TabsContent key={view.id} value={view.id} className={styles.tourPanel}>
        <div className={styles.tourCopy}><h2>{view.title}</h2><p>{view.text}</p></div>
        <button type="button" className={styles.tourScreenshot} data-view={view.id} aria-label={t("landing.openFeatureImage", { name: view.label })} onClick={event => {
          const img = event.currentTarget.querySelector("img");
          if (img) setExpanded({ src: img.currentSrc, alt: view.alt, title: view.label });
        }}>
          <picture>
            <source media="(max-width: 720px)" srcSet={`/product-media/${view.id}-detail-mobile.webp`} width={view.mobileWidth} height={view.mobileHeight} />
            <img src={`/product-media/${view.id}-detail.webp`} alt={view.alt} width={view.width} height={view.height} fetchPriority={view.id === "home" ? "high" : "auto"} decoding="async" />
          </picture>
          <span className={styles.enlargeLabel}><Maximize2 size={15} aria-hidden="true" />{t("landing.enlargeImage")}</span>
        </button>
      </TabsContent>)}
    </Tabs>
    <p className={styles.tourCaption}>{t("landing.realScreensCaption")}</p>
    <Dialog open={expanded !== null} onOpenChange={open => { if (!open) setExpanded(null); }}>
      <DialogContent className={styles.imageDialog}>
        <div className={styles.imageDialogHeading}><DialogTitle>{expanded?.title}</DialogTitle><DialogDescription>{t("landing.realScreensCaption")}</DialogDescription></div>
        {expanded && <div className={styles.imageDialogBody}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Display the selected static screenshot in the page, without navigating to its file. */}
          <img src={expanded.src} alt={expanded.alt} className={styles.expandedScreenshot} />
        </div>}
      </DialogContent>
    </Dialog>
  </section>;
}
