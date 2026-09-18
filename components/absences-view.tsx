"use client";

import { AlertTriangle, CalendarDays, Clock3, Plus, Trash2, UserRoundCheck } from "lucide-react";
import type { Absence, Subject } from "@/types/domain";
import { EmptyState } from "@/components/diary-empty-state";

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
  const total = items.reduce((sum, item) => sum + item.durationHours, 0);
  const unjustified = items
    .filter((item) => !item.justified)
    .reduce((sum, item) => sum + item.durationHours, 0);
  const percentage = Math.min(100, (total / threshold) * 100);
  const thresholdMessage =
    total > threshold
      ? `Hai superato la soglia personale di ${(total - threshold).toFixed(1)} ore.`
      : total === threshold
        ? "Hai raggiunto la soglia personale."
        : percentage >= 80
          ? `Mancano ${(threshold - total).toFixed(1)} ore alla soglia personale.`
          : `Hai registrato ${total.toFixed(1)} ore su ${threshold}.`;
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
        <p>Monitora ore, ritardi e giustificazioni.</p>
        <button className="primary-button" onClick={onAdd}>
          <Plus size={18} /> Registra assenza
        </button>
      </div>
      <div className="absence-stats">
        <div className="metric-card">
          <span>
            <Clock3 />
          </span>
          <small>Ore totali</small>
          <b>{total.toFixed(1)}</b>
        </div>
        <div className="metric-card">
          <span>
            <AlertTriangle />
          </span>
          <small>Non giustificate</small>
          <b>{unjustified.toFixed(1)}</b>
        </div>
        <div className="metric-card">
          <span>
            <CalendarDays />
          </span>
          <small>Assenze registrate</small>
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
          <span className="eyebrow">Soglia personale di riferimento</span>
          <h3>
            {total.toFixed(1)} di {threshold} ore
          </h3>
          <p>{thresholdMessage} Non è il limite ufficiale della scuola.</p>
        </div>
        <label>
          Ore di riferimento
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
              <span className="eyebrow">Registro</span>
              <h3>Assenze recenti</h3>
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
                      {new Intl.DateTimeFormat("it-CH", {
                        month: "short",
                      }).format(new Date(item.date))}
                    </small>
                  </div>
                  <div>
                    <b>
                      {subjects.find((subject) => subject.id === item.subjectId)?.name ??
                        "Più lezioni / materia non indicata"}
                    </b>
                    <small>
                      {item.kind === "late"
                        ? "Ritardo"
                        : item.kind === "early-exit"
                          ? "Uscita anticipata"
                          : item.justified
                            ? "Giustificata"
                            : "Non giustificata"}
                      {item.note ? ` · ${item.note}` : ""}
                    </small>
                  </div>
                  <strong>{item.durationHours.toFixed(1)} h</strong>
                  <button
                    className="icon-button subtle"
                    onClick={() => onDelete(item.id)}
                    aria-label="Elimina assenza"
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              ))
          ) : (
            <EmptyState
              icon={UserRoundCheck}
              title="Nessuna assenza registrata"
              text="Quando aggiungi un’assenza, qui trovi ore e giustificazione."
            />
          )}
        </section>
        <aside className="panel absence-subjects">
          <div className="panel-title">
            <div>
              <span className="eyebrow">Distribuzione</span>
              <h3>Per materia</h3>
            </div>
          </div>
          {bySubject.map(({ subject, hours }) => (
            <div key={subject.id}>
              <div>
                <span>
                  <i style={{ background: subject.color }} />
                  {subject.name}
                </span>
                <b>{hours.toFixed(1)} h</b>
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
