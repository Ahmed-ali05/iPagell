"use client";

import { useState, type FormEvent } from "react";
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
}: Props) {
  const [selected, setSelected] = useState(data.subjects[0]?.id ?? "");
  const [types, setTypes] = useState(
    editingSubject?.gradeTypes ?? [
      { id: uid(), name: "Scritto", weight: 1 },
      { id: uid(), name: "Orale", weight: 1 },
    ],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
    setError("");
    const f = new FormData(event.currentTarget);
    const str = (name: string) => String(f.get(name) ?? "").trim();
    const num = (name: string) => Number(f.get(name));
    try {
      if (type === "grade") {
        const grade: Grade = {
          id: uid(),
          subjectId: str("subjectId"),
          semesterId,
          typeId: str("typeId"),
          value: parseGrade(str("value")),
          weight: num("weight"),
          date: str("date"),
          note: str("note"),
        };
        await onSave(
          (d) => ({ ...d, grades: [grade, ...d.grades] }),
          "Voto salvato sul dispositivo",
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
          "Attività salvata sul dispositivo",
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
          "Assenza salvata sul dispositivo",
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
          "Materia salvata sul dispositivo",
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
        if (item.endDate < item.startDate)
          throw new Error("La data finale deve seguire quella iniziale.");
        await onSave(
          (d) => ({
            ...d,
            semesters: editingSemester
              ? d.semesters.map((s) => (s.id === item.id ? item : s))
              : [item, ...d.semesters],
          }),
          "Semestre salvato sul dispositivo",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Salvataggio non riuscito");
    } finally {
      setBusy(false);
    }
  }
  const titles = {
    grade: "Registra un voto",
    agenda: "Nuova attività",
    absence: "Registra assenza",
    subject: editingSubject ? "Modifica materia" : "Nuova materia",
    semester: editingSemester ? "Modifica semestre" : "Nuovo semestre",
  };
  const submitLabels = {
    grade: "Registra voto",
    agenda: "Aggiungi attività",
    absence: "Registra assenza",
    subject: editingSubject ? "Salva modifiche" : "Aggiungi materia",
    semester: editingSemester ? "Salva modifiche" : "Aggiungi semestre",
  };
  const needsSubject = type === "grade" || type === "agenda";
  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>{titles[type!]}</DialogTitle>
        <DialogDescription>
          Compila i campi. I dati vengono salvati prima sul dispositivo, poi
          nell’account.
        </DialogDescription>
      </DialogHeader>
      <fieldset disabled={busy} className="form-grid">
        {(needsSubject || type === "absence") && (
          <label className="full">
            Materia
            <NativeSelect
              name="subjectId"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              required={needsSubject}
            >
              <NativeSelectOption value="">
                {needsSubject
                  ? "Scegli materia"
                  : "Nessuna materia / più lezioni"}
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
            Aggiungi prima una materia dalle impostazioni.
          </p>
        )}
        {type === "grade" && (
          <>
            <label>
              Voto
              <input
                name="value"
                inputMode="decimal"
                placeholder="4.5 oppure 4-5"
                maxLength={12}
                required
              />
            </label>
            <label>
              Data
              <input name="date" type="date" defaultValue={today()} required />
            </label>
            <label>
              Tipo di prova
              <NativeSelect key={selected} name="typeId" required>
                {subject?.gradeTypes.map((t) => (
                  <NativeSelectOption key={t.id} value={t.id}>
                    {t.name} · {t.weight}×
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <label>
              Peso del voto
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
              Nota
              <input name="note" maxLength={4000} placeholder="Facoltativa" />
            </label>
          </>
        )}
        {type === "agenda" && (
          <>
            <label>
              Tipo
              <NativeSelect name="kind">
                <NativeSelectOption value="task">Compito</NativeSelectOption>
                <NativeSelectOption value="test">Verifica</NativeSelectOption>
              </NativeSelect>
            </label>
            <label>
              Scadenza
              <input
                name="dueAt"
                type="datetime-local"
                defaultValue={`${today()}T16:00`}
                required
              />
            </label>
            <label className="full">
              Titolo
              <input name="title" maxLength={200} required />
            </label>
            <label className="full">
              Dettagli
              <textarea name="description" maxLength={4000} />
            </label>
            <label>
              Tipo di prova
              <NativeSelect name="typeId" key={selected}>
                <NativeSelectOption value="">
                  Non specificata
                </NativeSelectOption>
                {subject?.gradeTypes.map((t) => (
                  <NativeSelectOption key={t.id} value={t.id}>
                    {t.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <label>
              Peso previsto
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
              Avviso mentre l’app è aperta
            </label>
            <small className="full">
              Non è una notifica programmata ad app chiusa. Richiede il consenso
              nelle impostazioni dell’agenda.
            </small>
          </>
        )}
        {type === "absence" && (
          <>
            <label>
              Data
              <input name="date" type="date" defaultValue={today()} required />
            </label>
            <label>
              Tipo di assenza
              <NativeSelect name="absenceType">
                <NativeSelectOption value="absence">Assenza</NativeSelectOption>
                <NativeSelectOption value="late">
                  Ritardo / entrata posticipata
                </NativeSelectOption>
                <NativeSelectOption value="early-exit">
                  Uscita anticipata
                </NativeSelectOption>
              </NativeSelect>
            </label>
            <label>
              Giustificazione
              <NativeSelect name="justified" defaultValue="no">
                <NativeSelectOption value="no">Non giustificata</NativeSelectOption>
                <NativeSelectOption value="yes">Giustificata</NativeSelectOption>
              </NativeSelect>
            </label>
            <label>
              Durata in ore
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
              Nota
              <input name="note" maxLength={4000} />
            </label>
          </>
        )}
        {type === "subject" && (
          <>
            <label className="full">
              Nome
              <input
                name="name"
                maxLength={120}
                defaultValue={editingSubject?.name}
                required
              />
            </label>
            <label>
              Colore
              <input
                name="color"
                className="color-input"
                type="color"
                defaultValue={editingSubject?.color ?? "#6655e6"}
              />
            </label>
            <label>
              Peso della materia nella media generale
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
              Docente
              <input
                name="teacher"
                defaultValue={editingSubject?.teacher}
                maxLength={120}
              />
            </label>
            <div className="full type-editor">
              <h3>Tipi di prova e pesi</h3>
              <p>
                Ogni voto pesa: peso del voto × peso del tipo di prova. Non
                vengono fatte medie separate tra gruppi. Modificare i pesi
                ricalcola anche i semestri passati.
              </p>
              {types.map((t, index) => (
                <div className="type-row" key={t.id}>
                  <label>
                    Nome {index + 1}
                    <input
                      value={t.name}
                      maxLength={120}
                      required
                      onChange={(e) =>
                        setTypes(
                          types.map((x) =>
                            x.id === t.id ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Peso
                    <input
                      type="number"
                      min=".1"
                      max="100"
                      step=".1"
                      required
                      value={t.weight || ""}
                      onChange={(e) =>
                        setTypes(
                          types.map((x) =>
                            x.id === t.id
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
                    disabled={types.length === 1 || usedType(t.id)}
                    title={
                      usedType(t.id)
                        ? "Usata da voti o attività: non eliminabile"
                        : undefined
                    }
                    aria-label={`Elimina tipo di prova ${t.name}`}
                    onClick={() => setTypes(types.filter((x) => x.id !== t.id))}
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
                Aggiungi tipo di prova
              </button>
            </div>
          </>
        )}
        {type === "semester" && (
          <>
            <label className="full">
              Nome
              <input
                name="name"
                maxLength={120}
                defaultValue={editingSemester?.name}
                required
              />
            </label>
            <label>
              Anno scolastico
              <input
                name="schoolYear"
                maxLength={120}
                defaultValue={editingSemester?.schoolYear}
                placeholder="2026/27"
                required
              />
            </label>
            <label>
              Data inizio
              <input
                name="startDate"
                type="date"
                defaultValue={editingSemester?.startDate ?? today()}
                required
              />
            </label>
            <label>
              Data fine
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
          {error}
        </p>
      )}
      <DialogFooter>
        <button
          type="button"
          className="soft-button"
          disabled={busy}
          onClick={onClose}
        >
          Annulla
        </button>
        <button
          type="submit"
          className="primary-button"
          disabled={busy || (needsSubject && !data.subjects.length)}
        >
          {busy ? "Salvataggio…" : submitLabels[type!]}
        </button>
      </DialogFooter>
    </form>
  );
}
