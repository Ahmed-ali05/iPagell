"use client";

import { AlertTriangle, Archive, BarChart3, GraduationCap, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatGrade, generalAverage, gradeTrend, subjectAverage } from "@/lib/calculations";
import type { Grade, SchoolData, Semester } from "@/types/domain";
import { EmptyMini, EmptyState } from "@/components/diary-empty-state";

export function StatsView({
  data,
  semester,
  grades,
  goal,
  onAddGrade,
}: {
  data: SchoolData;
  semester: Semester;
  grades: Grade[];
  goal: number;
  onAddGrade: () => void;
}) {
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
  const trendData = gradeTrend(data.subjects, grades);
  const average = generalAverage(data.subjects, grades);
  const strongest = [...subjectData].sort((a, b) => b.media - a.media)[0];
  const weakest = [...subjectData].sort((a, b) => a.media - b.media)[0];
  const oldSemesters = data.semesters.filter((item) => item.id !== semester.id);
  if (!grades.length) {
    return (
      <section className="module-view">
        <section className="panel">
          <EmptyState
            icon={GraduationCap}
            title="Nessun voto registrato"
            text="Registra il primo voto per vedere medie, confronti e andamento nel tempo."
            actionLabel="Registra il primo voto"
            onAction={onAddGrade}
          />
        </section>
      </section>
    );
  }
  return (
    <section className="module-view">
      <div className="stats-hero">
        <div>
          <span className="eyebrow">Panoramica {semester.name}</span>
          <h2>{formatGrade(average)}</h2>
          <p>Media generale ponderata</p>
        </div>
        <div>
          <BarChart3 />
          <p>Dati del semestre</p>
          <b>{grades.length} {grades.length === 1 ? "voto" : "voti"}</b>
          <small>{subjectData.length} {subjectData.length === 1 ? "materia con voti" : "materie con voti"}</small>
        </div>
      </div>
      <div className="stats-layout">
        <section className="panel chart-card wide">
          <div className="panel-title">
            <div>
              <span className="eyebrow">Confronto</span>
              <h3>Media per materia</h3>
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
            <span className="eyebrow">In evidenza</span>
            <div className="insight success">
              <TrendingUp />
              <small>Più forte</small>
              <b>{strongest?.fullName ?? "—"}</b>
              <strong>{strongest?.media.toFixed(1) ?? "—"}</strong>
            </div>
            <div className="insight warning">
              <AlertTriangle />
              <small>Da rinforzare</small>
              <b>{weakest?.fullName ?? "—"}</b>
              <strong>{weakest?.media.toFixed(1) ?? "—"}</strong>
            </div>
            <div className="goal-line">
              <span>Obiettivo semestre</span>
              <b>{goal.toFixed(1)}</b>
            </div>
          </section>
        ) : (
          <section className="panel insight-card">
            <span className="eyebrow">Confronto tra materie</span>
            <h3>Serve almeno un’altra materia con voti</h3>
            <p>Aggiungi altri risultati per confrontare punti forti e materie da rinforzare.</p>
            <div className="goal-line">
              <span>Obiettivo semestre</span>
              <b>{goal.toFixed(1)}</b>
            </div>
          </section>
        )}
        <section className="panel chart-card wide">
          <div className="panel-title">
            <div>
              <span className="eyebrow">Evoluzione</span>
              <h3>Andamento nel tempo</h3>
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
          <span className="eyebrow">Archivio</span>
          <h3>Confronta semestri</h3>
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
                <b>{formatGrade(oldAvg)}</b>
              </div>
            );
          })}
          {!oldSemesters.length && (
            <EmptyMini text="Nessun semestre archiviato." />
          )}
        </section>
      </div>
    </section>
  );
}
