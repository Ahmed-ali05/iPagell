"use client";

import { Archive, GraduationCap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { generalAverage, gradeTrend, subjectAverage } from "@/lib/calculations";
import type { Grade, SchoolData, Semester } from "@/types/domain";
import { EmptyMini, EmptyState } from "@/components/diary-empty-state";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { formatDate, formatNumber, selectPlural } from "@/lib/i18n";

export function StatsView({
  data,
  semester,
  grades,
  goal,
  onAddGrade,
  onBackToGrades,
}: {
  data: SchoolData;
  semester: Semester;
  grades: Grade[];
  goal: number;
  onAddGrade: () => void;
  onBackToGrades: () => void;
}) {
  const { t, locale } = useI18n();
  const subjectData = data.subjects
    .map((subject) => ({
      name:
        subject.name.length > 10
          ? `${subject.name.slice(0, 9)}…`
          : subject.name,
      fullName: subject.name,
      media: Number((subjectAverage(subject, grades) ?? 0).toFixed(2)),
      fill: subject.color,
    }))
    .filter((item) => item.media > 0);
  const trendData = gradeTrend(data.subjects, grades).map((item) => ({ ...item, date: formatDate(locale, item.date, { day: "numeric", month: "short" }) }));
  const average = generalAverage(data.subjects, grades);
  const strongest = [...subjectData].sort((a, b) => b.media - a.media)[0];
  const weakest = [...subjectData].sort((a, b) => a.media - b.media)[0];
  const oldSemesters = data.semesters.filter((item) => item.id !== semester.id);
  if (!grades.length) {
    return (
      <section className="module-view">
        <div className="module-toolbar"><button className="soft-button" onClick={onBackToGrades}><ChevronLeft size={18} /> {t("stats.backToGrades")}</button></div>
        <section className="panel">
          <EmptyState
            icon={GraduationCap}
            title={t("stats.emptyTitle")}
            text={t("stats.emptyText")}
            actionLabel={t("stats.firstGrade")}
            onAction={onAddGrade}
          />
        </section>
      </section>
    );
  }
  return (
    <section className="module-view">
      <div className="module-toolbar"><button className="soft-button" onClick={onBackToGrades}><ChevronLeft size={18} /> {t("stats.backToGrades")}</button></div>
      <div className="stats-hero">
        <div>
          <span className="section-label">{semester.name}</span>
          <h2>{average === null ? "—" : formatNumber(locale, average, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</h2>
          <p>{t("stats.weightedAverage")}</p>
        </div>
        <div>
          <b>{formatNumber(locale, grades.length)} {t(selectPlural(locale, grades.length, "stats.gradeOne", "stats.gradeMany"))}</b>
          <small>{formatNumber(locale, subjectData.length)} {t(selectPlural(locale, subjectData.length, "stats.subjectOne", "stats.subjectMany"))}</small>
        </div>
      </div>
      <div className="stats-layout">
        <section className="panel chart-card wide">
          <div className="panel-title">
            <div>
              <h3>{t("stats.averageBySubject")}</h3>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={270}
              initialDimension={{ width: 640, height: 270 }}
            >
              <BarChart
                data={subjectData}
                margin={{ top: 10, right: 6, left: -22, bottom: 4 }}
              >
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--subtle)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[1, 6]}
                  ticks={[1, 2, 3, 4, 5, 6]}
                  tick={{ fill: "var(--subtle)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine y={4} stroke="#e45c67" strokeDasharray="5 5" />
                <Tooltip
                  cursor={{ fill: "var(--accent-soft)" }}
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid var(--line)",
                    background: "var(--surface)",
                    color: "var(--ink)",
                  }}
                />
                <Bar dataKey="media" radius={[8, 8, 3, 3]} fill="#6655e6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        {subjectData.length > 1 ? (
          <section className="panel insight-card">
            <h3>{t("stats.subjectsCompared")}</h3>
            <div className="insight success">
              <small>{t("stats.strongest")}</small>
              <b>{strongest?.fullName ?? "—"}</b>
              <strong>{strongest ? formatNumber(locale, strongest.media, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}</strong>
            </div>
            <div className="insight warning">
              <small>{t("stats.toImprove")}</small>
              <b>{weakest?.fullName ?? "—"}</b>
              <strong>{weakest ? formatNumber(locale, weakest.media, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}</strong>
            </div>
            <div className="goal-line">
              <span>{t("stats.semesterGoal")}</span>
              <b>{formatNumber(locale, goal, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</b>
            </div>
          </section>
        ) : (
          <section className="panel insight-card">
            <h3>{t("stats.needSubject")}</h3>
            <p>{t("stats.needSubjectHint")}</p>
            <div className="goal-line">
              <span>{t("stats.semesterGoal")}</span>
              <b>{formatNumber(locale, goal, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</b>
            </div>
          </section>
        )}
        <section className="panel chart-card wide">
          <div className="panel-title">
            <div>
              <h3>{t("stats.trend")}</h3>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={270}
              initialDimension={{ width: 640, height: 270 }}
            >
              <LineChart
                data={trendData}
                margin={{ top: 10, right: 15, left: -22, bottom: 4 }}
              >
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--subtle)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[1, 6]}
                  ticks={[1, 2, 3, 4, 5, 6]}
                  tick={{ fill: "var(--subtle)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine y={4} stroke="#e45c67" strokeDasharray="5 5" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid var(--line)",
                    background: "var(--surface)",
                    color: "var(--ink)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="media"
                  stroke="#6655e6"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#6655e6",
                    strokeWidth: 2,
                    stroke: "var(--surface)",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel semester-compare">
          <h3>{t("stats.compareSemesters")}</h3>
          {oldSemesters.map((item) => {
            const oldGrades = data.grades.filter(
              (grade) => grade.semesterId === item.id,
            );
            const oldAvg = generalAverage(data.subjects, oldGrades);
            return (
              <div key={item.id}>
                <span>
                  <Archive />
                  {item.name}
                  <small>{item.schoolYear}</small>
                </span>
                <b>{oldAvg === null ? "—" : formatNumber(locale, oldAvg, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</b>
              </div>
            );
          })}
          {!oldSemesters.length && (
            <EmptyMini text={t("stats.noArchivedSemesters")} />
          )}
        </section>
      </div>
    </section>
  );
}
