"use client";

import { useState, type FormEvent } from "react";
import { LanguageSelect, useI18n } from "@/components/i18n-provider";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { parseGrade } from "@/lib/validation";
import type { MessageKey } from "@/lib/i18n";
import type {
  Absence,
  AgendaItem,
  Grade,
  SchoolData,
  Semester,
  Subject,
} from "@/types/domain";

export type ModalType =
  "grade" | "agenda" | "absence" | "subject" | "semester" | null;
const uid = () => crypto.randomUUID();
const today = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

type Props = {
  type: ModalType;
  onClose: () => void;
  data: SchoolData;
  semesterId: string;
  editingSubject: Subject | null;
  editingSemester: Semester | null;
  onRefresh?: () => Promise<void>;
  onSave: (
    recipe: (data: SchoolData) => SchoolData,
    message: string,
  ) => Promise<void>;
};

export function EntryDialog(props: Props) {
  return (
    <Dialog
      open={!!props.type}
      onOpenChange={(open) => !open && props.onClose()}
    >
      <DialogContent className="entry-dialog">
        {props.type && (
          <EntryForm
            key={`${props.type}-${props.editingSubject?.id ?? props.editingSemester?.id ?? "new"}`}
            {...props}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EntryForm({
  type,
  onClose,
  data,
  semesterId,
  editingSubject,
  editingSemester,
  onSave,
  onRefresh,
}: Props) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(data.subjects[0]?.id ?? "");
  const [types, setTypes] = useState(
    editingSubject?.gradeTypes ?? [
      { id: uid(), name: t("entry.written"), weight: 1 },
      { id: uid(), name: t("entry.oral"), weight: 1 },
    ],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const subject = data.subjects.find((s) => s.id === selected);
  const usedType = (id: string) =>
    data.grades.some(
      (g) => g.subjectId === editingSubject?.id && g.typeId === id,
    ) ||
    data.agenda.some(
      (a) => a.subjectId === editingSubject?.id && a.typeId === id,
    );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const f = new FormData(event.currentTarget);
    const str = (name: string) => String(f.get(name) ?? "").trim();
    const num = (name: string) => Number(f.get(name));
    try {
      if (type === "grade") {
        let value: number;
        try { value = parseGrade(str("value")); }
        catch { setError("error.grade"); return; }
        const grade: Grade = {
          id: uid(),
          subjectId: str("subjectId"),
          semesterId,
          typeId: str("typeId"),
          value,
          weight: num("weight"),
          date: str("date"),
          note: str("note"),
        };
        await onSave(
          (d) => ({ ...d, grades: [grade, ...d.grades] }),
          t("entry.saveDevice"),
        );
      } else if (type === "agenda") {
        const item: AgendaItem = {
          id: uid(),
          subjectId: str("subjectId"),
          semesterId,
          kind: str("kind") as AgendaItem["kind"],
          title: str("title"),
          description: str("description"),
          dueAt: new Date(str("dueAt")).toISOString(),
          reminder: f.get("reminder") === "on",
          completed: false,
          typeId: str("typeId"),
          weight: num("weight"),
        };
        await onSave(
          (d) => ({ ...d, agenda: [item, ...d.agenda] }),
          t("entry.agendaSaved"),
        );
      } else if (type === "absence") {
        const absenceType = str("absenceType");
        const justified = str("justified") === "yes";
        const kind = (
          absenceType === "absence"
            ? justified
              ? "justified"
              : "unjustified"
            : absenceType
        ) as Absence["kind"];
        const item: Absence = {
          id: uid(),
          semesterId,
          date: str("date"),
          subjectId: str("subjectId") || undefined,
          kind,
          durationHours: num("durationHours"),
          justified,
          note: str("note"),
        };
        await onSave(
          (d) => ({ ...d, absences: [item, ...d.absences] }),
          t("entry.absenceSaved"),
        );
      } else if (type === "subject") {
        const item: Subject = {
          id: editingSubject?.id ?? uid(),
          name: str("name"),
          color: str("color"),
          teacher: str("teacher"),
          coefficient: num("coefficient"),
          gradeTypes: types,
        };
        await onSave(
          (d) => ({
            ...d,
            subjects: editingSubject
              ? d.subjects.map((s) => (s.id === item.id ? item : s))
              : [...d.subjects, item],
          }),
          t("entry.subjectSaved"),
        );
      } else if (type === "semester") {
        const item: Semester = {
          id: editingSemester?.id ?? uid(),
          name: str("name"),
          schoolYear: str("schoolYear"),
          startDate: str("startDate"),
          endDate: str("endDate"),
          archived: editingSemester?.archived,
        };
        if (item.endDate < item.startDate) {
          setError("entry.invalidSemesterDates");
          return;
        }
        await onSave(
          (d) => ({
            ...d,
            semesters: editingSemester
              ? d.semesters.map((s) => (s.id === item.id ? item : s))
              : [item, ...d.semesters],
          }),
          t("entry.semesterSaved"),
        );
      }
    } catch {
      setError("entry.saveFailed");
    } finally {
      setBusy(false);
    }
  }
  const titles = {
    grade: t("entry.gradeTitle"),
    agenda: t("entry.newActivity"),
    absence: t("absence.add"),
    subject: editingSubject ? t("entry.editSubjectTitle") : t("entry.subjectTitle"),
    semester: editingSemester ? t("entry.editSemester") : t("entry.newSemester"),
  };
  const submitLabels = {
    grade: t("grades.add"),
    agenda: t("entry.addActivity"),
    absence: t("absence.add"),
    subject: editingSubject ? t("entry.saveChanges") : t("entry.addSubject"),
    semester: editingSemester ? t("entry.saveChanges") : t("entry.addSemester"),
  };
  const needsSubject = type === "grade" || type === "agenda";
  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>{titles[type!]}</DialogTitle>
        <DialogDescription>
          {t("entry.description")}
        </DialogDescription>
        <LanguageSelect className="language-select" />
      </DialogHeader>
      <fieldset disabled={busy} className="form-grid">
        {(needsSubject || type === "absence") && (
          <label className="full">
            {t("common.subject")}
            <NativeSelect
              name="subjectId"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              required={needsSubject}
            >
              <NativeSelectOption value="">
                {needsSubject
                  ? t("entry.selectSubject")
                  : t("entry.noSubjectOptional")}
              </NativeSelectOption>
              {data.subjects.map((s) => (
                <NativeSelectOption key={s.id} value={s.id}>
                  {s.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        )}
        {needsSubject && !data.subjects.length && (
          <p className="full form-error">
            {t("entry.noSubject")}
          </p>
        )}
        {type === "grade" && (
          <>
            <label>
              {t("common.grade")}
              <input
                name="value"
                inputMode="decimal"
                placeholder={t("entry.gradePlaceholder")}
                maxLength={12}
                required
              />
            </label>
            <label>
              {t("common.date")}
              <input name="date" type="date" defaultValue={today()} required />
            </label>
            <label>
              {t("entry.type")}
              <NativeSelect key={selected} name="typeId" required>
                {subject?.gradeTypes.map((t) => (
                  <NativeSelectOption key={t.id} value={t.id}>
                    {t.name} · {t.weight}×
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <label>
              {t("entry.weight")}
              <input
                name="weight"
                type="number"
                min=".1"
                max="100"
                step=".1"
                defaultValue="1"
                required
              />
            </label>
            <label className="full">
              {t("common.note")}
              <input name="note" maxLength={4000} placeholder={t("entry.noteOptional")} />
            </label>
          </>
        )}
        {type === "agenda" && (
          <>
            <label>
              {t("entry.kind")}
              <NativeSelect name="kind">
                <NativeSelectOption value="task">{t("entry.task")}</NativeSelectOption>
                <NativeSelectOption value="test">{t("entry.test")}</NativeSelectOption>
              </NativeSelect>
            </label>
            <label>
              {t("entry.dueDate")}
              <input
                name="dueAt"
                type="datetime-local"
                defaultValue={`${today()}T16:00`}
                required
              />
            </label>
            <label className="full">
              {t("entry.title")}
              <input name="title" maxLength={200} required />
            </label>
            <label className="full">
              {t("entry.details")}
              <textarea name="description" maxLength={4000} />
            </label>
            <label>
              {t("entry.assessmentType")}
              <NativeSelect name="typeId" key={selected}>
                <NativeSelectOption value="">
                  {t("entry.unspecified")}
                </NativeSelectOption>
                {subject?.gradeTypes.map((t) => (
                  <NativeSelectOption key={t.id} value={t.id}>
                    {t.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <label>
              {t("entry.expectedWeight")}
              <input
                name="weight"
                type="number"
                min=".1"
                max="100"
                step=".1"
                defaultValue="1"
                required
              />
            </label>
            <label className="switch-row full">
              <input type="checkbox" name="reminder" />
              {t("entry.reminderWhileOpen")}
            </label>
            <small className="full">
              {t("entry.reminderHint")}
            </small>
          </>
        )}
        {type === "absence" && (
          <>
            <label>
              {t("entry.date")}
              <input name="date" type="date" defaultValue={today()} required />
            </label>
            <label>
              {t("entry.absenceType")}
              <NativeSelect name="absenceType">
                <NativeSelectOption value="absence">{t("entry.absence")}</NativeSelectOption>
                <NativeSelectOption value="late">
                  {t("entry.lateArrival")}
                </NativeSelectOption>
                <NativeSelectOption value="early-exit">
                  {t("absence.earlyExit")}
                </NativeSelectOption>
              </NativeSelect>
            </label>
            <label>
              {t("entry.justification")}
              <NativeSelect name="justified" defaultValue="no">
                <NativeSelectOption value="no">{t("entry.notExcused")}</NativeSelectOption>
                <NativeSelectOption value="yes">{t("entry.excused")}</NativeSelectOption>
              </NativeSelect>
            </label>
            <label>
              {t("entry.durationHours")}
              <input
                name="durationHours"
                type="number"
                min=".1"
                max="24"
                step=".1"
                defaultValue="1"
                required
              />
            </label>
            <label>
              {t("entry.note")}
              <input name="note" maxLength={4000} />
            </label>
          </>
        )}
        {type === "subject" && (
          <>
            <label className="full">
              {t("entry.subjectName")}
              <input
                name="name"
                maxLength={120}
                defaultValue={editingSubject?.name}
                required
              />
            </label>
            <label>
              {t("entry.subjectColor")}
              <input
                name="color"
                className="color-input"
                type="color"
                defaultValue={editingSubject?.color ?? "#6655e6"}
              />
            </label>
            <label>
              {t("entry.subjectCoefficient")}
              <input
                name="coefficient"
                type="number"
                min=".1"
                max="100"
                step=".1"
                defaultValue={editingSubject?.coefficient ?? 1}
                required
              />
            </label>
            <label className="full">
              {t("entry.teacher")}
              <input
                name="teacher"
                defaultValue={editingSubject?.teacher}
                maxLength={120}
              />
            </label>
            <div className="full type-editor">
              <h3>{t("entry.typeWeights")}</h3>
              <p>{t("entry.typeWeightsInfo")}</p>
              {types.map((gradeType, index) => (
                <div className="type-row" key={gradeType.id}>
                  <label>
                    {t("entry.nameNumber", { number: index + 1 })}
                    <input
                      value={gradeType.name}
                      maxLength={120}
                      required
                      onChange={(e) =>
                        setTypes(
                          types.map((x) =>
                            x.id === gradeType.id ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    {t("entry.weightShort")}
                    <input
                      type="number"
                      min=".1"
                      max="100"
                      step=".1"
                      required
                      value={gradeType.weight || ""}
                      onChange={(e) =>
                        setTypes(
                          types.map((x) =>
                            x.id === gradeType.id
                              ? { ...x, weight: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="icon-button danger"
                    disabled={types.length === 1 || usedType(gradeType.id)}
                    title={
                      usedType(gradeType.id)
                        ? t("entry.subjectNoDelete")
                        : undefined
                    }
                    aria-label={t("entry.deleteType", { name: gradeType.name })}
                    onClick={() => setTypes(types.filter((x) => x.id !== gradeType.id))}
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="soft-button"
                disabled={types.length >= 30}
                onClick={() =>
                  setTypes([...types, { id: uid(), name: "", weight: 1 }])
                }
              >
                <Plus />
                {t("entry.addType")}
              </button>
            </div>
          </>
        )}
        {type === "semester" && (
          <>
            <label className="full">
              {t("entry.name")}
              <input
                name="name"
                maxLength={120}
                defaultValue={editingSemester?.name}
                required
              />
            </label>
            <label>
              {t("entry.schoolYear")}
              <input
                name="schoolYear"
                maxLength={120}
                defaultValue={editingSemester?.schoolYear}
                placeholder="2026/27"
                required
              />
            </label>
            <label>
              {t("entry.startDate")}
              <input
                name="startDate"
                type="date"
                defaultValue={editingSemester?.startDate ?? today()}
                required
              />
            </label>
            <label>
              {t("entry.endDate")}
              <input
                name="endDate"
                type="date"
                defaultValue={editingSemester?.endDate}
                required
              />
            </label>
          </>
        )}
      </fieldset>
      {error && (
        <p className="form-error" role="alert">
          {t(error)}
        </p>
      )}
      {onRefresh && (
        <button type="button" className="soft-button" disabled={busy}
          onClick={async () => {
            setBusy(true);
            try { await onRefresh(); setError(null); }
            catch { setError("entry.refreshFailed"); }
            finally { setBusy(false); }
          }}>
          {t("entry.refresh")}
        </button>
      )}
      <DialogFooter>
        <button
          type="button"
          className="soft-button"
          disabled={busy}
          onClick={onClose}
        >
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          className="primary-button"
          disabled={busy || (needsSubject && !data.subjects.length)}
        >
          {busy ? t("entry.saving") : submitLabels[type!]}
        </button>
      </DialogFooter>
    </form>
  );
}
