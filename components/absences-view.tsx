"use client";

import { Plus, Trash2, UserRoundCheck } from "lucide-react";
import type { Absence, Subject } from "@/types/domain";
import { EmptyState } from "@/components/diary-empty-state";
import { useI18n } from "@/components/i18n-provider";
import { formatDate, formatNumber } from "@/lib/i18n";

export function AbsencesView({
  items,
  subjects,
  threshold,
  onThreshold,
  onAdd,
  onDelete,
}: {
  items: Absence[];
  subjects: Subject[];
  threshold: number;
  onThreshold: (value: number) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const total = items.reduce((sum, item) => sum + item.durationHours, 0);
  const unjustified = items
    .filter((item) => !item.justified)
    .reduce((sum, item) => sum + item.durationHours, 0);
  const percentage = Math.min(100, (total / threshold) * 100);
  const thresholdMessage =
    total > threshold
      ? t("absence.overThreshold", { value: formatNumber(locale, total - threshold, { maximumFractionDigits: 1 }) })
      : total === threshold
        ? t("absence.atThreshold")
        : percentage >= 80
          ? t("absence.nearThreshold", { value: formatNumber(locale, threshold - total, { maximumFractionDigits: 1 }) })
          : t("absence.totalProgress", { total: formatNumber(locale, total, { maximumFractionDigits: 1 }), threshold: formatNumber(locale, threshold) });
  const bySubject = subjects
    .map((subject) => ({
      subject,
      hours: items
        .filter((item) => item.subjectId === subject.id)
        .reduce((sum, item) => sum + item.durationHours, 0),
    }))
    .filter((item) => item.hours > 0)
    .sort((a, b) => b.hours - a.hours);
  return (
    <section className="module-view">
      <div className="module-toolbar">
        <p>{t("absence.intro")}</p>
        <button className="primary-button" onClick={onAdd}>
          <Plus size={18} /> {t("absence.add")}
        </button>
      </div>
      <div className="absence-stats">
        <div className="absence-stat">
          <small>{t("absence.totalHours")}</small>
          <b>{formatNumber(locale, total, { maximumFractionDigits: 1 })} <span>{t("common.hoursShort")}</span></b>
        </div>
        <div className="absence-stat">
          <small>{t("absence.unjustified")}</small>
          <b>{formatNumber(locale, unjustified, { maximumFractionDigits: 1 })} <span>{t("common.hoursShort")}</span></b>
        </div>
        <div className="absence-stat">
          <small>{t("absence.registered")}</small>
          <b>{items.length}</b>
        </div>
      </div>
      <section className={`absence-alert ${percentage >= 80 ? "warning" : ""}`}>
        <div
          className="circle-progress"
          style={
            { "--progress": `${percentage * 3.6}deg` } as React.CSSProperties
          }
        >
          <span>{Math.round(percentage)}%</span>
        </div>
        <div>
          <span className="section-label">{t("absence.personalThreshold")}</span>
          <h3>
            {formatNumber(locale, total, { maximumFractionDigits: 1 })} {t("common.of")} {formatNumber(locale, threshold)} {t("common.hours")}
          </h3>
          <p>{thresholdMessage} {t("absence.notOfficialLimit")}</p>
        </div>
        <label>
          {t("absence.referenceHours")}
          <input
            type="number"
            min="1"
            max="200"
            defaultValue={threshold}
            onBlur={(event) => {
              const value = Number(event.target.value);
              if (value >= 1 && value <= 200) onThreshold(value);
              else event.target.value = String(threshold);
            }}
          />
        </label>
      </section>
      <div className="absence-layout">
        <section className="panel absence-list">
          <div className="panel-title">
            <div>
              <h3>{t("absence.recent")}</h3>
            </div>
          </div>
          {items.length ? (
            [...items]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((item) => (
                <article key={item.id}>
                  <div className="date-block">
                    <b>{new Date(item.date).getDate()}</b>
                    <small>
                      {formatDate(locale, item.date, { month: "short" })}
                    </small>
                  </div>
                  <div>
                    <b>
                      {subjects.find((subject) => subject.id === item.subjectId)?.name ??
                        t("absence.unspecifiedSubject")}
                    </b>
                    <small>
                      {item.kind === "late"
                        ? t("absence.late")
                        : item.kind === "early-exit"
                          ? t("absence.earlyExit")
                          : item.justified
                            ? t("absence.justified")
                            : t("absence.unjustified")}
                      {item.note ? ` · ${item.note}` : ""}
                    </small>
                  </div>
                  <strong>{formatNumber(locale, item.durationHours, { maximumFractionDigits: 1 })} {t("common.hoursShort")}</strong>
                  <button
                    className="icon-button subtle"
                    onClick={() => onDelete(item.id)}
                    aria-label={t("absence.delete")}
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              ))
          ) : (
            <EmptyState
              icon={UserRoundCheck}
              title={t("absence.emptyTitle")}
              text={t("absence.emptyText")}
            />
          )}
        </section>
        <aside className="panel absence-subjects">
          <div className="panel-title">
            <div>
              <h3>{t("common.bySubject")}</h3>
            </div>
          </div>
          {bySubject.map(({ subject, hours }) => (
            <div key={subject.id}>
              <div>
                <span>
                  <i style={{ background: subject.color }} />
                  {subject.name}
                </span>
                <b>{formatNumber(locale, hours, { maximumFractionDigits: 1 })} {t("common.hoursShort")}</b>
              </div>
              <span className="mini-track">
                <i
                  style={{
                    background: subject.color,
                    width: `${(hours / Math.max(total, 1)) * 100}%`,
                  }}
                />
              </span>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}
