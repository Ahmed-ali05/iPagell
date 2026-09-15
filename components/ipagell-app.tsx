"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Archive, ArrowDownToLine, ArrowUpFromLine, BarChart3, Bell,
  BookOpen, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleGauge,
  Clock3, Download, FileJson, GraduationCap, Home, Layers3, ListFilter, Moon, MoreHorizontal,
  Pencil, Plus, Settings2, Sparkles, Sun, Trash2, TrendingUp, Upload, UserRoundCheck, X,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatGrade, generalAverage, neededGrade, subjectAverage } from "@/lib/calculations";
import { createBackup, isValidBackup, loadPreferences, loadSchoolData, savePreferences, saveSchoolData } from "@/lib/storage";
import type { Absence, AgendaItem, BackupPayload, Grade, Preferences, SchoolData, Semester, Subject } from "@/types/domain";

type TabId = "home" | "agenda" | "grades" | "absences" | "stats";
type ModalType = "grade" | "agenda" | "absence" | "subject" | "semester" | null;

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

const nav = [
  { id: "home", label: "Home", icon: Home },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "grades", label: "Voti", icon: GraduationCap },
  { id: "absences", label: "Assenze", icon: UserRoundCheck },
  { id: "stats", label: "Statistiche", icon: BarChart3 },
] as const;

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const todayInput = () => {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const formatDate = (date: string, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("it-CH", options ?? { weekday: "short", day: "numeric", month: "short" }).format(new Date(date));
const formatLongDate = (date: Date) => new Intl.DateTimeFormat("it-CH", { weekday: "long", day: "numeric", month: "long" }).format(date);
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function findSubject(subjects: Subject[], id?: string) {
  return subjects.find((subject) => subject.id === id);
}

function getCountdown(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(diff / 86_400_000));
  if (days === 0) return { value: "Oggi", small: "" };
  if (days === 1) return { value: "1", small: "giorno" };
  return { value: String(days), small: "giorni" };
}

export function IPagellApp() {
  const [data, setData] = useState<SchoolData | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [modal, setModal] = useState<ModalType>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);
  const [deleteSemesterId, setDeleteSemesterId] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([loadSchoolData(), Promise.resolve(loadPreferences())]).then(([schoolData, prefs]) => {
      setData(schoolData);
      setPreferences(prefs);
      const query = new URLSearchParams(window.location.search);
      if (query.get("view") === "agenda") setActiveTab("agenda");
      if (query.get("action") === "grade") { setActiveTab("grades"); setModal("grade"); }
    }).catch(() => toast.error("Non è stato possibile aprire l’archivio locale."));
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!data || !preferences || !("Notification" in window) || Notification.permission !== "granted" || !("serviceWorker" in navigator)) return;
    const now = Date.now();
    const dueSoon = data.agenda.filter((item) => item.semesterId === preferences.currentSemesterId && item.reminder && !item.completed && new Date(item.dueAt).getTime() > now && new Date(item.dueAt).getTime() - now < 12 * 60 * 60 * 1000);
    dueSoon.forEach((item) => {
      const key = `ipagell-notified-${item.id}`;
      if (localStorage.getItem(key)) return;
      navigator.serviceWorker.ready.then((registration) => registration.showNotification(item.title, { body: `Scade ${formatDate(item.dueAt, { hour: "2-digit", minute: "2-digit" })}`, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", tag: item.id })).then(() => localStorage.setItem(key, "1")).catch(() => undefined);
    });
  }, [data, preferences]);

  useEffect(() => {
    if (!preferences) return;
    savePreferences(preferences);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.dataset.theme = preferences.theme === "system" ? (media.matches ? "dark" : "light") : preferences.theme;
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preferences]);

  const updateData = (recipe: (current: SchoolData) => SchoolData) => {
    setData((current) => {
      if (!current) return current;
      const next = { ...recipe(current), updatedAt: new Date().toISOString() };
      void saveSchoolData(next).catch(() => toast.error("Salvataggio locale non riuscito."));
      return next;
    });
  };

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool || !data || !preferences) return;
    const lifecycle = new AbortController();
    const register = (tool: Record<string, unknown>) => {
      try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); } catch { /* Browser senza WebMCP completo. */ }
    };
    register({
      name: "read_school_summary", title: "Leggi riepilogo scolastico",
      description: "Restituisce media generale, attività aperte e ore di assenza del semestre selezionato.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => {
        const semesterGrades = data.grades.filter((grade) => grade.semesterId === preferences.currentSemesterId);
        return { average: generalAverage(data.subjects, semesterGrades), openActivities: data.agenda.filter((item) => item.semesterId === preferences.currentSemesterId && !item.completed).length, absenceHours: data.absences.filter((item) => item.semesterId === preferences.currentSemesterId).reduce((sum, item) => sum + item.durationHours, 0) };
      },
    });
    register({
      name: "create_grade", title: "Registra voto",
      description: "Registra un nuovo voto in iPagell usando gli stessi dati del modulo Voti.",
      inputSchema: { type: "object", properties: { subjectId: { type: "string" }, value: { type: "number", minimum: 1, maximum: 6 }, date: { type: "string" }, note: { type: "string" } }, required: ["subjectId", "value", "date"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input: unknown) => {
        const value = input as { subjectId: string; value: number; date: string; note?: string };
        const subject = data.subjects.find((item) => item.id === value.subjectId);
        if (!subject || value.value < 1 || value.value > 6 || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) throw new Error("Dati del voto non validi");
        const grade: Grade = { id: uid("grade"), subjectId: subject.id, semesterId: preferences.currentSemesterId, typeId: subject.gradeTypes[0]?.id ?? "default", value: value.value, weight: 1, date: value.date, note: value.note };
        updateData((current) => ({ ...current, grades: [grade, ...current.grades] }));
        return { id: grade.id, status: "saved" };
      },
    });
    return () => lifecycle.abort();
  }, [data, preferences]);

  if (!data || !preferences) return <LoadingScreen />;

  const currentSemester = data.semesters.find((semester) => semester.id === preferences.currentSemesterId) ?? data.semesters[0];
  const semesterGrades = data.grades.filter((grade) => grade.semesterId === currentSemester.id);
  const semesterAgenda = data.agenda.filter((item) => item.semesterId === currentSemester.id);
  const semesterAbsences = data.absences.filter((absence) => absence.semesterId === currentSemester.id);
  const average = generalAverage(data.subjects, semesterGrades);
  const toggleTheme = () => setPreferences({ ...preferences, theme: document.documentElement.dataset.theme === "dark" ? "light" : "dark" });
  const isDark = typeof document !== "undefined" && document.documentElement.dataset.theme === "dark";
  const openSubjectEditor = (subject?: Subject) => { setEditingSubject(subject ?? null); setModal("subject"); };
  const openSemesterEditor = (semester?: Semester) => { setEditingSemester(semester ?? null); setModal("semester"); };

  const savePreference = (patch: Partial<Preferences>) => setPreferences({ ...preferences, ...patch });
  const removeSubject = (id: string) => {
    updateData((current) => ({ ...current, subjects: current.subjects.filter((subject) => subject.id !== id), grades: current.grades.filter((grade) => grade.subjectId !== id), agenda: current.agenda.filter((item) => item.subjectId !== id), absences: current.absences.filter((item) => item.subjectId !== id) }));
    setDeleteSubjectId(null);
    toast.success("Materia eliminata");
  };
  const removeSemester = (id: string) => {
    const remaining = data.semesters.filter((semester) => semester.id !== id);
    if (!remaining.length) return toast.error("Deve rimanere almeno un semestre.");
    updateData((current) => ({ ...current, semesters: current.semesters.filter((semester) => semester.id !== id), grades: current.grades.filter((grade) => grade.semesterId !== id), agenda: current.agenda.filter((item) => item.semesterId !== id), absences: current.absences.filter((item) => item.semesterId !== id) }));
    if (preferences.currentSemesterId === id) savePreference({ currentSemesterId: remaining[0].id });
    setDeleteSemesterId(null);
    toast.success("Semestre eliminato");
  };

  const exportBackup = () => {
    const backup = createBackup(data, preferences);
    const href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = `ipagell-backup-${todayInput()}.json`;
    link.click();
    URL.revokeObjectURL(href);
    toast.success("Backup esportato");
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isValidBackup(parsed)) throw new Error("invalid");
      const backup = parsed as BackupPayload;
      await saveSchoolData(backup.data);
      savePreferences(backup.preferences);
      setData(backup.data);
      setPreferences(backup.preferences);
      toast.success("Backup importato");
    } catch { toast.error("Il file non è un backup iPagell valido."); }
    if (importRef.current) importRef.current.value = "";
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) return toast.error("Le notifiche non sono supportate su questo dispositivo.");
    const result = await Notification.requestPermission();
    if (result === "granted") toast.success("Promemoria attivati");
    else toast.info("Puoi riattivarli dalle impostazioni di Safari.");
  };

  return (
    <main className="app-shell">
      <aside className="desktop-nav">
        <button className="brand-mark" onClick={() => setActiveTab("home")} aria-label="Vai alla Home"><span>iP</span></button>
        <nav aria-label="Navigazione principale">{nav.map(({ id, label, icon: Icon }) => <button className={activeTab === id ? "nav-item active" : "nav-item"} key={id} onClick={() => setActiveTab(id)}><Icon size={20} strokeWidth={2.1} /><span>{label}</span></button>)}</nav>
        <button className="settings-nav" onClick={() => setSettingsOpen(true)}><Settings2 size={19} /> Impostazioni</button>
        <div className="profile-chip"><span>{preferences.studentName.slice(0, 2).toUpperCase()}</span><div><b>{preferences.studentName}</b><small>{currentSemester.name}</small></div></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p>{titleCase(formatLongDate(new Date()))}</p><h1>{activeTab === "home" ? `Buongiorno, ${preferences.studentName}` : nav.find((item) => item.id === activeTab)?.label}</h1></div>
          <div className="top-actions">
            <NativeSelect aria-label="Semestre corrente" value={currentSemester.id} onChange={(event) => savePreference({ currentSemesterId: event.target.value })} className="semester-select">{data.semesters.map((semester) => <NativeSelectOption key={semester.id} value={semester.id}>{semester.name}</NativeSelectOption>)}</NativeSelect>
            <button aria-label="Cambia tema" onClick={toggleTheme}>{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button aria-label="Impostazioni" onClick={() => setSettingsOpen(true)}><Settings2 size={20} /></button>
          </div>
        </header>

        <div className="view-stage" key={activeTab}>
          {activeTab === "home" && <Dashboard data={data} grades={semesterGrades} agenda={semesterAgenda} absences={semesterAbsences} average={average} goal={preferences.gradeGoal} onNavigate={setActiveTab} onAdd={setModal} onManageSubjects={() => setSettingsOpen(true)} />}
          {activeTab === "agenda" && <AgendaView items={semesterAgenda} subjects={data.subjects} onAdd={() => setModal("agenda")} onToggle={(id) => updateData((current) => ({ ...current, agenda: current.agenda.map((item) => item.id === id ? { ...item, completed: !item.completed } : item) }))} onDelete={(id) => updateData((current) => ({ ...current, agenda: current.agenda.filter((item) => item.id !== id) }))} onNotifications={requestNotifications} />}
          {activeTab === "grades" && <GradesView subjects={data.subjects} grades={semesterGrades} goal={preferences.gradeGoal} onGoal={(gradeGoal) => savePreference({ gradeGoal })} onAdd={() => setModal("grade")} onDelete={(id) => updateData((current) => ({ ...current, grades: current.grades.filter((grade) => grade.id !== id) }))} />}
          {activeTab === "absences" && <AbsencesView items={semesterAbsences} subjects={data.subjects} threshold={preferences.absenceThresholdHours} onThreshold={(absenceThresholdHours) => savePreference({ absenceThresholdHours })} onAdd={() => setModal("absence")} onDelete={(id) => updateData((current) => ({ ...current, absences: current.absences.filter((item) => item.id !== id) }))} />}
          {activeTab === "stats" && <StatsView data={data} semester={currentSemester} grades={semesterGrades} goal={preferences.gradeGoal} />}
        </div>
      </section>

      <button className="mobile-avatar" onClick={() => setSettingsOpen(true)} aria-label="Apri impostazioni"><span>{preferences.studentName.slice(0, 2).toUpperCase()}</span></button>
      <nav className="mobile-tabs" aria-label="Navigazione principale">{nav.map(({ id, label, icon: Icon }) => <button className={activeTab === id ? "active" : ""} key={id} onClick={() => setActiveTab(id)}><Icon size={21} /><span>{label}</span></button>)}</nav>

      <EntryDialog type={modal} onClose={() => { setModal(null); setEditingSubject(null); setEditingSemester(null); }} data={data} semesterId={currentSemester.id} editingSubject={editingSubject} editingSemester={editingSemester} onSave={(next, message) => { updateData(next); setModal(null); setEditingSubject(null); setEditingSemester(null); toast.success(message); }} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} data={data} preferences={preferences} onPreferences={savePreference} onAddSubject={() => { setSettingsOpen(false); openSubjectEditor(); }} onEditSubject={(subject) => { setSettingsOpen(false); openSubjectEditor(subject); }} onDeleteSubject={setDeleteSubjectId} onAddSemester={() => { setSettingsOpen(false); openSemesterEditor(); }} onEditSemester={(semester) => { setSettingsOpen(false); openSemesterEditor(semester); }} onDeleteSemester={setDeleteSemesterId} onArchiveSemester={(id) => updateData((current) => ({ ...current, semesters: current.semesters.map((semester) => semester.id === id ? { ...semester, archived: !semester.archived } : semester) }))} onExport={exportBackup} onImport={() => importRef.current?.click()} />
      <input ref={importRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importBackup(event.target.files?.[0])} />
      <AlertDialog open={!!deleteSubjectId} onOpenChange={(open) => !open && setDeleteSubjectId(null)}><AlertDialogContent className="confirm-dialog"><AlertDialogHeader><AlertDialogTitle>Eliminare la materia?</AlertDialogTitle><AlertDialogDescription>Verranno eliminati anche voti, attività e assenze collegati. Questa azione non può essere annullata.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annulla</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => deleteSubjectId && removeSubject(deleteSubjectId)}>Elimina</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={!!deleteSemesterId} onOpenChange={(open) => !open && setDeleteSemesterId(null)}><AlertDialogContent className="confirm-dialog"><AlertDialogHeader><AlertDialogTitle>Eliminare il semestre?</AlertDialogTitle><AlertDialogDescription>Verranno eliminati tutti i voti, le attività e le assenze del periodo. Questa azione non può essere annullata.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annulla</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => deleteSemesterId && removeSemester(deleteSemesterId)}>Elimina</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <Toaster position="top-center" richColors />
    </main>
  );
}

function LoadingScreen() {
  return <main className="loading-screen"><div className="brand-mark"><span>iP</span></div><p>Preparo il tuo diario…</p></main>;
}

function Dashboard({ data, grades, agenda, absences, average, goal, onNavigate, onAdd, onManageSubjects }: { data: SchoolData; grades: Grade[]; agenda: AgendaItem[]; absences: Absence[]; average: number | null; goal: number; onNavigate: (tab: TabId) => void; onAdd: (type: ModalType) => void; onManageSubjects: () => void }) {
  const upcoming = agenda.filter((item) => !item.completed && new Date(item.dueAt).getTime() >= Date.now() - 86_400_000).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const nextTest = upcoming.find((item) => item.kind === "test") ?? upcoming[0];
  const countdown = nextTest ? getCountdown(nextTest.dueAt) : null;
  const subject = findSubject(data.subjects, nextTest?.subjectId);
  const totalAbsences = absences.reduce((sum, item) => sum + item.durationHours, 0);
  const alerts = data.subjects.map((item) => ({ subject: item, average: subjectAverage(item, grades) })).filter((item) => item.average !== null && item.average < 4);
  return <div className="dashboard-grid">
    <section className="hero-card">
      <div className="hero-top"><span className="eyebrow">{nextTest?.kind === "test" ? "Prossima verifica" : "Prossima consegna"}</span>{nextTest && <span className="date-pill">{countdown?.value === "Oggi" ? "Oggi" : `Tra ${countdown?.value} ${countdown?.small}`}</span>}</div>
      {nextTest ? <><div className="subject-kicker"><span style={{ background: subject?.color }} /> {subject?.name ?? "Materia"}</div><h2>{nextTest.title}</h2><p>{titleCase(formatDate(nextTest.dueAt, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }))}</p><button onClick={() => onNavigate("agenda")}><BookOpen size={18} /> Apri l’agenda</button>{countdown && <div className="hero-orb">{countdown.value}<small>{countdown.small}</small></div>}</> : <div className="empty-hero"><CheckCircle2 /><h2>Nessuna scadenza</h2><p>Hai completato tutto ciò che è in agenda.</p><button onClick={() => onAdd("agenda")}><Plus size={18} /> Aggiungi attività</button></div>}
    </section>
    <section className="average-card"><div className="card-heading"><div><span className="eyebrow">Media generale</span><h3>{formatGrade(average)}</h3></div><span className={`status-badge ${average !== null && average < 4 ? "danger" : "success"}`}>{average !== null && average >= goal ? "Obiettivo" : average !== null && average >= 4 ? "In corsa" : "Attenzione"}</span></div><div className="average-track"><span style={{ width: `${average ? Math.max(4, ((average - 1) / 5) * 100) : 0}%` }} /></div><div className="scale"><span>1.0</span><span>Obiettivo {goal.toFixed(1)}</span><span>6.0</span></div><p>{average === null ? "Aggiungi il primo voto per iniziare." : average >= goal ? "Stai centrando l’obiettivo del semestre. Continua così." : `Ti mancano ${(goal - average).toFixed(1)} punti per raggiungere il tuo obiettivo.`}</p></section>
    <section className="panel today-panel"><div className="panel-title"><div><span className="eyebrow">In agenda</span><h3>{upcoming.length} attività aperte</h3></div><button aria-label="Aggiungi attività" onClick={() => onAdd("agenda")}><Plus size={20} /></button></div>{upcoming.slice(0, 3).map((item) => { const itemSubject = findSubject(data.subjects, item.subjectId); return <button className="activity-row" key={item.id} onClick={() => onNavigate("agenda")}><span className="subject-dot" style={{ background: itemSubject?.color }} /><div><b>{item.title}</b><small>{itemSubject?.name} · {formatDate(item.dueAt)}</small></div><ChevronRight size={18} /></button>; })}{!upcoming.length && <EmptyMini text="Tutto completato. Bel lavoro!" />}</section>
    <section className="panel subjects-panel"><div className="panel-title"><div><span className="eyebrow">Materie</span><h3>Il tuo andamento</h3></div><button onClick={onManageSubjects}>Gestisci</button></div>{data.subjects.slice(0, 5).map((item) => { const value = subjectAverage(item, grades); return <button className="subject-row" key={item.id} onClick={() => onNavigate("grades")}><span className="subject-dot" style={{ background: item.color }} /><div><b>{item.name}</b><span className="mini-track"><i style={{ width: `${value ? Math.max(5, ((value - 1) / 5) * 100) : 0}%`, background: item.color }} /></span></div><strong className={value !== null && value < 4 ? "low-grade" : ""}>{formatGrade(value)}</strong></button>; })}</section>
    <section className="dashboard-strip"><button onClick={() => onNavigate("absences")}><span><Clock3 size={19} /></span><div><small>Assenze</small><b>{totalAbsences.toFixed(1)} ore</b></div></button><button onClick={() => onNavigate("stats")}><span><TrendingUp size={19} /></span><div><small>Voti registrati</small><b>{grades.length}</b></div></button><button className={alerts.length ? "alert-tile" : ""} onClick={() => onNavigate("grades")}><span><AlertTriangle size={19} /></span><div><small>Da controllare</small><b>{alerts.length ? `${alerts.length} materie` : "Tutto bene"}</b></div></button></section>
  </div>;
}

function AgendaView({ items, subjects, onAdd, onToggle, onDelete, onNotifications }: { items: AgendaItem[]; subjects: Subject[]; onAdd: () => void; onToggle: (id: string) => void; onDelete: (id: string) => void; onNotifications: () => void }) {
  const [month, setMonth] = useState(new Date(2026, 8, 1));
  const sorted = [...items].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const firstOffset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const grid = Array.from({ length: firstOffset + days }, (_, index) => index < firstOffset ? null : index - firstOffset + 1);
  return <section className="module-view"><div className="module-toolbar"><div><p>Compiti e verifiche, in un solo posto.</p></div><div><button className="soft-button" onClick={onNotifications}><Bell size={18} /> Promemoria</button><button className="primary-button" onClick={onAdd}><Plus size={18} /> Nuova attività</button></div></div>
    <Tabs defaultValue="calendar" className="agenda-tabs"><TabsList className="segmented"><TabsTrigger value="calendar"><CalendarDays /> Calendario</TabsTrigger><TabsTrigger value="list"><ListFilter /> Elenco</TabsTrigger></TabsList>
      <TabsContent value="calendar"><div className="agenda-layout"><section className="panel calendar-card"><div className="calendar-head"><button aria-label="Mese precedente" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button><h2>{titleCase(new Intl.DateTimeFormat("it-CH", { month: "long", year: "numeric" }).format(month))}</h2><button aria-label="Mese successivo" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button></div><div className="weekdays">{["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{grid.map((day, index) => { const events = day ? items.filter((item) => { const date = new Date(item.dueAt); return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth() && date.getDate() === day; }) : []; const isToday = day === new Date().getDate() && month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear(); return <div className={`calendar-day ${isToday ? "today" : ""}`} key={`${day}-${index}`}>{day && <span>{day}</span>}<div>{events.slice(0, 3).map((event) => <i key={event.id} style={{ background: findSubject(subjects, event.subjectId)?.color }} title={event.title} />)}</div></div>; })}</div></section><AgendaList items={sorted.filter((item) => !item.completed).slice(0, 6)} subjects={subjects} onToggle={onToggle} onDelete={onDelete} compact /></div></TabsContent>
      <TabsContent value="list"><AgendaList items={sorted} subjects={subjects} onToggle={onToggle} onDelete={onDelete} /></TabsContent>
    </Tabs>
  </section>;
}

function AgendaList({ items, subjects, onToggle, onDelete, compact = false }: { items: AgendaItem[]; subjects: Subject[]; onToggle: (id: string) => void; onDelete: (id: string) => void; compact?: boolean }) {
  return <section className={`panel agenda-list ${compact ? "compact" : ""}`}><div className="panel-title"><div><span className="eyebrow">Scadenze</span><h3>{compact ? "Prossime attività" : `${items.length} attività`}</h3></div></div>{items.length ? items.map((item) => { const subject = findSubject(subjects, item.subjectId); return <article className={item.completed ? "completed" : ""} key={item.id}><button className="round-check" aria-label={item.completed ? "Segna come da fare" : "Segna come completata"} onClick={() => onToggle(item.id)}>{item.completed && <Check size={15} />}</button><div className="date-block"><b>{new Date(item.dueAt).getDate()}</b><small>{new Intl.DateTimeFormat("it-CH", { month: "short" }).format(new Date(item.dueAt))}</small></div><div className="agenda-copy"><div><span className="subject-dot" style={{ background: subject?.color }} />{subject?.name}</div><h4>{item.title}</h4><small>{item.kind === "test" ? "Verifica" : "Compito"} · {new Intl.DateTimeFormat("it-CH", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.dueAt))}{item.reminder ? " · Promemoria attivo" : ""}</small></div><button className="icon-button subtle" aria-label="Elimina" onClick={() => onDelete(item.id)}><Trash2 size={17} /></button></article>; }) : <EmptyState icon={CalendarDays} title="Agenda vuota" text="Aggiungi un compito o una verifica per iniziare." />}</section>;
}

function GradesView({ subjects, grades, goal, onGoal, onAdd, onDelete }: { subjects: Subject[]; grades: Grade[]; goal: number; onGoal: (value: number) => void; onAdd: () => void; onDelete: (id: string) => void }) {
  const [selectedId, setSelectedId] = useState(subjects[0]?.id ?? "");
  const subject = subjects.find((item) => item.id === selectedId) ?? subjects[0];
  const subjectGrades = grades.filter((grade) => grade.subjectId === subject?.id).sort((a, b) => b.date.localeCompare(a.date));
  const average = subject ? subjectAverage(subject, grades) : null;
  const needed = subject ? neededGrade(subject, grades, goal) : null;
  return <section className="module-view"><div className="module-toolbar"><p>Scala ticinese 1–6 · sufficienza a 4.0</p><button className="primary-button" onClick={onAdd}><Plus size={18} /> Registra voto</button></div>
    <div className="grade-overview">{subjects.map((item) => { const value = subjectAverage(item, grades); return <button className={item.id === subject?.id ? "selected" : ""} key={item.id} onClick={() => setSelectedId(item.id)}><span style={{ background: item.color }}><BookOpen size={18} /></span><small>{item.name}</small><b className={value !== null && value < 4 ? "low-grade" : ""}>{formatGrade(value)}</b><i style={{ background: item.color, width: `${value ? ((value - 1) / 5) * 100 : 0}%` }} /></button>; })}</div>
    {subject ? <div className="grades-layout"><section className="panel grades-register"><div className="panel-title"><div><span className="eyebrow">{subject.name}</span><h3>Registro voti</h3></div><div className="big-average" style={{ color: subject.color }}>{formatGrade(average)}</div></div>{subjectGrades.length ? subjectGrades.map((grade) => <article key={grade.id}><div className={`grade-pill ${grade.value < 4 ? "low" : ""}`}>{grade.value.toFixed(1)}</div><div><b>{grade.note || subject.gradeTypes.find((type) => type.id === grade.typeId)?.name || "Voto"}</b><small>{formatDate(grade.date)} · peso {grade.weight.toFixed(1)}×</small></div><span>{subject.gradeTypes.find((type) => type.id === grade.typeId)?.name}</span><button className="icon-button subtle" onClick={() => onDelete(grade.id)} aria-label="Elimina voto"><Trash2 size={17} /></button></article>) : <EmptyState icon={GraduationCap} title="Nessun voto" text="Registra il primo voto per questa materia." />}</section>
      <aside className="panel simulator-card"><span className="eyebrow">Simulatore</span><h3>Che voto mi serve?</h3><p>Imposta la media che vuoi raggiungere con la prossima valutazione.</p><label>Obiettivo <b>{goal.toFixed(1)}</b><input type="range" min="4" max="6" step=".1" value={goal} onChange={(event) => onGoal(Number(event.target.value))} /></label><div className={`needed-grade ${needed !== null && needed > 6 ? "impossible" : ""}`}><small>Voto necessario</small><strong>{needed === null ? "—" : needed <= 1 ? "Già raggiunto" : needed > 6 ? "> 6.0" : needed.toFixed(1)}</strong></div><small className="sim-note">Il calcolo usa i pesi dei voti e delle tipologie configurati per {subject.name}.</small></aside></div> : <EmptyState icon={BookOpen} title="Nessuna materia" text="Aggiungi una materia dalle impostazioni." />}
  </section>;
}

function AbsencesView({ items, subjects, threshold, onThreshold, onAdd, onDelete }: { items: Absence[]; subjects: Subject[]; threshold: number; onThreshold: (value: number) => void; onAdd: () => void; onDelete: (id: string) => void }) {
  const total = items.reduce((sum, item) => sum + item.durationHours, 0);
  const unjustified = items.filter((item) => !item.justified).reduce((sum, item) => sum + item.durationHours, 0);
  const percentage = Math.min(100, (total / threshold) * 100);
  const bySubject = subjects.map((subject) => ({ subject, hours: items.filter((item) => item.subjectId === subject.id).reduce((sum, item) => sum + item.durationHours, 0) })).filter((item) => item.hours > 0).sort((a, b) => b.hours - a.hours);
  return <section className="module-view"><div className="module-toolbar"><p>Monitora ore, ritardi e giustificazioni.</p><button className="primary-button" onClick={onAdd}><Plus size={18} /> Registra assenza</button></div>
    <div className="absence-stats"><div className="metric-card"><span><Clock3 /></span><small>Ore totali</small><b>{total.toFixed(1)}</b></div><div className="metric-card"><span><AlertTriangle /></span><small>Non giustificate</small><b>{unjustified.toFixed(1)}</b></div><div className="metric-card"><span><CalendarDays /></span><small>Eventi</small><b>{items.length}</b></div></div>
    <section className={`absence-alert ${percentage >= 80 ? "warning" : ""}`}><div className="circle-progress" style={{ "--progress": `${percentage * 3.6}deg` } as React.CSSProperties}><span>{Math.round(percentage)}%</span></div><div><span className="eyebrow">Soglia personale</span><h3>{total.toFixed(1)} di {threshold} ore</h3><p>{percentage >= 80 ? "Sei vicino alla soglia: controlla le prossime assenze." : `Hai ancora ${(threshold - total).toFixed(1)} ore prima dell’avviso.`}</p></div><label>Soglia<input type="number" min="1" max="200" value={threshold} onChange={(event) => onThreshold(Number(event.target.value) || 1)} /></label></section>
    <div className="absence-layout"><section className="panel absence-list"><div className="panel-title"><div><span className="eyebrow">Registro</span><h3>Assenze recenti</h3></div></div>{items.length ? [...items].sort((a, b) => b.date.localeCompare(a.date)).map((item) => <article key={item.id}><div className="date-block"><b>{new Date(item.date).getDate()}</b><small>{new Intl.DateTimeFormat("it-CH", { month: "short" }).format(new Date(item.date))}</small></div><div><b>{findSubject(subjects, item.subjectId)?.name ?? "Intera giornata"}</b><small>{item.kind === "late" ? "Ritardo" : item.kind === "early-exit" ? "Uscita anticipata" : item.justified ? "Giustificata" : "Non giustificata"}{item.note ? ` · ${item.note}` : ""}</small></div><strong>{item.durationHours.toFixed(1)} h</strong><button className="icon-button subtle" onClick={() => onDelete(item.id)} aria-label="Elimina assenza"><Trash2 size={17} /></button></article>) : <EmptyState icon={UserRoundCheck} title="Nessuna assenza" text="Ottimo: il registro del semestre è vuoto." />}</section><aside className="panel absence-subjects"><div className="panel-title"><div><span className="eyebrow">Distribuzione</span><h3>Per materia</h3></div></div>{bySubject.map(({ subject, hours }) => <div key={subject.id}><div><span><i style={{ background: subject.color }} />{subject.name}</span><b>{hours.toFixed(1)} h</b></div><span className="mini-track"><i style={{ background: subject.color, width: `${(hours / Math.max(total, 1)) * 100}%` }} /></span></div>)}</aside></div>
  </section>;
}

function StatsView({ data, semester, grades, goal }: { data: SchoolData; semester: Semester; grades: Grade[]; goal: number }) {
  const subjectData = data.subjects.map((subject) => ({ name: subject.name.length > 10 ? `${subject.name.slice(0, 9)}…` : subject.name, fullName: subject.name, media: Number((subjectAverage(subject, grades) ?? 0).toFixed(2)), fill: subject.color })).filter((item) => item.media > 0);
  const trendData = [...grades].sort((a, b) => a.date.localeCompare(b.date)).map((grade, index, list) => ({ date: new Intl.DateTimeFormat("it-CH", { day: "numeric", month: "short" }).format(new Date(grade.date)), media: Number((generalAverage(data.subjects, list.slice(0, index + 1)) ?? 0).toFixed(2)) }));
  const average = generalAverage(data.subjects, grades);
  const strongest = [...subjectData].sort((a, b) => b.media - a.media)[0];
  const weakest = [...subjectData].sort((a, b) => a.media - b.media)[0];
  const oldSemesters = data.semesters.filter((item) => item.id !== semester.id);
  return <section className="module-view"><div className="stats-hero"><div><span className="eyebrow">Panoramica {semester.name}</span><h2>{formatGrade(average)}</h2><p>Media generale ponderata</p></div><div><Sparkles /><p>Proiezione fine semestre</p><b>{formatGrade(average === null ? null : Math.min(6, average + .12))}</b><small>se mantieni il trend attuale</small></div></div>
    <div className="stats-layout"><section className="panel chart-card wide"><div className="panel-title"><div><span className="eyebrow">Confronto</span><h3>Media per materia</h3></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={subjectData} margin={{ top: 10, right: 6, left: -22, bottom: 4 }}><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="name" tick={{ fill: "var(--subtle)", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis domain={[1, 6]} ticks={[1,2,3,4,5,6]} tick={{ fill: "var(--subtle)", fontSize: 11 }} axisLine={false} tickLine={false} /><ReferenceLine y={4} stroke="#e45c67" strokeDasharray="5 5" /><Tooltip cursor={{ fill: "var(--accent-soft)" }} contentStyle={{ borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }} /><Bar dataKey="media" radius={[8,8,3,3]} fill="#6655e6" /></BarChart></ResponsiveContainer></div></section>
      <section className="panel insight-card"><span className="eyebrow">In evidenza</span><div className="insight success"><TrendingUp /><small>Più forte</small><b>{strongest?.fullName ?? "—"}</b><strong>{strongest?.media.toFixed(1) ?? "—"}</strong></div><div className="insight warning"><AlertTriangle /><small>Da rinforzare</small><b>{weakest?.fullName ?? "—"}</b><strong>{weakest?.media.toFixed(1) ?? "—"}</strong></div><div className="goal-line"><span>Obiettivo semestre</span><b>{goal.toFixed(1)}</b></div></section>
      <section className="panel chart-card wide"><div className="panel-title"><div><span className="eyebrow">Evoluzione</span><h3>Andamento nel tempo</h3></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData} margin={{ top: 10, right: 15, left: -22, bottom: 4 }}><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="date" tick={{ fill: "var(--subtle)", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis domain={[3, 6]} ticks={[3,4,5,6]} tick={{ fill: "var(--subtle)", fontSize: 11 }} axisLine={false} tickLine={false} /><ReferenceLine y={4} stroke="#e45c67" strokeDasharray="5 5" /><Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }} /><Line type="monotone" dataKey="media" stroke="#6655e6" strokeWidth={3} dot={{ r: 4, fill: "#6655e6", strokeWidth: 2, stroke: "var(--surface)" }} /></LineChart></ResponsiveContainer></div></section>
      <section className="panel semester-compare"><span className="eyebrow">Archivio</span><h3>Confronta semestri</h3>{oldSemesters.map((item) => { const oldGrades = data.grades.filter((grade) => grade.semesterId === item.id); const oldAvg = generalAverage(data.subjects, oldGrades); return <div key={item.id}><span><Archive />{item.name}<small>{item.schoolYear}</small></span><b>{formatGrade(oldAvg)}</b></div>; })}{!oldSemesters.length && <EmptyMini text="Nessun semestre archiviato." />}</section>
    </div>
  </section>;
}

function EntryDialog({ type, onClose, data, semesterId, editingSubject, editingSemester, onSave }: { type: ModalType; onClose: () => void; data: SchoolData; semesterId: string; editingSubject: Subject | null; editingSemester: Semester | null; onSave: (recipe: (data: SchoolData) => SchoolData, message: string) => void }) {
  const firstSubject = data.subjects[0];
  const [selectedSubject, setSelectedSubject] = useState(firstSubject?.id ?? "");
  useEffect(() => { if (type) setSelectedSubject(firstSubject?.id ?? ""); }, [type, firstSubject?.id]);
  const subject = findSubject(data.subjects, selectedSubject);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (type === "grade") {
      const grade: Grade = { id: uid("grade"), subjectId: String(form.get("subjectId")), semesterId, typeId: String(form.get("typeId")), value: Number(form.get("value")), weight: Number(form.get("weight")) || 1, date: String(form.get("date")), note: String(form.get("note") ?? "") };
      if (grade.value < 1 || grade.value > 6) return toast.error("Il voto deve essere compreso tra 1 e 6.");
      onSave((current) => ({ ...current, grades: [grade, ...current.grades] }), "Voto registrato");
    } else if (type === "agenda") {
      const due = String(form.get("dueAt"));
      const item: AgendaItem = { id: uid("item"), subjectId: String(form.get("subjectId")), semesterId, kind: String(form.get("kind")) as AgendaItem["kind"], title: String(form.get("title")), description: String(form.get("description") ?? ""), dueAt: new Date(due).toISOString(), reminder: form.get("reminder") === "on", completed: false, typeId: String(form.get("typeId") ?? ""), weight: Number(form.get("weight")) || 1 };
      onSave((current) => ({ ...current, agenda: [item, ...current.agenda] }), "Attività aggiunta");
    } else if (type === "absence") {
      const kind = String(form.get("kind")) as Absence["kind"];
      const item: Absence = { id: uid("absence"), semesterId, date: String(form.get("date")), subjectId: String(form.get("subjectId")) || undefined, kind, durationHours: Number(form.get("durationHours")) || 1, justified: kind !== "unjustified", note: String(form.get("note") ?? "") };
      onSave((current) => ({ ...current, absences: [item, ...current.absences] }), "Assenza registrata");
    } else if (type === "subject") {
      const name = String(form.get("name"));
      const rawTypes = String(form.get("gradeTypes") || "Scritto:1, Orale:1").split(",").map((item) => item.trim()).filter(Boolean);
      const id = editingSubject?.id ?? uid("subject");
      const gradeTypes = rawTypes.map((item, index) => { const [typeName, typeWeight, component] = item.split(":").map((part) => part.trim()); return { id: editingSubject?.gradeTypes[index]?.id ?? `${id}-type-${index}`, name: typeName || `Tipo ${index + 1}`, weight: Number(typeWeight) || 1, component: component || undefined }; });
      const next: Subject = { id, name, color: String(form.get("color")), teacher: String(form.get("teacher") ?? ""), coefficient: Number(form.get("coefficient")) || 1, gradeTypes };
      onSave((current) => ({ ...current, subjects: editingSubject ? current.subjects.map((item) => item.id === id ? next : item) : [...current.subjects, next] }), editingSubject ? "Materia aggiornata" : "Materia aggiunta");
    } else if (type === "semester") {
      const semester: Semester = { id: editingSemester?.id ?? uid("semester"), name: String(form.get("name")), schoolYear: String(form.get("schoolYear")), startDate: String(form.get("startDate")), endDate: String(form.get("endDate")), archived: editingSemester?.archived };
      onSave((current) => ({ ...current, semesters: editingSemester ? current.semesters.map((item) => item.id === semester.id ? semester : item) : [semester, ...current.semesters] }), editingSemester ? "Semestre aggiornato" : "Semestre creato");
    }
  };
  const titles: Record<Exclude<ModalType, null>, [string, string]> = { grade: ["Registra un voto", "Inserisci il risultato e la sua ponderazione."], agenda: ["Nuova attività", "Aggiungi un compito o una verifica all’agenda."], absence: ["Registra assenza", "Tieni aggiornato il conteggio del semestre."], subject: [editingSubject ? "Modifica materia" : "Nuova materia", "Configura coefficienti e tipologie di voto."], semester: [editingSemester ? "Modifica semestre" : "Nuovo semestre", "Crea un contenitore separato per voti e assenze."] };
  return <Dialog open={!!type} onOpenChange={(open) => !open && onClose()}><DialogContent className="entry-dialog">{type && <form onSubmit={submit}><DialogHeader><DialogTitle>{titles[type][0]}</DialogTitle><DialogDescription>{titles[type][1]}</DialogDescription></DialogHeader><div className="form-grid">
    {(type === "grade" || type === "agenda" || type === "absence") && <label className={type === "absence" ? "" : "full"}>Materia<NativeSelect name="subjectId" value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} required><NativeSelectOption value="">{type === "absence" ? "Intera giornata / nessuna" : "Scegli materia"}</NativeSelectOption>{data.subjects.map((item) => <NativeSelectOption value={item.id} key={item.id}>{item.name}</NativeSelectOption>)}</NativeSelect></label>}
    {type === "grade" && <><label>Voto<input name="value" type="number" inputMode="decimal" min="1" max="6" step=".1" defaultValue="5" required /></label><label>Data<input name="date" type="date" defaultValue={todayInput()} required /></label><label>Tipologia<NativeSelect name="typeId" required>{subject?.gradeTypes.map((item) => <NativeSelectOption value={item.id} key={item.id}>{item.name} · {item.weight}×</NativeSelectOption>)}</NativeSelect></label><label>Peso voto<input name="weight" type="number" min=".1" max="10" step=".1" defaultValue="1" /></label><label className="full">Nota<input name="note" placeholder="Es. funzioni, presentazione…" /></label></>}
    {type === "agenda" && <><label>Tipo<NativeSelect name="kind"><NativeSelectOption value="task">Compito</NativeSelectOption><NativeSelectOption value="test">Verifica</NativeSelectOption></NativeSelect></label><label>Scadenza<input name="dueAt" type="datetime-local" defaultValue={`${todayInput()}T16:00`} required /></label><label className="full">Titolo<input name="title" placeholder="Cosa devi fare?" required /></label><label className="full">Dettagli<textarea name="description" placeholder="Capitoli, materiale, indicazioni…" /></label><label>Tipologia voto<NativeSelect name="typeId"><NativeSelectOption value="">Non specificata</NativeSelectOption>{subject?.gradeTypes.map((item) => <NativeSelectOption value={item.id} key={item.id}>{item.name}</NativeSelectOption>)}</NativeSelect></label><label>Peso previsto<input name="weight" type="number" min=".1" step=".1" defaultValue="1" /></label><label className="switch-row full">Promemoria<input type="checkbox" name="reminder" defaultChecked /></label></>}
    {type === "absence" && <><label>Data<input name="date" type="date" defaultValue={todayInput()} required /></label><label>Tipologia<NativeSelect name="kind"><NativeSelectOption value="justified">Giustificata</NativeSelectOption><NativeSelectOption value="unjustified">Non giustificata</NativeSelectOption><NativeSelectOption value="late">Ritardo</NativeSelectOption><NativeSelectOption value="early-exit">Uscita anticipata</NativeSelectOption></NativeSelect></label><label>Durata in ore<input name="durationHours" type="number" min=".1" max="24" step=".5" defaultValue="1" required /></label><label>Nota<input name="note" placeholder="Facoltativa" /></label></>}
    {type === "subject" && <><label className="full">Nome<input name="name" defaultValue={editingSubject?.name} placeholder="Es. Matematica" required /></label><label>Colore<input className="color-input" name="color" type="color" defaultValue={editingSubject?.color ?? "#6655e6"} /></label><label>Coefficiente generale<input name="coefficient" type="number" min=".1" max="10" step=".1" defaultValue={editingSubject?.coefficient ?? 1} required /></label><label className="full">Docente<input name="teacher" defaultValue={editingSubject?.teacher} placeholder="Facoltativo" /></label><label className="full">Tipologie e pesi<input name="gradeTypes" defaultValue={editingSubject?.gradeTypes.map((item) => `${item.name}:${item.weight}${item.component ? `:${item.component}` : ""}`).join(", ")} placeholder="Scritto:1.2:Teoria, Pratico:1.5:Pratica" required /><small>Formato: Nome:peso:componente. Separa le tipologie con una virgola.</small></label></>}
    {type === "semester" && <><label className="full">Nome<input name="name" defaultValue={editingSemester?.name} placeholder="Es. Semestre 4" required /></label><label>Anno scolastico<input name="schoolYear" defaultValue={editingSemester?.schoolYear} placeholder="2026/27" required /></label><label>Data inizio<input name="startDate" type="date" defaultValue={editingSemester?.startDate ?? todayInput()} required /></label><label>Data fine<input name="endDate" type="date" defaultValue={editingSemester?.endDate} required /></label></>}
  </div><DialogFooter><button type="button" className="soft-button" onClick={onClose}>Annulla</button><button type="submit" className="primary-button">Salva</button></DialogFooter></form>}</DialogContent></Dialog>;
}

function SettingsDialog({ open, onOpenChange, data, preferences, onPreferences, onAddSubject, onEditSubject, onDeleteSubject, onAddSemester, onEditSemester, onDeleteSemester, onArchiveSemester, onExport, onImport }: { open: boolean; onOpenChange: (open: boolean) => void; data: SchoolData; preferences: Preferences; onPreferences: (patch: Partial<Preferences>) => void; onAddSubject: () => void; onEditSubject: (subject: Subject) => void; onDeleteSubject: (id: string) => void; onAddSemester: () => void; onEditSemester: (semester: Semester) => void; onDeleteSemester: (id: string) => void; onArchiveSemester: (id: string) => void; onExport: () => void; onImport: () => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="settings-dialog"><DialogHeader><DialogTitle>Impostazioni</DialogTitle><DialogDescription>Personalizza il tuo diario e gestisci i dati locali.</DialogDescription></DialogHeader><Tabs defaultValue="subjects" className="settings-tabs"><TabsList className="settings-tablist"><TabsTrigger value="subjects"><Layers3 /> Materie</TabsTrigger><TabsTrigger value="periods"><CalendarDays /> Semestri</TabsTrigger><TabsTrigger value="preferences"><Settings2 /> Preferenze</TabsTrigger></TabsList>
    <TabsContent value="subjects" className="settings-section"><div className="settings-section-head"><div><h3>Materie</h3><p>Colori, docenti e ponderazioni.</p></div><button className="primary-button small" onClick={onAddSubject}><Plus /> Aggiungi</button></div><div className="settings-list">{data.subjects.map((subject) => <article key={subject.id}><span className="subject-icon" style={{ background: `${subject.color}1f`, color: subject.color }}><BookOpen /></span><div><b>{subject.name}</b><small>{subject.teacher || "Nessun docente"} · coeff. {subject.coefficient}×</small></div><button className="icon-button" onClick={() => onEditSubject(subject)} aria-label={`Modifica ${subject.name}`}><Pencil /></button><button className="icon-button danger" onClick={() => onDeleteSubject(subject.id)} aria-label={`Elimina ${subject.name}`}><Trash2 /></button></article>)}</div></TabsContent>
    <TabsContent value="periods" className="settings-section"><div className="settings-section-head"><div><h3>Semestri</h3><p>Archivia e confronta i periodi scolastici.</p></div><button className="primary-button small" onClick={onAddSemester}><Plus /> Nuovo</button></div><div className="settings-list">{data.semesters.map((semester) => <article key={semester.id}><span className="subject-icon"><CalendarDays /></span><div><b>{semester.name} {semester.archived && <em>Archiviato</em>}</b><small>{semester.schoolYear} · {formatDate(semester.startDate)} – {formatDate(semester.endDate)}</small></div><button className="icon-button" onClick={() => onEditSemester(semester)} aria-label={`Modifica ${semester.name}`}><Pencil /></button><button className="icon-button" onClick={() => onArchiveSemester(semester.id)} aria-label={semester.archived ? "Ripristina semestre" : "Archivia semestre"}><Archive /></button><button className="icon-button danger" onClick={() => onDeleteSemester(semester.id)} aria-label={`Elimina ${semester.name}`}><Trash2 /></button></article>)}</div></TabsContent>
    <TabsContent value="preferences" className="settings-section"><div className="preference-row"><div><b>Il tuo nome</b><small>Usato nel saluto della Home.</small></div><input value={preferences.studentName} onChange={(event) => onPreferences({ studentName: event.target.value })} /></div><div className="preference-row"><div><b>Tema</b><small>Segue il dispositivo oppure scegli manualmente.</small></div><NativeSelect value={preferences.theme} onChange={(event) => onPreferences({ theme: event.target.value as Preferences["theme"] })}><NativeSelectOption value="system">Automatico</NativeSelectOption><NativeSelectOption value="light">Chiaro</NativeSelectOption><NativeSelectOption value="dark">Scuro</NativeSelectOption></NativeSelect></div><div className="backup-card"><FileJson /><div><b>Backup locale</b><p>Esporta tutto in JSON o importa un backup da un altro dispositivo.</p><div><button className="soft-button" onClick={onExport}><Download /> Esporta</button><button className="soft-button" onClick={onImport}><Upload /> Importa</button></div></div></div><div className="privacy-note"><CircleGauge /> Tutti i dati restano sul dispositivo. Nessun account e nessun server.</div></TabsContent>
  </Tabs></DialogContent></Dialog>;
}

function EmptyState({ icon: Icon, title, text }: { icon: typeof CalendarDays; title: string; text: string }) { return <div className="empty-state"><Icon /><b>{title}</b><p>{text}</p></div>; }
function EmptyMini({ text }: { text: string }) { return <div className="empty-mini"><CheckCircle2 />{text}</div>; }
