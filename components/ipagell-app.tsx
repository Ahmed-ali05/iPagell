"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  Clock3,
  Download,
  FileJson,
  GraduationCap,
  Home,
  Layers3,
  ListFilter,
  Moon,
  Pencil,
  Plus,
  Settings2,
  Sun,
  Trash2,
  TrendingUp,
  Upload,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { AbsencesView } from "@/components/absences-view";
import { StatsView } from "@/components/stats-view";
import { EmptyState, EmptyMini } from "@/components/diary-empty-state";
import { AccountGate } from "@/components/account-gate";
import { AccountSecurity } from "@/components/account-security";
import { useDiary } from "@/hooks/use-diary";
import { gradeSchema } from "@/lib/validation";
import { EntryDialog, type ModalType } from "@/components/entry-dialog";
import { ClassesView } from "@/components/classes-view";
import { PersonalEventDialog } from "@/components/class-events-panel";
import { useClassAgenda } from "@/hooks/use-class-agenda";
import { subscriptionAgenda, type AgendaDisplayItem, type ClassSubscription } from "@/lib/classes/events";
import { backupWithClassAgenda } from "@/lib/classes/backup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatGrade,
  generalAverage,
  neededGrade,
  subjectAverage,
} from "@/lib/calculations";
import {
  parseBackup,
  downloadBackup,
  legacyBackup,
} from "@/lib/account-storage";
import type {
  Absence,
  BackupPayload,
  Grade,
  Preferences,
  SchoolData,
  Semester,
  Subject,
} from "@/types/domain";

type TabId = "home" | "agenda" | "grades" | "absences" | "stats" | "classes";

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: Record<string, unknown>,
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

const nav = [
  { id: "home", label: "Home", icon: Home },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "grades", label: "Voti", icon: GraduationCap },
  { id: "absences", label: "Assenze", icon: UserRoundCheck },
  { id: "stats", label: "Statistiche", icon: BarChart3 },
  { id: "classes", label: "Classi", icon: UsersRound },
] as const;

const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const formatDate = (date: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(
    "it-CH",
    options ?? { weekday: "short", day: "numeric", month: "short" },
  ).format(new Date(date));
const formatLongDate = (date: Date) =>
  new Intl.DateTimeFormat("it-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

function findSubject(subjects: Subject[], id?: string) {
  return subjects.find((subject) => subject.id === id);
}

function getCountdown(value: string) {
  const target = new Date(value);
  const now = new Date();
  const past = target.getTime() < now.getTime();
  const days = Math.max(
    0,
    Math.round(
      (Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()) -
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
        86_400_000,
    ),
  );
  if (days === 0) return { value: "Oggi", small: "", past };
  if (days === 1) return { value: "1", small: "giorno", past };
  return { value: String(days), small: "giorni", past };
}

export function IPagellApp() {
  const session = useDiary();
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator)
      void navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((r) => r.update())
        .catch(() => undefined);
  }, []);
  if (session.phase === "loading") return <LoadingScreen />;
  if (session.phase === "error")
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>Il diario non è disponibile</h1>
          <p role="alert">{session.error}</p>
          <button
            className="primary-button"
            onClick={() => void session.reload()}
          >
            Riprova
          </button>
        </section>
      </main>
    );
  if (session.phase === "anonymous" || session.phase === "onboarding")
    return (
      <AccountGate
        user={session.user}
        onRegister={session.register}
        onAuthenticated={session.reload}
        onLogout={session.logout}
      />
    );
  return <DiaryWorkspace session={session} key={session.user!.id} />;
}

function DiaryWorkspace({ session }: { session: ReturnType<typeof useDiary> }) {
  const { data, preferences } = session.diary!;
  const classAgenda = useClassAgenda(session.user!.id);
  const allAgenda = useMemo(() => [...data.agenda, ...subscriptionAgenda(classAgenda.items.filter(s => !data.agenda.some(a => a.id === `class-snapshot-${s.id}`)))], [data.agenda, classAgenda.items]);
  const [personalEvent, setPersonalEvent] = useState<ClassSubscription | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [modal, setModal] = useState<ModalType>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);
  const [deleteSemesterId, setDeleteSemesterId] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupPayload | null>(
    null,
  );
  const [removal, setRemoval] = useState<{
    title: string;
    run: () => Promise<void>;
  } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    queueMicrotask(() => {
      if (query.get("view") === "agenda") setActiveTab("agenda");
      if (
        query.get("view") === "classes" ||
        window.location.hash.includes("join=")
      )
        setActiveTab("classes");
      if (query.get("action") === "grade") {
        setActiveTab("grades");
        setModal("grade");
      }
    });
  }, []);

  useEffect(() => {
    if (
      !data ||
      !preferences ||
      !("Notification" in window) ||
      Notification.permission !== "granted" ||
      !("serviceWorker" in navigator)
    )
      return;
    const now = Date.now();
    const dueSoon = allAgenda.filter(
      (item) =>
        item.semesterId === preferences.currentSemesterId &&
        item.reminder &&
        (!(item as AgendaDisplayItem).shared || !classAgenda.status) &&
        !item.completed &&
        new Date(item.dueAt).getTime() > now &&
        new Date(item.dueAt).getTime() - now < 12 * 60 * 60 * 1000,
    );
    dueSoon.forEach((item) => {
      const key = `ipagell-notified-${session.user!.id}-${item.id}-${item.dueAt}`;
      if (localStorage.getItem(key)) return;
      navigator.serviceWorker.ready
        .then((registration) =>
          registration.showNotification(item.title, {
            body: `Scade ${formatDate(item.dueAt, { hour: "2-digit", minute: "2-digit" })}`,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            tag: item.id,
          }),
        )
        .then(() => localStorage.setItem(key, "1"))
        .catch(() => undefined);
    });
  }, [data, preferences, allAgenda, classAgenda.status, session.user]);

  useEffect(() => {
    if (!preferences) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      (document.documentElement.dataset.theme =
        preferences.theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : preferences.theme);
    document.documentElement.dataset.reduceMotion = String(
      !!preferences.reduceMotion,
    );
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preferences]);

  const commitDiary = session.commit;
  const updateData = useCallback((recipe: (current: SchoolData) => SchoolData) =>
    commitDiary(recipe), [commitDiary]);
  const reportError = (error: unknown) =>
    toast.error(
      error instanceof Error ? error.message : "Salvataggio non riuscito",
    );
  const saveAction = (recipe: (current: SchoolData) => SchoolData) =>
    void updateData(recipe).catch(reportError);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool || !data || !preferences) return;
    const lifecycle = new AbortController();
    const register = (tool: Record<string, unknown>) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => undefined);
      } catch {
        /* Browser senza WebMCP completo. */
      }
    };
    register({
      name: "read_school_summary",
      title: "Leggi riepilogo scolastico",
      description:
        "Restituisce media generale, attività aperte e ore di assenza del semestre selezionato.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => {
        const semesterGrades = data.grades.filter(
          (grade) => grade.semesterId === preferences.currentSemesterId,
        );
        return {
          average: generalAverage(data.subjects, semesterGrades),
          openActivities: allAgenda.filter(
            (item) =>
              item.semesterId === preferences.currentSemesterId &&
              !item.completed && (item as AgendaDisplayItem).shared?.event.status !== "cancelled",
          ).length,
          absenceHours: data.absences
            .filter((item) => item.semesterId === preferences.currentSemesterId)
            .reduce((sum, item) => sum + item.durationHours, 0),
        };
      },
    });
    register({
      name: "create_grade",
      title: "Registra voto",
      description:
        "Registra un nuovo voto in iPagell usando gli stessi dati del modulo Voti.",
      inputSchema: {
        type: "object",
        properties: {
          subjectId: { type: "string" },
          value: { type: "number", minimum: 1, maximum: 6 },
          date: { type: "string" },
          note: { type: "string" },
        },
        required: ["subjectId", "value", "date"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input: unknown) => {
        const value = input as {
          subjectId: string;
          value: number;
          date: string;
          note?: string;
        };
        const subject = data.subjects.find(
          (item) => item.id === value.subjectId,
        );
        if (
          !subject ||
          value.value < 1 ||
          value.value > 6 ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value.date)
        )
          throw new Error("Dati del voto non validi");
        const grade = gradeSchema.parse({
          id: uid("grade"),
          subjectId: subject.id,
          semesterId: preferences.currentSemesterId,
          typeId: subject.gradeTypes[0]?.id ?? "default",
          value: value.value,
          weight: 1,
          date: value.date,
          note: value.note,
        });
        await updateData((current) => ({
          ...current,
          grades: [grade, ...current.grades],
        }));
        return { id: grade.id, status: "saved_on_device" };
      },
    });
    return () => lifecycle.abort();
  }, [data, preferences, allAgenda, updateData]);

  const currentSemester =
    data.semesters.find(
      (semester) => semester.id === preferences.currentSemesterId,
    ) ?? data.semesters[0];
  const semesterGrades = data.grades.filter(
    (grade) => grade.semesterId === currentSemester.id,
  );
  const semesterAgenda: AgendaDisplayItem[] = allAgenda.filter(
    (item) => item.semesterId === currentSemester.id || ((item as AgendaDisplayItem).shared && !data.semesters.some(s => s.id === item.semesterId)),
  );
  const semesterAbsences = data.absences.filter(
    (absence) => absence.semesterId === currentSemester.id,
  );
  const average = generalAverage(data.subjects, semesterGrades);
  const toggleTheme = () =>
    savePreference({
      theme:
        document.documentElement.dataset.theme === "dark" ? "light" : "dark",
    });
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "dark";
  const openSubjectEditor = (subject?: Subject) => {
    setEditingSubject(subject ?? null);
    setModal("subject");
  };
  const openSemesterEditor = (semester?: Semester) => {
    setEditingSemester(semester ?? null);
    setModal("semester");
  };

  const savePreference = (patch: Partial<Preferences>) => {
    void session.commit((d) => d, patch).catch(reportError);
  };
  const removeSubject = (id: string) => {
    saveAction((current) => ({
      ...current,
      subjects: current.subjects.filter((subject) => subject.id !== id),
      grades: current.grades.filter((grade) => grade.subjectId !== id),
      agenda: current.agenda.filter((item) => item.subjectId !== id),
      absences: current.absences.filter((item) => item.subjectId !== id),
    }));
    setDeleteSubjectId(null);
  };
  const removeSemester = (id: string) => {
    const remaining = data.semesters.filter((semester) => semester.id !== id);
    if (!remaining.length)
      return toast.error("Deve rimanere almeno un semestre.");
    saveAction((current) => ({
      ...current,
      semesters: current.semesters.filter((semester) => semester.id !== id),
      grades: current.grades.filter((grade) => grade.semesterId !== id),
      agenda: current.agenda.filter((item) => item.semesterId !== id),
      absences: current.absences.filter((item) => item.semesterId !== id),
    }));
    setDeleteSemesterId(null);
  };

  const exportBackup = () => {
    try {
      downloadBackup(backupWithClassAgenda(data, preferences, classAgenda.items));
      toast.success("Backup pronto. Gli eventi di classe sono inclusi come copie personali.");
    } catch (error) { reportError(error); }
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 1_500_000)
        throw new Error("Il backup supera il limite di 1,5 MB.");
      const parsed: unknown = JSON.parse(await file.text());
      setPendingBackup(parseBackup(parsed));
    } catch {
      toast.error("Il file non è un backup iPagell valido.");
    }
    if (importRef.current) importRef.current.value = "";
  };

  const requestNotifications = async () => {
    if (!("Notification" in window))
      return toast.error(
        "Le notifiche non sono supportate su questo dispositivo.",
      );
    const result = await Notification.requestPermission();
    if (result === "granted")
      toast.success(
        "Avvisi disponibili mentre l’app è aperta. A app chiusa non sono programmati.",
      );
    else toast.info("Puoi riattivarli dalle impostazioni di Safari.");
  };

  return (
    <main className="app-shell">
      <aside className="desktop-nav">
        <button
          className="brand-mark"
          onClick={() => setActiveTab("home")}
          aria-label="Vai alla Home"
        >
          <span>iP</span>
        </button>
        <nav aria-label="Navigazione principale">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              className={activeTab === id ? "nav-item active" : "nav-item"}
              key={id}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={20} strokeWidth={2.1} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button className="settings-nav" onClick={() => setSettingsOpen(true)}>
          <Settings2 size={19} /> Impostazioni
        </button>
        <div className="profile-chip">
          <span>{preferences.studentName.slice(0, 2).toUpperCase()}</span>
          <div>
            <b>{preferences.studentName}</b>
            <small>{currentSemester.name}</small>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>{titleCase(formatLongDate(new Date()))}</p>
            <h1>
              {activeTab === "home"
                ? `Buongiorno, ${preferences.studentName}`
                : nav.find((item) => item.id === activeTab)?.label}
            </h1>
            <span className="space-context">{activeTab === "classes" ? "Condiviso · solo con i membri" : activeTab === "agenda" || activeTab === "home" ? "Il tuo spazio · attività personali e classi scelte da te" : "Privato · visibile solo a te"}</span>
          </div>
          <div className="top-actions">
            {activeTab !== "classes" && (
              <NativeSelect
                aria-label="Semestre corrente"
                value={currentSemester.id}
                onChange={(event) =>
                  savePreference({ currentSemesterId: event.target.value })
                }
                className="semester-select"
              >
                {data.semesters.map((semester) => (
                  <NativeSelectOption key={semester.id} value={semester.id}>
                    {semester.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
            <button aria-label="Cambia tema" onClick={toggleTheme}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              aria-label="Impostazioni"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 size={20} />
            </button>
          </div>
        </header>

        <div className="account-toolbar">
          {activeTab !== "classes" && (
            <NativeSelect
              aria-label="Periodo del diario"
              value={currentSemester.id}
              onChange={(event) =>
                savePreference({ currentSemesterId: event.target.value })
              }
            >
              {data.semesters.map((s) => (
                <NativeSelectOption key={s.id} value={s.id}>
                  {s.name} · {s.schoolYear}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
          <span className={`sync-status ${session.status}`} role="status">
            {
              {
                saved: "Salvato nell’account",
                saving: "Sincronizzazione…",
                offline: "Copia sul dispositivo · offline",
                conflict: "Modifiche da confrontare",
                error: "Sincronizzazione non riuscita",
                expired: "Accedi di nuovo",
              }[session.status]
            }
          </span>
        </div>
        {(["offline", "error", "expired", "conflict"] as string[]).includes(
          session.status,
        ) && (
          <section className="sync-banner" aria-label="Stato del diario">
            <p>
              {session.status === "conflict"
                ? "Il diario è cambiato su un altro dispositivo. Esporta la copia locale prima di caricare quella dell’account."
                : session.status === "expired"
                  ? "La sessione è cambiata o è scaduta. Le modifiche locali sono conservate."
                  : "Le modifiche restano sul dispositivo e verranno sincronizzate alla riconnessione."}
            </p>
            <div>
              <button className="soft-button" onClick={exportBackup}>
                Esporta copia locale
              </button>
              {session.status === "expired" ? (
                <a
                  className="primary-button"
                  onClick={session.reauthenticate}
                  target="_top"
                >
                  Accedi
                </a>
              ) : session.status === "conflict" ? (
                <button
                  className="soft-button"
                  onClick={() =>
                    setRemoval({
                      title:
                        "Caricare la copia dell’account? La copia locale verrà sostituita: esportala prima.",
                      run: session.useServer,
                    })
                  }
                >
                  Carica copia account
                </button>
              ) : (
                <button
                  className="soft-button"
                  onClick={() => void session.retry().catch(reportError)}
                >
                  Riprova
                </button>
              )}
            </div>
          </section>
        )}

        {["home","agenda","classes"].includes(activeTab) && classAgenda.status && <div className="class-sync-status" role="status"><span>{classAgenda.status}</span><button onClick={() => void classAgenda.refresh()}>Aggiorna</button></div>}
        <div className="view-stage" key={activeTab}>
          {activeTab === "home" && (
            <Dashboard
              data={data}
              grades={semesterGrades}
              agenda={semesterAgenda}
              absences={semesterAbsences}
              average={average}
              goal={preferences.gradeGoal}
              onNavigate={setActiveTab}
              onAdd={setModal}
              onManageSubjects={() => setSettingsOpen(true)}
            />
          )}
          {activeTab === "agenda" && (
            <AgendaView
              items={semesterAgenda}
              subjects={data.subjects}
              onAdd={() => setModal("agenda")}
              onClasses={() => setActiveTab("classes")}
              onPersonal={setPersonalEvent}
              onToggle={(id) => {
                const shared = semesterAgenda.find(item => item.id === id)?.shared;
                if (shared) { void classAgenda.update(shared, {completed: !shared.completed}).catch(reportError); return; }
                saveAction((current) => ({
                  ...current,
                  agenda: current.agenda.map((item) =>
                    item.id === id
                      ? { ...item, completed: !item.completed }
                      : item,
                  ),
                }));
              }}
              onDelete={(id) => {
                const shared = semesterAgenda.find(item => item.id === id)?.shared;
                setRemoval({
                  title: shared ? "Rimuovere solo dalla tua agenda? L’evento della classe non cambia." : "Eliminare questa attività?",
                  run: () =>
                    shared ? classAgenda.remove(shared) : updateData((current) => ({
                      ...current,
                      agenda: current.agenda.filter((item) => item.id !== id),
                    })),
                });
              }}
              onNotifications={requestNotifications}
            />
          )}
          {activeTab === "grades" && (
            <GradesView
              subjects={data.subjects}
              grades={semesterGrades}
              goal={preferences.gradeGoal}
              onGoal={(gradeGoal) => savePreference({ gradeGoal })}
              onAdd={() => setModal("grade")}
              onDelete={(id) =>
                setRemoval({
                  title: "Eliminare questo voto?",
                  run: () =>
                    updateData((current) => ({
                      ...current,
                      grades: current.grades.filter((grade) => grade.id !== id),
                    })),
                })
              }
            />
          )}
          {activeTab === "absences" && (
            <AbsencesView
              items={semesterAbsences}
              subjects={data.subjects}
              threshold={preferences.absenceThresholdHours}
              onThreshold={(absenceThresholdHours) =>
                savePreference({ absenceThresholdHours })
              }
              onAdd={() => setModal("absence")}
              onDelete={(id) =>
                setRemoval({
                  title: "Eliminare questa assenza?",
                  run: () =>
                    updateData((current) => ({
                      ...current,
                      absences: current.absences.filter(
                        (item) => item.id !== id,
                      ),
                    })),
                })
              }
            />
          )}
          {activeTab === "stats" && (
            <StatsView
              data={data}
              semester={currentSemester}
              grades={semesterGrades}
              goal={preferences.gradeGoal}
            />
          )}
          {activeTab === "classes" && (
            <ClassesView
              currentUserId={session.user!.id}
              defaultDisplayName={preferences.studentName}
              data={data}
              semesterId={currentSemester.id}
              agenda={classAgenda}
            />
          )}
        </div>
      </section>

      <button
        className="mobile-avatar"
        onClick={() => setSettingsOpen(true)}
        aria-label="Apri impostazioni"
      >
        <span>{preferences.studentName.slice(0, 2).toUpperCase()}</span>
      </button>
      <nav className="mobile-tabs" aria-label="Navigazione principale">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            className={activeTab === id ? "active" : ""}
            key={id}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <EntryDialog
        type={modal}
        onClose={() => {
          setModal(null);
          setEditingSubject(null);
          setEditingSemester(null);
        }}
        data={data}
        semesterId={currentSemester.id}
        editingSubject={editingSubject}
        editingSemester={editingSemester}
        onSave={async (next, message) => {
          await updateData(next);
          setModal(null);
          setEditingSubject(null);
          setEditingSemester(null);
          toast.success(message);
        }}
      />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        data={data}
        preferences={preferences}
        onPreferences={savePreference}
        onAddSubject={() => {
          setSettingsOpen(false);
          openSubjectEditor();
        }}
        onEditSubject={(subject) => {
          setSettingsOpen(false);
          openSubjectEditor(subject);
        }}
        onDeleteSubject={setDeleteSubjectId}
        onAddSemester={() => {
          setSettingsOpen(false);
          openSemesterEditor();
        }}
        onEditSemester={(semester) => {
          setSettingsOpen(false);
          openSemesterEditor(semester);
        }}
        onDeleteSemester={setDeleteSemesterId}
        onArchiveSemester={(id) =>
          saveAction((current) => ({
            ...current,
            semesters: current.semesters.map((semester) =>
              semester.id === id
                ? { ...semester, archived: !semester.archived }
                : semester,
            ),
          }))
        }
        onExport={exportBackup}
        onImport={() => importRef.current?.click()}
        onLogout={() =>
          setRemoval({
            title:
              "Uscire dall’account? La copia su questo dispositivo verrà rimossa. Esporta prima eventuali modifiche non sincronizzate.",
            run: () => session.logout(true),
          })
        }
        accountEmail={session.user!.username}
        accountId={session.user!.id}
        securityDisabled={session.diary!.dirty || session.status !== "saved"}
        onSecurityChanged={() => session.logout(true)}
      />
      <input
        ref={importRef}
        hidden
        type="file"
        accept="application/json,.json"
        onChange={(event) => void importBackup(event.target.files?.[0])}
      />
      <AlertDialog
        open={!!pendingBackup}
        onOpenChange={(open) => !open && setPendingBackup(null)}
      >
        <AlertDialogContent className="confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Importare il backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Il backup contiene {pendingBackup?.data.subjects.length} materie e{" "}
              {pendingBackup?.data.grades.length} voti. Sostituirà il diario di
              questo account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <button className="soft-button" onClick={exportBackup}>
            Esporta il diario attuale
          </button>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingBackup)
                  void session
                    .commit(() => pendingBackup.data, pendingBackup.preferences)
                    .then(() => {
                      setPendingBackup(null);
                      toast.success("Backup importato");
                    })
                    .catch(reportError);
              }}
            >
              Importa e sostituisci
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!removal}
        onOpenChange={(open) => !open && setRemoval(null)}
      >
        <AlertDialogContent className="confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{removal?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              Questa operazione modifica il tuo diario. Puoi annullare per
              conservarlo così com’è.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                void removal
                  ?.run()
                  .then(() => setRemoval(null))
                  .catch(reportError)
              }
            >
              Conferma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!deleteSubjectId}
        onOpenChange={(open) => !open && setDeleteSubjectId(null)}
      >
        <AlertDialogContent className="confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la materia?</AlertDialogTitle>
            <AlertDialogDescription>
              Verranno eliminati anche voti, attività e assenze collegati.
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteSubjectId && removeSubject(deleteSubjectId)}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!deleteSemesterId}
        onOpenChange={(open) => !open && setDeleteSemesterId(null)}
      >
        <AlertDialogContent className="confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il semestre?</AlertDialogTitle>
            <AlertDialogDescription>
              Verranno eliminati tutti i voti, le attività e le assenze del
              periodo. Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                deleteSemesterId && removeSemester(deleteSemesterId)
              }
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {personalEvent && <PersonalEventDialog item={personalEvent} data={data} controller={classAgenda} onClose={() => setPersonalEvent(null)} />}
      <Toaster position="top-center" richColors />
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <div className="brand-mark">
        <span>iP</span>
      </div>
      <p>Preparo il tuo diario…</p>
    </main>
  );
}

function Dashboard({
  data,
  grades,
  agenda,
  absences,
  average,
  goal,
  onNavigate,
  onAdd,
  onManageSubjects,
}: {
  data: SchoolData;
  grades: Grade[];
  agenda: AgendaDisplayItem[];
  absences: Absence[];
  average: number | null;
  goal: number;
  onNavigate: (tab: TabId) => void;
  onAdd: (type: ModalType) => void;
  onManageSubjects: () => void;
}) {
  const upcoming = agenda
    .filter((item) => !item.completed && item.shared?.event.status !== "cancelled")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const nextTest = upcoming[0];
  const countdown = nextTest ? getCountdown(nextTest.dueAt) : null;
  const subject = findSubject(data.subjects, nextTest?.subjectId);
  const totalAbsences = absences.reduce(
    (sum, item) => sum + item.durationHours,
    0,
  );
  const alerts = data.subjects
    .map((item) => ({ subject: item, average: subjectAverage(item, grades) }))
    .filter((item) => item.average !== null && item.average < 4);
  return (
    <div className="dashboard-grid">
      <section className="hero-card">
        <div className="hero-top">
          <span className="eyebrow">
            {nextTest?.kind === "test"
              ? "Prossima verifica"
              : "Prossima consegna"}
          </span>
          {nextTest && (
            <span className="date-pill">
              {countdown?.past
                ? "Scaduta · da completare"
                : countdown?.value === "Oggi"
                  ? "Oggi"
                  : `Tra ${countdown?.value} ${countdown?.small}`}
            </span>
          )}
        </div>
        {nextTest ? (
          <>
            <div className="subject-kicker">
              <span style={{ background: subject?.color }} />{" "}
              {subject?.name ?? nextTest.shared?.event.subject ?? "Materia"}
            </div>
            <h2>{nextTest.title}</h2>
            {nextTest.shared && <span className="agenda-origin">{nextTest.shared.detachedAt ? "Personale · da " : "Classe · "}{nextTest.shared.event.className}</span>}
            <p>
              {titleCase(
                formatDate(nextTest.dueAt, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              )}
            </p>
            <button onClick={() => onNavigate("agenda")}>
              <BookOpen size={18} /> Apri l’agenda
            </button>
            {countdown && (
              <div className="hero-orb">
                {countdown.value}
                <small>{countdown.small}</small>
              </div>
            )}
          </>
        ) : (
          <div className="empty-hero">
            <CheckCircle2 />
            <h2>Nessuna scadenza</h2>
            <p>
              {data.subjects.length
                ? "Non ci sono attività aperte in questo semestre."
                : "Inizia aggiungendo le tue materie."}
            </p>
            <button
              onClick={() =>
                data.subjects.length ? onAdd("agenda") : onManageSubjects()
              }
            >
              <Plus size={18} />{" "}
              {data.subjects.length ? "Aggiungi attività" : "Aggiungi materie"}
            </button>
          </div>
        )}
      </section>
      <section className="average-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">Media generale</span>
            <h3>{formatGrade(average)}</h3>
          </div>
          <span
            className={`status-badge ${average !== null && average < 4 ? "danger" : "success"}`}
          >
            {average === null
              ? "Nessun voto"
              : average >= goal
                ? "Obiettivo"
                : average !== null && average >= 4
                  ? "In corsa"
                  : "Attenzione"}
          </span>
        </div>
        <div className="average-track">
          <span
            style={{
              width: `${average ? Math.max(4, ((average - 1) / 5) * 100) : 0}%`,
            }}
          />
        </div>
        <div className="scale">
          <span>1.0</span>
          <span>Obiettivo {goal.toFixed(1)}</span>
          <span>6.0</span>
        </div>
        <p>
          {average === null
            ? "Aggiungi il primo voto per iniziare."
            : average >= goal
              ? "Stai centrando l’obiettivo del semestre. Continua così."
              : `Ti mancano ${(goal - average).toFixed(1)} punti per raggiungere il tuo obiettivo.`}
        </p>
      </section>
      <section className="panel today-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">In agenda</span>
            <h3>{upcoming.length} attività aperte</h3>
          </div>
          <button
            aria-label="Aggiungi attività"
            onClick={() => onAdd("agenda")}
          >
            <Plus size={20} />
          </button>
        </div>
        {upcoming.slice(0, 3).map((item) => {
          const itemSubject = findSubject(data.subjects, item.subjectId);
          return (
            <button
              className="activity-row"
              key={item.id}
              onClick={() => onNavigate("agenda")}
            >
              <span
                className="subject-dot"
                style={{ background: itemSubject?.color }}
              />
              <div>
                <b>{item.title}</b>
                <small>
                  {itemSubject?.name ?? item.shared?.event.subject} · {formatDate(item.dueAt)}{item.shared ? ` · ${item.shared.detachedAt ? "Copia personale" : item.shared.event.className}` : ""}
                </small>
              </div>
              <ChevronRight size={18} />
            </button>
          );
        })}
        {!upcoming.length && <EmptyMini text="Tutto completato. Bel lavoro!" />}
      </section>
      <section className="panel subjects-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Materie</span>
            <h3>Il tuo andamento</h3>
          </div>
          <button onClick={onManageSubjects}>Gestisci</button>
        </div>
        {data.subjects.slice(0, 5).map((item) => {
          const value = subjectAverage(item, grades);
          return (
            <button
              className="subject-row"
              key={item.id}
              onClick={() => onNavigate("grades")}
            >
              <span
                className="subject-dot"
                style={{ background: item.color }}
              />
              <div>
                <b>{item.name}</b>
                <span className="mini-track">
                  <i
                    style={{
                      width: `${value ? Math.max(5, ((value - 1) / 5) * 100) : 0}%`,
                      background: item.color,
                    }}
                  />
                </span>
              </div>
              <strong
                className={value !== null && value < 4 ? "low-grade" : ""}
              >
                {formatGrade(value)}
              </strong>
            </button>
          );
        })}
      </section>
      <section className="dashboard-strip">
        <button onClick={() => onNavigate("absences")}>
          <span>
            <Clock3 size={19} />
          </span>
          <div>
            <small>Assenze</small>
            <b>{totalAbsences.toFixed(1)} ore</b>
          </div>
        </button>
        <button onClick={() => onNavigate("stats")}>
          <span>
            <TrendingUp size={19} />
          </span>
          <div>
            <small>Voti registrati</small>
            <b>{grades.length}</b>
          </div>
        </button>
        <button
          className={alerts.length ? "alert-tile" : ""}
          onClick={() => onNavigate("grades")}
        >
          <span>
            <AlertTriangle size={19} />
          </span>
          <div>
            <small>Da controllare</small>
            <b>{alerts.length ? `${alerts.length} materie` : "Tutto bene"}</b>
          </div>
        </button>
      </section>
    </div>
  );
}

function AgendaView({
  items: allItems,
  subjects,
  onAdd,
  onToggle,
  onDelete,
  onNotifications,
  onClasses,
  onPersonal,
}: {
  items: AgendaDisplayItem[];
  subjects: Subject[];
  onAdd: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onNotifications: () => void;
  onClasses: () => void;
  onPersonal: (item: ClassSubscription) => void;
}) {
  const [scope, setScope] = useState("all");
  const items = allItems.filter(item => scope === "all" || (scope === "private" ? !item.shared || !!item.shared.detachedAt : !!item.shared && !item.shared.detachedAt));
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const localDay = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const sorted = [...items].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const firstOffset =
    (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const grid = Array.from({ length: firstOffset + days }, (_, index) =>
    index < firstOffset ? null : index - firstOffset + 1,
  );
  return (
    <section className="module-view">
      <div className="module-toolbar">
        <div>
          <p>La tua agenda. Il completamento resta sempre personale.</p>
        </div>
        <div>
          <button className="soft-button" onClick={onClasses}><UsersRound size={18} /> Dalle classi</button>
          <button className="soft-button" onClick={onNotifications}>
            <Bell size={18} /> Promemoria
          </button>
          <button className="primary-button" onClick={onAdd}>
            <Plus size={18} /> Nuova attività
          </button>
        </div>
      </div>
      <div className="agenda-scope" aria-label="Origine delle attività">{[["all","Tutte"],["private","Personali"],["class","Dalle classi"]].map(([id,label]) => <button key={id} aria-pressed={scope === id} onClick={() => setScope(id)}>{label}</button>)}</div>
      <Tabs defaultValue="calendar" className="agenda-tabs">
        <TabsList className="segmented">
          <TabsTrigger value="calendar">
            <CalendarDays /> Calendario
          </TabsTrigger>
          <TabsTrigger value="list">
            <ListFilter /> Elenco
          </TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">
          <div className="agenda-layout">
            <section className="panel calendar-card">
              <div className="calendar-head">
                <button
                  aria-label="Mese precedente"
                  onClick={() =>
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() - 1, 1),
                    )
                  }
                >
                  <ChevronLeft />
                </button>
                <h2>
                  {titleCase(
                    new Intl.DateTimeFormat("it-CH", {
                      month: "long",
                      year: "numeric",
                    }).format(month),
                  )}
                </h2>
                <button
                  aria-label="Mese successivo"
                  onClick={() =>
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() + 1, 1),
                    )
                  }
                >
                  <ChevronRight />
                </button>
              </div>
              <div className="weekdays">
                {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(
                  (day) => (
                    <span key={day}>{day}</span>
                  ),
                )}
              </div>
              <div className="calendar-grid">
                {grid.map((day, index) => {
                  const events = day
                    ? items.filter((item) => {
                        const date = new Date(item.dueAt);
                        return (
                          date.getFullYear() === month.getFullYear() &&
                          date.getMonth() === month.getMonth() &&
                          date.getDate() === day
                        );
                      })
                    : [];
                  const isToday =
                    day === new Date().getDate() &&
                    month.getMonth() === new Date().getMonth() &&
                    month.getFullYear() === new Date().getFullYear();
                  return (
                    <button
                      className={`calendar-day ${isToday ? "today" : ""}`}
                      key={`${day}-${index}`}
                      disabled={!day}
                      aria-label={
                        day
                          ? `${day} ${new Intl.DateTimeFormat("it-CH", { month: "long", year: "numeric" }).format(month)}: ${events.length} attività`
                          : undefined
                      }
                      aria-pressed={
                        !!day &&
                        selectedDay ===
                          localDay(
                            new Date(
                              month.getFullYear(),
                              month.getMonth(),
                              day,
                            ),
                          )
                      }
                      onClick={() =>
                        day &&
                        setSelectedDay(
                          localDay(
                            new Date(
                              month.getFullYear(),
                              month.getMonth(),
                              day,
                            ),
                          ),
                        )
                      }
                    >
                      {day && <span>{day}</span>}
                      <div>
                        {events.slice(0, 3).map((event) => (
                          <i
                            key={event.id}
                            style={{
                              background: findSubject(subjects, event.subjectId)
                                ?.color ?? "#7772d5",
                            }}
                            title={event.title}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
            <div>
              {selectedDay && (
                <button
                  className="soft-button"
                  onClick={() => setSelectedDay(null)}
                >
                  {formatDate(selectedDay)} · Mostra prossime
                </button>
              )}
              <AgendaList
                items={
                  selectedDay
                    ? sorted.filter(
                        (item) =>
                          localDay(new Date(item.dueAt)) === selectedDay,
                      )
                    : sorted.filter((item) => !item.completed).slice(0, 6)
                }
                subjects={subjects}
                onToggle={onToggle}
                onDelete={onDelete}
                onPersonal={onPersonal}
                compact
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="list">
          <AgendaList
            items={sorted}
            subjects={subjects}
            onToggle={onToggle}
            onDelete={onDelete}
            onPersonal={onPersonal}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function AgendaList({
  items,
  subjects,
  onToggle,
  onDelete,
  onPersonal,
  compact = false,
}: {
  items: AgendaDisplayItem[];
  subjects: Subject[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPersonal: (item: ClassSubscription) => void;
  compact?: boolean;
}) {
  return (
    <section className={`panel agenda-list ${compact ? "compact" : ""}`}>
      <div className="panel-title">
        <div>
          <span className="eyebrow">Scadenze</span>
          <h3>{compact ? "Prossime attività" : `${items.length} attività`}</h3>
        </div>
      </div>
      {items.length ? (
        items.map((item) => {
          const subject = findSubject(subjects, item.subjectId);
          return (
            <article
              className={`${item.completed ? "completed" : ""} ${item.shared?.event.status === "cancelled" ? "cancelled" : ""}`}
              key={item.id}
            >
              <button
                className="round-check"
                aria-label={
                  item.completed
                    ? "Segna come da fare"
                    : "Segna come completata"
                }
                onClick={() => onToggle(item.id)}
              >
                {item.completed && <Check size={15} />}
              </button>
              <div className="date-block">
                <b>{new Date(item.dueAt).getDate()}</b>
                <small>
                  {new Intl.DateTimeFormat("it-CH", { month: "short" }).format(
                    new Date(item.dueAt),
                  )}
                </small>
              </div>
              <div className="agenda-copy">
                <div>
                  <span
                    className="subject-dot"
                    style={{ background: subject?.color }}
                  />
                  {subject?.name ?? item.shared?.event.subject}
                </div>
                <h4>{item.title}</h4>
                {item.shared && <button className="agenda-origin" onClick={() => onPersonal(item.shared!)}>{item.shared.event.status === "cancelled" ? "Annullato · " : ""}{item.shared.detachedAt ? "Personale · da " : "Classe · "}{item.shared.event.className} <Settings2 size={12} /></button>}
                {item.description && <p className="agenda-description">{item.description}</p>}
                <small>
                  {item.kind === "test" ? "Verifica" : "Compito"} ·{" "}
                  {new Intl.DateTimeFormat("it-CH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(item.dueAt))}
                  {item.reminder ? " · Avviso ad app aperta" : ""}
                </small>
              </div>
              <button
                className="icon-button subtle"
                aria-label="Elimina"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 size={17} />
              </button>
            </article>
          );
        })
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="Agenda vuota"
          text="Aggiungi un compito o una verifica per iniziare."
        />
      )}
    </section>
  );
}

function GradesView({
  subjects,
  grades,
  goal,
  onGoal,
  onAdd,
  onDelete,
}: {
  subjects: Subject[];
  grades: Grade[];
  goal: number;
  onGoal: (value: number) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(subjects[0]?.id ?? "");
  const subject =
    subjects.find((item) => item.id === selectedId) ?? subjects[0];
  const subjectGrades = grades
    .filter((grade) => grade.subjectId === subject?.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const average = subject ? subjectAverage(subject, grades) : null;
  const [target, setTarget] = useState(goal);
  const [nextType, setNextType] = useState("");
  const [nextWeight, setNextWeight] = useState(1);
  const type =
    subject?.gradeTypes.find((t) => t.id === nextType) ??
    subject?.gradeTypes[0];
  const needed = subject
    ? neededGrade(subject, grades, target, nextWeight * (type?.weight ?? 1))
    : null;
  return (
    <section className="module-view">
      <div className="module-toolbar">
        <p>Scala 1–6 · sufficienza a 4.0</p>
        <button className="primary-button" onClick={onAdd}>
          <Plus size={18} /> Registra voto
        </button>
      </div>
      <div className="grade-overview">
        {subjects.map((item) => {
          const value = subjectAverage(item, grades);
          return (
            <button
              className={item.id === subject?.id ? "selected" : ""}
              key={item.id}
              onClick={() => setSelectedId(item.id)}
            >
              <span style={{ background: item.color }}>
                <BookOpen size={18} />
              </span>
              <small>{item.name}</small>
              <b className={value !== null && value < 4 ? "low-grade" : ""}>
                {formatGrade(value)}
              </b>
              <i
                style={{
                  background: item.color,
                  width: `${value ? ((value - 1) / 5) * 100 : 0}%`,
                }}
              />
            </button>
          );
        })}
      </div>
      {subject ? (
        <div className="grades-layout">
          <section className="panel grades-register">
            <div className="panel-title">
              <div>
                <span className="eyebrow">{subject.name}</span>
                <h3>Registro voti</h3>
              </div>
              <div className="big-average" style={{ color: subject.color }}>
                {formatGrade(average)}
              </div>
            </div>
            {subjectGrades.length ? (
              subjectGrades.map((grade) => (
                <article key={grade.id}>
                  <div className={`grade-pill ${grade.value < 4 ? "low" : ""}`}>
                    {grade.value.toFixed(1)}
                  </div>
                  <div>
                    <b>
                      {grade.note ||
                        subject.gradeTypes.find(
                          (type) => type.id === grade.typeId,
                        )?.name ||
                        "Voto"}
                    </b>
                    <small>
                      {formatDate(grade.date)} · peso {grade.weight.toFixed(1)}×
                    </small>
                  </div>
                  <span>
                    {
                      subject.gradeTypes.find(
                        (type) => type.id === grade.typeId,
                      )?.name
                    }
                  </span>
                  <button
                    className="icon-button subtle"
                    onClick={() => onDelete(grade.id)}
                    aria-label="Elimina voto"
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              ))
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="Nessun voto"
                text="Registra il primo voto per questa materia."
              />
            )}
          </section>
          <aside className="panel simulator-card">
            <span className="eyebrow">Simulatore</span>
            <h3>Che voto mi serve?</h3>
            <p>
              Imposta la media che vuoi raggiungere con la prossima valutazione.
            </p>
            <label>
              Obiettivo <b>{target.toFixed(1)}</b>
              <input
                type="range"
                min="4"
                max="6"
                step=".1"
                value={target}
                onChange={(event) => setTarget(Number(event.target.value))}
                onBlur={() => {
                  if (target !== goal) onGoal(target);
                }}
              />
            </label>
            <label>
              Prossima tipologia
              <NativeSelect
                value={type?.id ?? ""}
                onChange={(e) => setNextType(e.target.value)}
              >
                {subject.gradeTypes.map((t) => (
                  <NativeSelectOption key={t.id} value={t.id}>
                    {t.name} · {t.weight}×
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <label>
              Peso prossima verifica
              <input
                type="number"
                min=".1"
                max="100"
                step=".1"
                value={nextWeight}
                onChange={(e) =>
                  setNextWeight(
                    Math.max(0.1, Math.min(100, Number(e.target.value) || 1)),
                  )
                }
              />
            </label>
            <div
              className={`needed-grade ${needed !== null && needed > 6 ? "impossible" : ""}`}
            >
              <small>Voto necessario</small>
              <strong>
                {needed === null
                  ? "—"
                  : needed <= 1
                    ? "Basta 1.0"
                    : needed > 6
                      ? "> 6.0"
                      : (Math.ceil((needed - 1e-10) * 2) / 2).toFixed(1)}
              </strong>
            </div>
            <small className="sim-note">
              Il risultato è arrotondato al mezzo voto superiore per raggiungere
              l’obiettivo. Peso effettivo della prossima prova:{" "}
              {(nextWeight * (type?.weight ?? 1)).toFixed(2)}×.
            </small>
          </aside>
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Nessuna materia"
          text="Aggiungi una materia dalle impostazioni."
        />
      )}
    </section>
  );
}

function SettingsDialog({
  open,
  onOpenChange,
  data,
  preferences,
  onPreferences,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onAddSemester,
  onEditSemester,
  onDeleteSemester,
  onArchiveSemester,
  onExport,
  onImport,
  onLogout,
  accountEmail,
  accountId,
  securityDisabled,
  onSecurityChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SchoolData;
  preferences: Preferences;
  onPreferences: (patch: Partial<Preferences>) => void;
  onAddSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onAddSemester: () => void;
  onEditSemester: (semester: Semester) => void;
  onDeleteSemester: (id: string) => void;
  onArchiveSemester: (id: string) => void;
  onExport: () => void;
  onImport: () => void;
  onLogout: () => void;
  accountEmail: string;
  accountId: string;
  securityDisabled: boolean;
  onSecurityChanged: () => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="settings-dialog">
        <DialogHeader>
          <DialogTitle>Impostazioni</DialogTitle>
          <DialogDescription>
            Personalizza il diario e gestisci il tuo account.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="subjects" className="settings-tabs">
          <TabsList className="settings-tablist">
            <TabsTrigger value="subjects">
              <Layers3 /> Materie
            </TabsTrigger>
            <TabsTrigger value="periods">
              <CalendarDays /> Semestri
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Settings2 /> Preferenze
            </TabsTrigger>
          </TabsList>
          <TabsContent value="subjects" className="settings-section">
            <div className="settings-section-head">
              <div>
                <h3>Materie</h3>
                <p>Colori, docenti e ponderazioni.</p>
              </div>
              <button className="primary-button small" onClick={onAddSubject}>
                <Plus /> Aggiungi
              </button>
            </div>
            <div className="settings-list">
              {data.subjects.map((subject) => (
                <article key={subject.id}>
                  <span
                    className="subject-icon"
                    style={{
                      background: `${subject.color}1f`,
                      color: subject.color,
                    }}
                  >
                    <BookOpen />
                  </span>
                  <div>
                    <b>{subject.name}</b>
                    <small>
                      {subject.teacher || "Nessun docente"} · coeff.{" "}
                      {subject.coefficient}×
                    </small>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => onEditSubject(subject)}
                    aria-label={`Modifica ${subject.name}`}
                  >
                    <Pencil />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() => onDeleteSubject(subject.id)}
                    aria-label={`Elimina ${subject.name}`}
                  >
                    <Trash2 />
                  </button>
                </article>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="periods" className="settings-section">
            <div className="settings-section-head">
              <div>
                <h3>Semestri</h3>
                <p>Archivia e confronta i periodi scolastici.</p>
              </div>
              <button className="primary-button small" onClick={onAddSemester}>
                <Plus /> Nuovo
              </button>
            </div>
            <div className="settings-list">
              {data.semesters.map((semester) => (
                <article key={semester.id}>
                  <span className="subject-icon">
                    <CalendarDays />
                  </span>
                  <div>
                    <b>
                      {semester.name} {semester.archived && <em>Archiviato</em>}
                    </b>
                    <small>
                      {semester.schoolYear} · {formatDate(semester.startDate)} –{" "}
                      {formatDate(semester.endDate)}
                    </small>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => onEditSemester(semester)}
                    aria-label={`Modifica ${semester.name}`}
                  >
                    <Pencil />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => onArchiveSemester(semester.id)}
                    aria-label={
                      semester.archived
                        ? "Ripristina semestre"
                        : "Archivia semestre"
                    }
                  >
                    <Archive />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() => onDeleteSemester(semester.id)}
                    aria-label={`Elimina ${semester.name}`}
                  >
                    <Trash2 />
                  </button>
                </article>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="preferences" className="settings-section">
            <div className="preference-row">
              <div>
                <b>Il tuo nome</b>
                <small>Usato nel saluto della Home.</small>
              </div>
              <input
                aria-label="Il tuo nome"
                defaultValue={preferences.studentName}
                maxLength={120}
                onBlur={(event) => {
                  if (event.target.value.trim())
                    onPreferences({ studentName: event.target.value.trim() });
                  else event.target.value = preferences.studentName;
                }}
              />
            </div>
            <div className="preference-row">
              <div>
                <b>Tema</b>
                <small>Segue il dispositivo oppure scegli manualmente.</small>
              </div>
              <NativeSelect
                aria-label="Tema"
                value={preferences.theme}
                onChange={(event) =>
                  onPreferences({
                    theme: event.target.value as Preferences["theme"],
                  })
                }
              >
                <NativeSelectOption value="system">
                  Automatico
                </NativeSelectOption>
                <NativeSelectOption value="light">Chiaro</NativeSelectOption>
                <NativeSelectOption value="dark">Scuro</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="preference-row">
              <div>
                <b>Riduci movimento</b>
                <small>Disattiva transizioni e animazioni.</small>
              </div>
              <Switch
                aria-label="Riduci movimento"
                checked={!!preferences.reduceMotion}
                onCheckedChange={(reduceMotion) =>
                  onPreferences({ reduceMotion })
                }
              />
            </div>
            <div className="backup-card">
              <FileJson />
              <div>
                <b>Backup locale</b>
                <p>
                  Esporta tutto in JSON o importa un backup da un altro
                  dispositivo.
                </p>
                <div>
                  <button className="soft-button" onClick={onExport}>
                    <Download /> Esporta
                  </button>
                  <button className="soft-button" onClick={onImport}>
                    <Upload /> Importa
                  </button>
                  <button
                    className="soft-button"
                    onClick={async () => {
                      try {
                        const old = await legacyBackup();
                        if (old) downloadBackup(old, "ipagell-vecchio-diario");
                        else
                          toast.info(
                            "Nessun diario della versione precedente trovato su questo dispositivo.",
                          );
                      } catch {
                        toast.error(
                          "Il vecchio archivio non è leggibile. Nessun dato è stato modificato.",
                        );
                      }
                    }}
                  >
                    Recupera vecchio diario
                  </button>
                </div>
              </div>
            </div>
            <div className="privacy-note">
              <CircleGauge /> Account @{accountEmail}. I dati sono sincronizzati
              nell’account; una copia offline resta su questo dispositivo. Il
              backup JSON non contiene password o sessioni, ma include i tuoi
              dati scolastici: conservalo al sicuro.
            </div>
            <button className="soft-button" onClick={onLogout}>
              Esci e rimuovi la copia locale
            </button>
            <AccountSecurity
              id={accountId}
              username={accountEmail}
              disabled={securityDisabled}
              onChanged={onSecurityChanged}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
