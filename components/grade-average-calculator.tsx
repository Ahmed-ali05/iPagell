"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useI18n } from "@/components/i18n-provider";
import { calculatorAverage, parseCalculatorEntry, restoreCalculatorState, type CalculatorLists } from "@/lib/grade-average-calculator";
import { weightedArithmeticMean } from "@/lib/calculations";
import { CALCULATOR_GRADING_SYSTEMS, CURRENT_GRADING_SYSTEM, calculatorGradingSystem, formatNumericGrade, isPlainGradeText, parseNumericGrade, type CalculatorGradingSystemId } from "@/lib/grading";
import { formatNumber, selectPlural, type MessageKey } from "@/lib/i18n";
import { PublicHeader, PublicFooter } from "@/components/public-header";
import shell from "@/app/public-space.module.css";
import styles from "@/app/grade-average.module.css";

const STORAGE_KEY = "ipagell-public-average-v2";
const LEGACY_STORAGE_KEY = "ipagell-public-average-v1";

/** Copy and the worked example for each scale; keys stay literal for the i18n check. */
const SCALE_COPY: Record<CalculatorGradingSystemId, { option: MessageKey; detail: MessageKey; hint: MessageKey; placeholder: MessageKey; example: [number, number] }> = {
  "numeric-1-6": { option: "average.scale16.option", detail: "average.scale16.detail", hint: "average.scale16.hint", placeholder: "average.scale16.placeholder", example: [4.5, 5.5] },
  "numeric-1-10": { option: "average.scale110.option", detail: "average.scale110.detail", hint: "average.scale110.hint", placeholder: "average.scale110.placeholder", example: [6.5, 8] },
  "numeric-0-20": { option: "average.scale020.option", detail: "average.scale020.detail", hint: "average.scale020.hint", placeholder: "average.scale020.placeholder", example: [11, 14] },
  "numeric-1-6-lower-better": { option: "average.scale16inv.option", detail: "average.scale16inv.detail", hint: "average.scale16inv.hint", placeholder: "average.scale16inv.placeholder", example: [2.5, 1.5] },
  "percent-0-100": { option: "average.scalePercent.option", detail: "average.scalePercent.detail", hint: "average.scalePercent.hint", placeholder: "average.scalePercent.placeholder", example: [70, 85] },
};

export function GradeAverageCalculator() {
  const { t, locale } = useI18n();
  const [scale, setScale] = useState<CalculatorGradingSystemId>(CURRENT_GRADING_SYSTEM.id);
  const [lists, setLists] = useState<CalculatorLists>({});
  const [gradeInput, setGradeInput] = useState("");
  const [weightInput, setWeightInput] = useState("1");
  const [error, setError] = useState<"grade" | "weight" | null>(null);
  const gradeRef = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
    if (!active) return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) { const saved = restoreCalculatorState(JSON.parse(raw)); setScale(saved.scale); setLists(saved.lists); setGradeInput(saved.gradeInput); setWeightInput(saved.weightInput); }
    } catch { /* A blocked browser store leaves the calculator usable. */ }
    setHydrated(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (hydrated) { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ scale, lists, gradeInput, weightInput })); sessionStorage.removeItem(LEGACY_STORAGE_KEY); } catch { /* Calculation does not require storage. */ } }
  }, [scale, lists, gradeInput, weightInput, hydrated]);
  const system = calculatorGradingSystem(scale) ?? CURRENT_GRADING_SYSTEM;
  const copy = SCALE_COPY[scale];
  const grades = lists[scale] ?? [];
  const digits = system.formatting.displayFractionDigits;
  const gradeNumber = (value: number) => formatNumber(locale, value, { maximumFractionDigits: 2 });
  const countedPreview = (() => {
    if (!gradeInput.trim() || isPlainGradeText(gradeInput)) return null;
    try { return gradeNumber(parseNumericGrade(gradeInput, system)); } catch { return null; }
  })();
  const [firstExample, secondExample] = copy.example;
  const exampleResult = weightedArithmeticMean([{ value: firstExample, weight: 1 }, { value: secondExample, weight: 2 }]) ?? 0;
  const average = calculatorAverage(grades, system);
  const count = grades.length;
  const countLabel = t(selectPlural(locale, count, "average.countOne", "average.countOther"), { count });
  const displayedAverage = average === null ? "—" : formatNumber(locale, Number(formatNumericGrade(average, undefined, system)), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

  function changeScale(next: string) {
    const found = calculatorGradingSystem(next);
    if (!found) return;
    setScale(found.id);
    setError(null);
  }

  function addGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseCalculatorEntry(gradeInput, weightInput, system);
    if ("error" in parsed) {
      setError(parsed.error);
      (parsed.error === "grade" ? gradeRef : weightRef).current?.focus();
      return;
    }
    const row = { id: crypto.randomUUID(), ...parsed, entered: gradeInput.trim(), enteredWeight: weightInput.trim() || "1" };
    setLists((current) => ({ ...current, [scale]: [...(current[scale] ?? []), row] }));
    setGradeInput("");
    setWeightInput("1");
    setError(null);
    gradeRef.current?.focus();
  }

  return <div className={`${styles.page} ${shell.page}`}>
    <PublicHeader current="average" />
    <main className={styles.main}>
      <div className={styles.intro}>
        <p className={shell.eyebrow}>{t("public.noAccount")}</p>
        <h1>{t("average.title")}</h1>
        <p>{t("average.description")}</p>
      </div>
      <section className={styles.tool} aria-label={t("average.toolLabel")}>
        <form className={styles.form} onSubmit={addGrade} noValidate>
          <fieldset disabled={!hydrated} className={styles.inputGroup}>
          <div className={`${styles.field} ${styles.scaleField}`}>
            <label htmlFor="calculator-scale">{t("average.scaleLabel")}</label>
            <select id="calculator-scale" value={scale} aria-describedby="calculator-scale-detail" onChange={(event) => changeScale(event.target.value)}>
              {CALCULATOR_GRADING_SYSTEMS.map((option) => <option key={option.id} value={option.id}>{t(SCALE_COPY[option.id].option)}</option>)}
            </select>
            <small id="calculator-scale-detail">{t(copy.detail, { plus: gradeNumber(6.25), minus: gradeNumber(5.75), half: gradeNumber(6.5) })}</small>
          </div>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor="calculator-grade">{t("average.gradeLabel")}</label>
              <input ref={gradeRef} id="calculator-grade" type="text" inputMode="decimal" autoComplete="off" value={gradeInput} placeholder={t(copy.placeholder)} aria-invalid={error === "grade"} aria-describedby={error === "grade" ? "calculator-error" : "calculator-grade-hint"} onChange={(event) => { setGradeInput(event.target.value); if (error === "grade") setError(null); }} />
              <small id="calculator-grade-hint" aria-live="polite">{countedPreview === null ? t(copy.hint) : <span className={styles.counted}>{t("average.countsAs", { value: countedPreview })}</span>}</small>
            </div>
            <div className={styles.field}>
              <label htmlFor="calculator-weight">{t("average.weightLabel")}</label>
              <input ref={weightRef} id="calculator-weight" type="text" inputMode="decimal" autoComplete="off" value={weightInput} aria-invalid={error === "weight"} aria-describedby={error === "weight" ? "calculator-error" : "calculator-weight-hint"} onChange={(event) => { setWeightInput(event.target.value); if (error === "weight") setError(null); }} />
              <small id="calculator-weight-hint">{t("average.weightHint")}</small>
            </div>
          </div>
          {error && <p className={styles.error} id="calculator-error" role="alert">{t(error === "grade" ? "average.gradeError" : "average.weightError", { minimum: gradeNumber(system.values.minimum), maximum: gradeNumber(system.values.maximum) })}</p>}
          <button className={styles.addButton} type="submit">{t("average.add")}</button>
        </fieldset>
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
            <span className={styles.gradeValue}>{grade.entered}{!isPlainGradeText(grade.entered) && <span className={styles.gradeCounted}> = {gradeNumber(grade.value)}</span>}</span>
            <span className={styles.gradeWeight}>{t("average.listWeight", { weight: grade.enteredWeight })}</span>
            <button type="button" onClick={() => { setLists((current) => ({ ...current, [scale]: (current[scale] ?? []).filter((item) => item.id !== grade.id) })); gradeRef.current?.focus(); }} aria-label={t("average.removeNamed", { grade: grade.entered })}>{t("average.remove")}</button>
          </li>)}</ol>
        </div>}
      </section>
      <div className={styles.notes}>
        <section><h2>{t("average.formulaTitle")}</h2><p>{t("average.formulaText")}</p><p>{t("average.example", {
          firstGrade: gradeNumber(firstExample),
          secondGrade: gradeNumber(secondExample),
          result: formatNumber(locale, exampleResult, { minimumFractionDigits: digits, maximumFractionDigits: digits }),
        })} {t(digits === 1 ? "average.roundingOne" : "average.roundingTwo")}</p></section>
        <p>{t("average.schoolRules")}</p>
        <p>{t("average.privacy")}</p>
        <div className={styles.cta}><p>{t("average.ctaText")}{scale !== CURRENT_GRADING_SYSTEM.id && <> {t("average.diaryScaleNote")}</>}</p><a href={`/app?mode=register&uiLocale=${locale}`}>{t("average.ctaLink")}</a></div>
      </div>
    </main>
    <PublicFooter />
  </div>;
}
