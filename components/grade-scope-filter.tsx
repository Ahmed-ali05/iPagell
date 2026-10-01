"use client";

import { useI18n } from "@/components/i18n-provider";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { GradeScope } from "@/lib/grade-scope";
import type { Semester } from "@/types/domain";

export function GradeScopeFilter({ scope, semesters, currentSemesterId, onChange }: {
  scope: GradeScope;
  semesters: Semester[];
  currentSemesterId: string;
  onChange: (scope: GradeScope) => void;
}) {
  const { t } = useI18n();
  const current = semesters.find((period) => period.id === currentSemesterId) ?? semesters[0];
  const years = [...new Set(semesters.map((period) => period.schoolYear))];
  return <div className="grade-scope-filter">
    <label>
      {t("scope.view")}
      <NativeSelect aria-label={t("scope.view")} value={scope.kind} onChange={(event) => {
        if (event.target.value === "all") onChange({ kind: "all" });
        else if (event.target.value === "period") {
          const period = scope.kind === "year"
            ? (current.schoolYear === scope.schoolYear ? current : semesters.find((item) => item.schoolYear === scope.schoolYear))
            : current;
          onChange({ kind: "period", semesterId: (period ?? current).id });
        } else {
          const period = scope.kind === "period" ? semesters.find((item) => item.id === scope.semesterId) : current;
          onChange({ kind: "year", schoolYear: (period ?? current).schoolYear });
        }
      }}>
        <NativeSelectOption value="period">{t("scope.period")}</NativeSelectOption>
        <NativeSelectOption value="year">{t("scope.year")}</NativeSelectOption>
        <NativeSelectOption value="all">{t("scope.all")}</NativeSelectOption>
      </NativeSelect>
    </label>
    {scope.kind === "period" && <label>
      {t("scope.period")}
      <NativeSelect aria-label={t("scope.period")} value={scope.semesterId} onChange={(event) => onChange({ kind: "period", semesterId: event.target.value })}>
        {semesters.map((period) => <NativeSelectOption key={period.id} value={period.id}>{period.name} · {period.schoolYear}{period.archived ? ` · ${t("scope.archived")}` : ""}</NativeSelectOption>)}
      </NativeSelect>
    </label>}
    {scope.kind === "year" && <label>
      {t("scope.year")}
      <NativeSelect aria-label={t("scope.year")} value={scope.schoolYear} onChange={(event) => onChange({ kind: "year", schoolYear: event.target.value })}>
        {years.map((year) => <NativeSelectOption key={year} value={year}>{year}</NativeSelectOption>)}
      </NativeSelect>
    </label>}
    {years.length > 1 && <p className="scope-note">{t("scope.exactYears")}</p>}
  </div>;
}
