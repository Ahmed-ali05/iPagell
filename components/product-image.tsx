"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import images from "@/lib/product-media.json";
import styles from "@/app/marketing-page.module.css";



export function ProductImage({ view, priority = false }: { view: keyof typeof images.it; priority?: boolean }) {
  const { t, locale } = useI18n();
  const [expandedSrc, setExpandedSrc] = useState<string | null>(null);
  const asset = images[locale][view];
  const title = view === "overview" ? t("landing.tourDeadlines") : view === "grades" ? t("landing.tourGrades") : t("landing.tourNotes");
  const alt = view === "overview" ? t("landing.overviewImageAlt") : view === "grades" ? t("landing.gradesImageAlt") : t("landing.notesImageAlt");
  return <Dialog open={expandedSrc !== null} onOpenChange={open => { if (!open) setExpandedSrc(null); }}>
    <DialogTrigger asChild>
    <button type="button" className={styles.imageButton} data-product-image={view} aria-label={t("landing.openFeatureImage", { name: title })} onClick={event => {
      const img = event.currentTarget.querySelector("img");
      if (img) setExpandedSrc(img.currentSrc);
    }}>
      <picture>
        <source media="(max-width: 720px)" srcSet={asset.mobile} width={asset.mobileWidth} height={asset.mobileHeight} />
        <img src={asset.desktop} alt={alt} width={asset.width} height={asset.height} fetchPriority={priority ? "high" : "auto"} loading={priority ? "eager" : "lazy"} decoding="async" />
      </picture>
      <span className={styles.enlargeLabel}><Maximize2 size={15} aria-hidden="true" /><span>{t("landing.enlargeImage")}</span></span>
    </button>
    </DialogTrigger>
      <DialogContent className={styles.imageDialog}>
        <div className={styles.imageDialogHeading}><DialogTitle>{title}</DialogTitle><DialogDescription>{t("landing.realScreensCaption")}</DialogDescription></div>
        {expandedSrc && <div className={styles.imageDialogBody}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Enlarge in the page; do not navigate to the file served with a generic content type. */}
          <img src={expandedSrc} alt={alt} className={styles.expandedScreenshot} />
        </div>}
      </DialogContent>
  </Dialog>;
}
