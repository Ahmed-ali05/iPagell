"use client";

import { useRef, useState, type FormEvent } from "react";
import { LanguageSelect, useI18n } from "@/components/i18n-provider";
import { calculatorAverage, parseCalculatorEntry, type CalculatorGrade } from "@/lib/grade-average-calculator";
import { CURRENT_GRADING_SYSTEM, formatNumericGrade } from "@/lib/grading";
import { formatNumber, selectPlural } from "@/lib/i18n";
import { publicLandingPaths } from "@/lib/i18n/public-routes";
import styles from "@/app/grade-average.module.css";

const system = CURRENT_GRADING_SYSTEM;

export function GradeAverageCalculator() {
  const { t, locale } = useI18n();
  const [grades, setGrades] = useState<(CalculatorGrade & { entered: string; enteredWeight: string })[]>([]);
  const [gradeInput, setGradeInput] = useState("");
  const [weightInput, setWeightInput] = useState("1");
  const [error, setError] = useState<"grade" | "weight" | null>(null);
  const gradeRef = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const average = calculatorAverage(grades, system);
  const count = grades.length;
  const countLabel = t(selectPlural(locale, count, "average.countOne", "average.countOther"), { count });
  const displayedAverage = average === null ? "—" : formatNumber(locale, Number(formatNumericGrade(average, undefined, system)), {
    minimumFractionDigits: system.formatting.displayFractionDigits,
    maximumFractionDigits: system.formatting.displayFractionDigits,
  });

  function addGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseCalculatorEntry(gradeInput, weightInput, system);
    if ("error" in parsed) {
      setError(parsed.error);
      (parsed.error === "grade" ? gradeRef : weightRef).current?.focus();
      return;
    }
    setGrades((current) => [...current, { id: crypto.randomUUID(), ...parsed, entered: gradeInput.trim(), enteredWeight: weightInput.trim() || "1" }]);
    setGradeInput("");
    setWeightInput("1");
    setError(null);
    gradeRef.current?.focus();
  }

  return <div className={styles.page}>
    <header className={styles.header}>
      <a className={styles.brand} href={publicLandingPaths[locale]} aria-label="iPagell"><span className={styles.logo}>iP</span><span>iPagell</span></a>
      <div className={styles.headerRight}>
        <LanguageSelect className="language-select" publicRoute averageRoute />
        <a className={styles.homeLink} href={publicLandingPaths[locale]}>{t("average.home")}</a>
      </div>
    </header>
    <main className={styles.main}>
      <div className={styles.intro}>
        <h1>{t("average.title")}</h1>
        <p>{t("average.description")}</p>
      </div>
      <section className={styles.tool} aria-label={t("average.toolLabel")}>
        <form className={styles.form} onSubmit={addGrade} noValidate>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor="calculator-grade">{t("average.gradeLabel")}</label>
              <input ref={gradeRef} id="calculator-grade" type="text" inputMode="decimal" autoComplete="off" value={gradeInput} placeholder={t("average.gradePlaceholder")} aria-invalid={error === "grade"} aria-describedby={error === "grade" ? "calculator-error" : "calculator-grade-hint"} onChange={(event) => { setGradeInput(event.target.value); if (error === "grade") setError(null); }} />
              <small id="calculator-grade-hint">{t("average.gradeHint", { minimum: system.values.minimum, maximum: system.values.maximum })}</small>
            </div>
            <div className={styles.field}>
              <label htmlFor="calculator-weight">{t("average.weightLabel")}</label>
              <input ref={weightRef} id="calculator-weight" type="text" inputMode="decimal" autoComplete="off" value={weightInput} aria-invalid={error === "weight"} aria-describedby={error === "weight" ? "calculator-error" : "calculator-weight-hint"} onChange={(event) => { setWeightInput(event.target.value); if (error === "weight") setError(null); }} />
              <small id="calculator-weight-hint">{t("average.weightHint")}</small>
            </div>
          </div>
          {error && <p className={styles.error} id="calculator-error" role="alert">{t(error === "grade" ? "average.gradeError" : "average.weightError", { minimum: system.values.minimum, maximum: system.values.maximum })}</p>}
          <button className={styles.addButton} type="submit">{t("average.add")}</button>
        </form>
        <div className={styles.result} aria-live="polite" aria-atomic="true">
          <span>{t("average.resultLabel")}</span>
          <strong>{displayedAverage}</strong>
          <span>{countLabel}</span>
        </div>
        {count === 0 ? <p className={styles.empty}>{t("average.empty")}</p> : <div className={styles.listWrap}>
          <h2>{t("average.listTitle")}</h2>
          <ol className={styles.list}>{grades.map((grade, index) => <li key={grade.id}>
            <span className={styles.gradeNumber}>{index + 1}</span>
            <span className={styles.gradeValue}>{grade.entered}</span>
            <span className={styles.gradeWeight}>{t("average.listWeight", { weight: grade.enteredWeight })}</span>
            <button type="button" onClick={() => { setGrades((current) => current.filter((item) => item.id !== grade.id)); gradeRef.current?.focus(); }} aria-label={t("average.removeNamed", { grade: grade.entered })}>{t("average.remove")}</button>
          </li>)}</ol>
        </div>}
      </section>
      <div className={styles.notes}>
        <section><h2>{t("average.formulaTitle")}</h2><p>{t("average.formulaText")}</p></section>
        <p>{t("average.privacy")}</p>
        <div className={styles.cta}><p>{t("average.ctaText")}</p><a href={`/app?mode=register&uiLocale=${locale}`}>{t("average.ctaLink")}</a></div>
      </div>
    </main>
    <footer className={styles.footer}>{t("landing.footer")}</footer>
  </div>;
}
