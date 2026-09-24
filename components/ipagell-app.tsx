"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
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
import { EmptyState } from "@/components/diary-empty-state";
import { AccountGate } from "@/components/account-gate";
import { LanguageSelect, useI18n } from "@/components/i18n-provider";
import { formatDate as intlDate, formatNumber as intlNumber, selectPlural, type Locale } from "@/lib/i18n";
import { AccountSecurity } from "@/components/account-security";
import { useDiary } from "@/hooks/use-diary";
import { InstallAppOffer } from "@/components/install-app";
import { gradeSchema } from "@/lib/validation";
import {
  CURRENT_GRADING_SYSTEM,
  gradeProgressPercent,
  isPassingGrade,
  isValidGradeValue,
  roundRequiredGrade,
} from "@/lib/grading";
import { EntryDialog, type ModalType } from "@/components/entry-dialog";
import { ClassesView } from "@/components/classes-view";
import { PersonalEventDialog } from "@/components/class-events-panel";
import { useClassAgenda } from "@/hooks/use-class-agenda";
import { subscriptionAgenda, type AgendaDisplayItem, type ClassSubscription } from "@/lib/classes/events";
import { backupWithClassAgenda } from "@/lib/classes/backup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
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
  { id: "home", icon: Home },
  { id: "agenda", icon: CalendarDays },
  { id: "grades", icon: GraduationCap },
  { id: "absences", icon: UserRoundCheck },
  { id: "classes", icon: UsersRound },
] as const;
const navKeys = { home: "common.home", agenda: "nav.agenda", grades: "nav.grades", absences: "nav.absences", classes: "nav.classes", stats: "nav.stats" } as const;

const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const formatDate = (locale: Locale, date: string, options?: Intl.DateTimeFormatOptions) =>
  intlDate(locale, date, options ?? { weekday: "short", day: "numeric", month: "short" });
const formatLongDate = (locale: Locale, date: Date) =>
  intlDate(locale, date, { weekday: "long", day: "numeric", month: "long" });
const gradeText = (locale: Locale, value: number | null) =>
  value === null ? "—" : intlNumber(locale, value, {
    minimumFractionDigits: CURRENT_GRADING_SYSTEM.formatting.displayFractionDigits,
    maximumFractionDigits: CURRENT_GRADING_SYSTEM.formatting.displayFractionDigits,
  });
const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);
const localDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

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
  return { days, past };
}

export function IPagellApp({
  initialAccountMode = "login",
}: {
  initialAccountMode?: "login" | "register";
}) {
  const { t } = useI18n();
  const session = useDiary();
  if (session.phase === "loading") return <LoadingScreen />;
  if (session.phase === "error")
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>{t("error.diaryUnavailable")}</h1>
          <p role="alert">{t("error.diaryLoad")}</p>
          <button
            className="primary-button"
            onClick={() => void session.reload()}
          >
            {t("common.retry")}
          </button>
        </section>
      </main>
    );
  if (session.phase === "anonymous" || session.phase === "onboarding")
    return (
      <AccountGate
        user={session.user}
        initialMode={initialAccountMode}
        onRegister={session.register}
        onAuthenticated={session.reload}
        onLogout={session.logout}
      />
    );
  return <DiaryWorkspace session={session} key={session.user!.id} />;
}

function DiaryWorkspace({ session }: { session: ReturnType<typeof useDiary> }) {
  const { t, locale } = useI18n();
  const { data, preferences } = session.diary!;
  const classAgenda = useClassAgenda(session.user!.id);
  const allAgenda = useMemo(() => [...data.agenda, ...subscriptionAgenda(classAgenda.items.filter(s => !data.agenda.some(a => a.id === `class-snapshot-${s.id}`)))], [data.agenda, classAgenda.items]);
  const [personalEvent, setPersonalEvent] = useState<ClassSubscription | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [agendaFocusId, setAgendaFocusId] = useState<string | null>(null);
  const [selectedGradeSubjectId, setSelectedGradeSubjectId] = useState("");
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
    description: string;
    actionLabel: string;
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
            body: t("agenda.notificationDue", { time: formatDate(locale, item.dueAt, { hour: "2-digit", minute: "2-digit" }) }),
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            tag: item.id,
          }),
        )
        .then(() => localStorage.setItem(key, "1"))
        .catch(() => undefined);
    });
  }, [data, preferences, allAgenda, classAgenda.status, session.user, locale, t]);

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
  const reportError = () =>
    toast.error(
      t("entry.saveFailed"),
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
      title: t("webmcp.readTitle"),
      description: t("webmcp.readDescription"),
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
      title: t("webmcp.createGrade"),
      description: t("webmcp.createGradeDescription"),
      inputSchema: {
        type: "object",
        properties: {
          subjectId: { type: "string" },
          value: {
            type: "number",
            minimum: CURRENT_GRADING_SYSTEM.values.minimum,
            maximum: CURRENT_GRADING_SYSTEM.values.maximum,
          },
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
          !isValidGradeValue(value.value) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value.date)
        )
          throw new Error(t("error.gradeInvalid"));
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
  }, [data, preferences, allAgenda, updateData, t]);

  const currentSemester =
    data.semesters.find(
      (semester) => semester.id === preferences.currentSemesterId,
    ) ?? data.semesters[0];
  const semesterGrades = data.grades.filter(
    (grade) => grade.semesterId === currentSemester.id,
  );
  const semesterAgenda: AgendaDisplayItem[] = useMemo(() => allAgenda.filter(
    (item) => item.semesterId === currentSemester.id || ((item as AgendaDisplayItem).shared && !data.semesters.some(s => s.id === item.semesterId)),
  ), [allAgenda, currentSemester.id, data.semesters]);
  const semesterAbsences = data.absences.filter(
    (absence) => absence.semesterId === currentSemester.id,
  );
  const average = generalAverage(data.subjects, semesterGrades);
  const navigate = (tab: TabId, agendaItemId?: string) => {
    setAgendaFocusId(tab === "agenda" ? agendaItemId ?? null : null);
    setActiveTab(tab);
  };
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
      return toast.error(t("error.lastSemester"));
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
      toast.success(t("backup.ready"));
    } catch { reportError(); }
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 1_500_000)
        throw new Error(t("error.backupTooLarge"));
      const parsed: unknown = JSON.parse(await file.text());
      setPendingBackup(parseBackup(parsed));
    } catch {
      toast.error(t("error.backupInvalid"));
    }
    if (importRef.current) importRef.current.value = "";
  };

  const requestNotifications = async () => {
    if (!("Notification" in window))
      return toast.error(
        t("agenda.notificationUnsupported"),
      );
    const result = await Notification.requestPermission();
    if (result === "granted")
      toast.success(
        t("agenda.notificationGranted"),
      );
    else toast.info(t("agenda.notificationDenied"));
  };

  return (
    <main className="app-shell">
      <aside className="desktop-nav">
        <button
          className="brand-mark"
          onClick={() => navigate("home")}
          aria-label={t("common.home")}
        >
          <span>iP</span>
        </button>
        <nav aria-label={t("landing.navFeatures")}>
          {nav.map(({ id, icon: Icon }) => (
            <button
              className={activeTab === id ? "nav-item active" : "nav-item"}
              key={id}
              onClick={() => navigate(id)}
            >
              <Icon size={20} strokeWidth={2.1} />
              <span>{t(navKeys[id])}</span>
            </button>
          ))}
        </nav>
        <button className="settings-nav" onClick={() => setSettingsOpen(true)}>
          <Settings2 size={19} /> {t("common.settings")}
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
            <p>{titleCase(formatLongDate(locale, new Date()))}</p>
            <h1>
              {activeTab === "home"
                ? t("workspace.greeting", { name: preferences.studentName })
                : activeTab === "stats"
                  ? t("nav.stats")
                  : t(navKeys[activeTab])}
            </h1>
            <span className="space-context">{activeTab === "classes" ? t("workspace.shared") : activeTab === "agenda" || activeTab === "home" ? t("workspace.personal") : t("workspace.private")}</span>
          </div>
          <div className="top-actions">
            <LanguageSelect className="language-select" />
            {activeTab !== "classes" && (
              <NativeSelect
                aria-label={t("workspace.currentSemester")}
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
            <button aria-label={t("workspace.theme")} onClick={toggleTheme}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              aria-label={t("common.settings")}
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 size={20} />
            </button>
          </div>
        </header>

        <div className="account-toolbar">
          {activeTab !== "classes" && (
            <NativeSelect
              aria-label={t("workspace.diaryPeriod")}
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
            {t(({ saved: "sync.saved", saving: "sync.saving", offline: "sync.offline", conflict: "sync.conflict", "device-conflict": "sync.deviceConflict", error: "sync.error", expired: "sync.expired" } as const)[session.status])}
          </span>
        </div>
        {(["offline", "error", "expired", "conflict", "device-conflict"] as string[]).includes(
          session.status,
        ) && (
          <section className="sync-banner" aria-label={t("sync.statusLabel")}>
            <p>
              {t(({ offline: "sync.offlineDetail", error: "sync.errorDetail", expired: "sync.expiredDetail", conflict: "sync.conflictDetail", "device-conflict": "sync.deviceConflictDetail", saved: "sync.saved", saving: "sync.saving" } as const)[session.status])}
            </p>
            <div>
              <button className="soft-button" onClick={exportBackup}>
                {t("sync.export")}
              </button>
              {session.status === "device-conflict" ? (
                <button className="soft-button" onClick={() => void session.reload().catch(reportError)}>
                  {t("sync.refreshDevice")}
                </button>
              ) : session.status === "expired" ? (
                <a
                  className="primary-button"
                  onClick={session.reauthenticate}
                  target="_top"
                >
                  {t("common.login")}
                </a>
              ) : session.status === "conflict" ? (
                <button
                  className="soft-button"
                  onClick={() =>
                    setRemoval({
                      title: t("sync.loadAccountTitle"),
                      description:
                        t("sync.loadAccountWarning"),
                      actionLabel: t("sync.loadAccount"),
                      run: session.useServer,
                    })
                  }
                >
                  {t("sync.loadAccount")}
                </button>
              ) : (
                <button
                  className="soft-button"
                  onClick={() => void session.retry().catch(reportError)}
                >
                  {t("common.retry")}
                </button>
              )}
            </div>
          </section>
        )}

        {["home","agenda","classes"].includes(activeTab) && classAgenda.status && <div className="class-sync-status" role="status"><span>{t(classAgenda.status === "loading" ? "classEvents.agendaLoading" : classAgenda.status === "expired" ? "classEvents.sessionExpired" : "classEvents.agendaStale")}</span><button onClick={() => void classAgenda.refresh()}>{t("common.refresh")}</button></div>}
        <div className="view-stage" key={activeTab}>
          {activeTab === "home" && (
            <>
              <Dashboard
                data={data}
                grades={semesterGrades}
                agenda={semesterAgenda}
                average={average}
                onNavigate={navigate}
                onAdd={setModal}
                onManageSubjects={() => setSettingsOpen(true)}
              />
              <InstallAppOffer placement="home" hasRealContent={data.grades.length + data.agenda.length + data.absences.length > 0} />
            </>
          )}
          {activeTab === "agenda" && (
            <AgendaView
              items={semesterAgenda}
              focusItemId={agendaFocusId}
              subjects={data.subjects}
              onAdd={() => setModal("agenda")}
              onClasses={() => navigate("classes")}
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
                  title: shared ? t("agenda.removeSharedConfirm") : t("agenda.deleteConfirm"),
                  description: shared
                    ? t("agenda.removeSharedWarning")
                    : t("agenda.deleteWarning"),
                  actionLabel: shared ? t("agenda.removeShared") : t("agenda.deleteActivity"),
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
                  title: t("grades.deletedTitle"),
                  description: t("grades.deletedDetail"),
                  actionLabel: t("grades.delete"),
                  run: () =>
                    updateData((current) => ({
                      ...current,
                      grades: current.grades.filter((grade) => grade.id !== id),
                    })),
                })
              }
              selectedId={selectedGradeSubjectId}
              onSelectSubject={setSelectedGradeSubjectId}
              onOpenStats={() => navigate("stats")}
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
                  title: t("absence.deleteConfirm"),
                  description:
                    t("absence.deleteWarning"),
                  actionLabel: t("absence.delete"),
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
              onAddGrade={() => setModal("grade")}
              onBackToGrades={() => navigate("grades")}
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
        aria-label={t("workspace.openSettings")}
      >
        <span>{preferences.studentName.slice(0, 2).toUpperCase()}</span>
      </button>
      <nav className="mobile-tabs" aria-label={t("landing.navFeatures")}>
        {nav.map(({ id, icon: Icon }) => (
          <button
            className={activeTab === id ? "active" : ""}
            key={id}
            onClick={() => navigate(id)}
          >
            <Icon size={21} />
            <span>{t(navKeys[id])}</span>
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
        onRefresh={session.status === "device-conflict" ? async () => {
          await session.reload();
          const refreshed = session.getState();
          if (["device-conflict", "error", "expired"].includes(refreshed.status))
            throw new Error(t("entry.refreshFailed"));
        } : undefined}
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
            title: t("account.logoutConfirm"),
            description: t("account.logoutWarning"),
            actionLabel: t("settings.logoutRemoveCopy"),
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
            <AlertDialogTitle>{t("backup.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingBackup && t("backup.confirmDescription", { subjects: intlNumber(locale, pendingBackup.data.subjects.length), grades: intlNumber(locale, pendingBackup.data.grades.length) })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <button className="soft-button" onClick={exportBackup}>
            {t("backup.exportCurrent")}
          </button>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingBackup)
                  void session
                    .commit(() => pendingBackup.data, pendingBackup.preferences)
                    .then(() => {
                      setPendingBackup(null);
                      toast.success(t("backup.imported"));
                    })
                    .catch(reportError);
              }}
            >
            {t("backup.importReplace")}
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
              {removal?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                void removal
                  ?.run()
                  .then(() => setRemoval(null))
                  .catch(reportError)
              }
            >
              {removal?.actionLabel}
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
            <AlertDialogTitle>{t("settings.deleteSubjectConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.deleteSubjectWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteSubjectId && removeSubject(deleteSubjectId)}
            >
              {t("common.delete")}
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
            <AlertDialogTitle>{t("settings.deleteSemesterConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.deleteSemesterWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                deleteSemesterId && removeSemester(deleteSemesterId)
              }
            >
              {t("common.delete")}
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
  const { t } = useI18n();
  return (
    <main className="loading-screen">
      <div className="brand-mark">
        <span>iP</span>
      </div>
      <p>{t("app.loading")}</p>
    </main>
  );
}

function Dashboard({
  data,
  grades,
  agenda,
  average,
  onNavigate,
  onAdd,
  onManageSubjects,
}: {
  data: SchoolData;
  grades: Grade[];
  agenda: AgendaDisplayItem[];
  average: number | null;
  onNavigate: (tab: TabId, agendaItemId?: string) => void;
  onAdd: (type: ModalType) => void;
  onManageSubjects: () => void;
}) {
  const { t, locale } = useI18n();
  const openItems = agenda
    .filter((item) => !item.completed && item.shared?.event.status !== "cancelled")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const overdue = openItems.filter((item) => getCountdown(item.dueAt).past);
  const future = openItems.filter((item) => !getCountdown(item.dueAt).past);
  const nextTest = future[0];
  const countdown = nextTest ? getCountdown(nextTest.dueAt) : null;
  const subject = findSubject(data.subjects, nextTest?.subjectId);
  const gradedSubjects = data.subjects.filter((item) => subjectAverage(item, grades) !== null).length;
  const emptyDiary = !agenda.length && !grades.length;

  return (
    <div className={`dashboard-grid ${emptyDiary ? "empty-dashboard" : ""}`}>
      <section className="hero-card" style={subject ? { borderLeftColor: subject.color } : undefined}>
        <div className="hero-top">
          <span className="hero-label">{nextTest ? nextTest.kind === "test" ? t("home.nextTest") : t("home.nextTask") : t("home.agenda")}</span>
          {nextTest && <span className="date-pill">{countdown?.days === 0 ? t("home.today") : selectPlural(locale, countdown?.days ?? 0, t("home.inOneDay"), t("home.inDays", { days: countdown?.days ?? 0 }))}</span>}
        </div>
        {nextTest ? (
          <>
            <div className="subject-kicker"><span style={{ background: subject?.color }} /> {subject?.name ?? nextTest.shared?.event.subject ?? t("common.subject")}</div>
            <h2>{nextTest.title}</h2>
            {nextTest.shared && <span className="agenda-origin">{nextTest.shared.detachedAt ? t("home.personalOrigin", { className: nextTest.shared.event.className }) : t("home.classOrigin", { className: nextTest.shared.event.className })}</span>}
            <p>{titleCase(formatDate(locale, nextTest.dueAt, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }))}</p>
            <button onClick={() => onNavigate("agenda", nextTest.id)}><BookOpen size={18} /> {t("home.openActivity")}</button>
          </>
        ) : overdue.length ? (
          <div className="empty-hero">
            <h2>{t("home.noUpcoming")}</h2>
            <p>{selectPlural(locale, overdue.length, t("home.overdueHintOne"), t("home.overdueHintMany", { count: overdue.length }))}</p>
          </div>
        ) : (
          <div className="empty-hero">
            <h2>{emptyDiary ? t("home.start") : t("home.noUpcoming")}</h2>
            <p>{emptyDiary ? t("home.startHint") : t("home.noMore")}</p>
            <button onClick={() => data.subjects.length ? onAdd("agenda") : onManageSubjects()}><Plus size={18} /> {data.subjects.length ? t("home.addActivity") : t("home.addSubjects")}</button>
            {emptyDiary && data.subjects.length > 0 && <button className="secondary-action" onClick={() => onAdd("grade")}>{t("home.firstGrade")}</button>}
          </div>
        )}
      </section>

      {!!overdue.length && !emptyDiary && <section className="dashboard-overdue" aria-label={t("home.overdue")}>
        <div className="dashboard-section-heading"><h3>{t("home.overdue")}</h3><span>{selectPlural(locale, overdue.length, t("home.overdueOne"), t("home.overdueMany", { count: overdue.length }))}</span></div>
        {overdue.slice(0, 2).map((item) => {
          const itemSubject = findSubject(data.subjects, item.subjectId);
          return <button className="activity-row overdue-row" key={item.id} onClick={() => onNavigate("agenda", item.id)}><span className="subject-dot" style={{ background: itemSubject?.color ?? "var(--accent)" }} /><div><b>{item.title}</b><small>{itemSubject?.name ?? item.shared?.event.subject} · {formatDate(locale, item.dueAt)}</small></div><ChevronRight size={18} /></button>;
        })}
        {overdue.length > 2 && <button className="text-link" onClick={() => onNavigate("agenda")}>{t("home.openAgenda")}</button>}
      </section>}

      {!!future.length && <section className="panel today-panel dashboard-upcoming">
        <div className="panel-title"><div><h3>{t("home.upcoming")}</h3><p>{selectPlural(locale, future.length, t("home.openActivityOne"), t("home.openActivityMany", { count: future.length }))}</p></div><button aria-label={t("home.addActivity")} onClick={() => onAdd("agenda")}><Plus size={20} /></button></div>
        {future.slice(1, 4).map((item) => {
          const itemSubject = findSubject(data.subjects, item.subjectId);
          return <button className="activity-row" key={item.id} onClick={() => onNavigate("agenda", item.id)}><span className="subject-dot" style={{ background: itemSubject?.color ?? "var(--accent)" }} /><div><b>{item.title}</b><small>{itemSubject?.name ?? item.shared?.event.subject} · {formatDate(locale, item.dueAt)}</small></div><ChevronRight size={18} /></button>;
        })}
        {future.length === 1 && <button className="text-link" onClick={() => onNavigate("agenda")}>{t("home.openAgenda")} <ChevronRight size={16} /></button>}
      </section>}

      {grades.length > 0 ? <button className="grade-summary" onClick={() => onNavigate("grades")}><span>{t("home.gradeSituation")}</span><strong>{t("home.average", { value: gradeText(locale, average) })}</strong><small>{selectPlural(locale, grades.length, t("home.gradeCountOne"), t("home.gradeCount", { count: grades.length }))} · {selectPlural(locale, gradedSubjects, t("home.subjectCountOne"), t("home.subjectCount", { count: gradedSubjects }))}</small><ChevronRight size={18} /></button> : !emptyDiary && <section className="grade-prompt"><div><b>{t("home.noGrades")}</b><span>{t("home.noGradesHint")}</span></div><button onClick={() => data.subjects.length ? onAdd("grade") : onManageSubjects()}>{data.subjects.length ? t("grades.add") : t("home.addSubject")}</button></section>}
    </div>
  );
}

function AgendaView({
  items: allItems,
  focusItemId,
  subjects,
  onAdd,
  onToggle,
  onDelete,
  onNotifications,
  onClasses,
  onPersonal,
}: {
  items: AgendaDisplayItem[];
  focusItemId?: string | null;
  subjects: Subject[];
  onAdd: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onNotifications: () => void;
  onClasses: () => void;
  onPersonal: (item: ClassSubscription) => void;
}) {
  const { locale, t } = useI18n();
  const [scope, setScope] = useState("all");
  const items = useMemo(() => allItems.filter(item => scope === "all" || (scope === "private" ? !item.shared || !!item.shared.detachedAt : !!item.shared && !item.shared.detachedAt)), [allItems, scope]);
  const focusedItem = focusItemId ? allItems.find((item) => item.id === focusItemId) : undefined;
  const focusedDate = focusedItem ? new Date(focusedItem.dueAt) : null;
  const [month, setMonth] = useState(
    () => focusedDate ? new Date(focusedDate.getFullYear(), focusedDate.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(() => focusedDate ? localDayKey(focusedDate) : null);
  const sorted = [...items].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const firstOffset =
    (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const grid = Array.from({ length: firstOffset + days }, (_, index) =>
    index < firstOffset ? null : index - firstOffset + 1,
  );
  const intlLocale = locale === "it" ? "it-CH" : locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : "en-GB";
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(intlLocale, { weekday: "short" }).format(new Date(Date.UTC(2024, 0, 1 + index))).replace(/[.]$/, ""),
  );
  return (
    <section className="module-view">
      <div className="module-toolbar">
        <div>
          <p>{t("agenda.intro")}</p>
        </div>
        <div>
          <button className="soft-button" onClick={onClasses}><UsersRound size={18} /> {t("agenda.openClasses")}</button>
          <button className="soft-button" onClick={onNotifications}>
            <Bell size={18} /> {t("agenda.reminders")}
          </button>
          <button className="primary-button" onClick={onAdd}>
            <Plus size={18} /> {t("entry.newActivity")}
          </button>
        </div>
      </div>
      <div className="agenda-scope" aria-label={t("agenda.activitySource")}>{[["all",t("agenda.all")],["private",t("agenda.personal")],["class",t("agenda.fromClasses")]].map(([id,label]) => <button key={id} aria-pressed={scope === id} onClick={() => setScope(id)}>{label}</button>)}</div>
      <Tabs defaultValue="calendar" className="agenda-tabs">
        <TabsList className="segmented">
          <TabsTrigger value="calendar">
            <CalendarDays /> {t("agenda.calendar")}
          </TabsTrigger>
          <TabsTrigger value="list">
            <ListFilter /> {t("agenda.list")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">
          <div className="agenda-layout">
            <section className="panel calendar-card">
              <div className="calendar-head">
                <button
                  aria-label={t("agenda.previousMonth")}
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
                    intlDate(locale, month, { month: "long", year: "numeric" }),
                  )}
                </h2>
                <button
                  aria-label={t("agenda.nextMonth")}
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
                {weekdays.map(
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
                          ? t("agenda.dayActivities", { day, date: intlDate(locale, month, { month: "long", year: "numeric" }), count: intlNumber(locale, events.length) })
                          : undefined
                      }
                      aria-pressed={
                        !!day &&
                        selectedDay ===
                          localDayKey(
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
                            localDayKey(
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
                  {formatDate(locale, selectedDay)} · {t("agenda.showUpcoming")}
                </button>
              )}
              <AgendaList
                items={
                  selectedDay
                    ? sorted.filter(
                        (item) =>
                          localDayKey(new Date(item.dueAt)) === selectedDay,
                      )
                    : sorted.filter((item) => !item.completed).slice(0, 6)
                }
                subjects={subjects}
                onToggle={onToggle}
                onDelete={onDelete}
                onPersonal={onPersonal}
                focusItemId={focusItemId}
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
            focusItemId={focusItemId}
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
  focusItemId,
  compact = false,
}: {
  items: AgendaDisplayItem[];
  subjects: Subject[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPersonal: (item: ClassSubscription) => void;
  focusItemId?: string | null;
  compact?: boolean;
}) {
  const { locale, t } = useI18n();
  return (
    <section className={`panel agenda-list ${compact ? "compact" : ""}`}>
      <div className="panel-title">
        <div>
          <span className="eyebrow">{t("agenda.deadlines")}</span>
          <h3>{compact ? t("agenda.upcoming") : `${intlNumber(locale, items.length)} ${t(selectPlural(locale, items.length, "agenda.itemOne", "agenda.itemMany"))}`}</h3>
        </div>
      </div>
      {items.length ? (
        items.map((item) => {
          const subject = findSubject(subjects, item.subjectId);
          return (
            <article
              className={`${item.completed ? "completed" : ""} ${item.shared?.event.status === "cancelled" ? "cancelled" : ""} ${item.id === focusItemId ? "home-focus" : ""}`}
              id={item.id === focusItemId ? "home-focused-agenda-item" : undefined}
              aria-current={item.id === focusItemId ? "location" : undefined}
              key={item.id}
            >
              <button
                className="round-check"
                aria-label={
                  item.completed
                    ? t("agenda.markTodo")
                    : t("agenda.markDone")
                }
                onClick={() => onToggle(item.id)}
              >
                {item.completed && <Check size={15} />}
              </button>
              <div className="date-block">
                <b>{new Date(item.dueAt).getDate()}</b>
                <small>
                  {intlDate(locale, item.dueAt, { month: "short" })}
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
                {item.shared && <button className="agenda-origin" onClick={() => onPersonal(item.shared!)}>{item.shared.event.status === "cancelled" ? `${t("classEvents.cancelled")} · ` : ""}{item.shared.detachedAt ? `${t("agenda.personalOrigin")} · ` : `${t("agenda.classOrigin")} · `}{item.shared.event.className} <Settings2 size={12} /></button>}
                {item.description && <p className="agenda-description">{item.description}</p>}
                <small>
                  {item.kind === "test" ? t("entry.test") : t("entry.task")} ·{" "}
                  {intlDate(locale, item.dueAt, { hour: "2-digit", minute: "2-digit" })}
                  {item.reminder ? ` · ${t("agenda.reminderOpen")}` : ""}
                </small>
              </div>
              <button
                className="icon-button subtle"
                aria-label={t("common.delete")}
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
          title={t("agenda.emptyTitle")}
          text={t("agenda.emptyText")}
        />
      )}
    </section>
  );
}

function GradesView({
  subjects,
  grades,
  goal,
  selectedId,
  onSelectSubject,
  onGoal,
  onAdd,
  onDelete,
  onOpenStats,
}: {
  subjects: Subject[];
  grades: Grade[];
  goal: number;
  selectedId: string;
  onSelectSubject: (id: string) => void;
  onGoal: (value: number) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onOpenStats: () => void;
}) {
  const { t, locale } = useI18n();
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
        <p>{t("grades.scale")}</p>
        <div className="grades-actions">
          <button className="grades-stats-link" onClick={onOpenStats}><BarChart3 size={17} /> {t("grades.stats")}</button>
          <button className="primary-button" onClick={onAdd}><Plus size={18} /> {t("grades.add")}</button>
        </div>
      </div>
      <div className="grade-overview">
        {subjects.map((item) => {
          const value = subjectAverage(item, grades);
          return (
            <button
              className={item.id === subject?.id ? "selected" : ""}
              key={item.id}
              onClick={() => onSelectSubject(item.id)}
            >
              <span style={{ background: item.color }}>
                <BookOpen size={18} />
              </span>
              <small>{item.name}</small>
              <b className={value !== null && !isPassingGrade(value) ? "low-grade" : ""}>
                {gradeText(locale, value)}
              </b>
              <i
                style={{
                  background: item.color,
                  width: `${gradeProgressPercent(value)}%`,
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
                <h3>{t("grades.register")}</h3>
              </div>
              <div className="big-average" style={{ color: subject.color }}>
                {gradeText(locale, average)}
              </div>
            </div>
            {subjectGrades.length ? (
              subjectGrades.map((grade) => (
                <article key={grade.id}>
                  <div className={`grade-pill ${!isPassingGrade(grade.value) ? "low" : ""}`}>
                    {gradeText(locale, grade.value)}
                  </div>
                  <div>
                    <b>
                      {grade.note ||
                        subject.gradeTypes.find(
                          (type) => type.id === grade.typeId,
                        )?.name ||
                        t("common.grade")}
                    </b>
                    <small>
                      {formatDate(locale, grade.date)} · {t("grades.weight", { value: gradeText(locale, grade.weight) })}
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
                    aria-label={t("grades.delete")}
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              ))
            ) : (
              <EmptyState
                icon={GraduationCap}
                title={t("home.noGrades")}
                text={t("grades.emptyHint")}
              />
            )}
          </section>
          <aside className="panel simulator-card">
            <span className="eyebrow">{t("grades.simulator")}</span>
            <h3>{t("grades.needed")}</h3>
            <p>
              {t("grades.neededHint")}
            </p>
            <label>
              {t("grades.target")} <b>{gradeText(locale, target)}</b>
              <input
                type="range"
                min={CURRENT_GRADING_SYSTEM.passingValue}
                max={CURRENT_GRADING_SYSTEM.values.maximum}
                step=".1"
                value={target}
                onChange={(event) => setTarget(Number(event.target.value))}
                onBlur={() => {
                  if (target !== goal) onGoal(target);
                }}
              />
            </label>
            <label>
              {t("grades.nextType")}
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
              {t("grades.nextWeight")}
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
              className={`needed-grade ${needed !== null && needed > CURRENT_GRADING_SYSTEM.values.maximum ? "impossible" : ""}`}
            >
              <small>{t("grades.required")}</small>
              <strong>
                {needed === null
                  ? "—"
                  : needed <= CURRENT_GRADING_SYSTEM.values.minimum
                    ? t("grades.enoughOne")
                    : needed > CURRENT_GRADING_SYSTEM.values.maximum
                      ? t("grades.notEnough")
                      : gradeText(locale, roundRequiredGrade(needed))}
              </strong>
            </div>
            <small className="sim-note">
              {t("grades.simNote", { weight: intlNumber(locale, nextWeight * (type?.weight ?? 1), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })}
            </small>
          </aside>
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={t("grades.noSubject")}
          text={t("grades.noSubjectHint")}
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
  const { t, locale } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="settings-dialog">
        <DialogHeader>
          <DialogTitle>{t("common.settings")}</DialogTitle>
          <DialogDescription>
            {t("settings.description")}
          </DialogDescription>
          <LanguageSelect className="language-select" />
        </DialogHeader>
        <Tabs defaultValue="subjects" className="settings-tabs">
          <TabsList className="settings-tablist">
            <TabsTrigger value="subjects">
              <Layers3 /> {t("settings.subjects")}
            </TabsTrigger>
            <TabsTrigger value="periods">
              <CalendarDays /> {t("settings.periods")}
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Settings2 /> {t("settings.preferences")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="subjects" className="settings-section">
            <div className="settings-section-head">
              <div>
                <h3>{t("settings.subjects")}</h3>
                <p>{t("settings.manageSubjects")}</p>
              </div>
              <button className="primary-button small" onClick={onAddSubject}>
                <Plus /> {t("settings.add")}
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
                      {subject.teacher || t("settings.noTeacher")} · {t("settings.coefficient", { value: intlNumber(locale, subject.coefficient) })}
                    </small>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => onEditSubject(subject)}
                    aria-label={t("settings.editSubject", { name: subject.name })}
                  >
                    <Pencil />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() => onDeleteSubject(subject.id)}
                    aria-label={t("settings.deleteSubject", { name: subject.name })}
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
                <h3>{t("settings.periods")}</h3>
                <p>{t("settings.periodsHint")}</p>
              </div>
              <button className="primary-button small" onClick={onAddSemester}>
                <Plus /> {t("entry.newSemester")}
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
                      {semester.name} {semester.archived && <em>{t("settings.archived")}</em>}
                    </b>
                    <small>
                      {semester.schoolYear} · {formatDate(locale, semester.startDate)} –{" "}
                      {formatDate(locale, semester.endDate)}
                    </small>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => onEditSemester(semester)}
                    aria-label={t("settings.editSemester", { name: semester.name })}
                  >
                    <Pencil />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => onArchiveSemester(semester.id)}
                    aria-label={
                      semester.archived
                        ? t("settings.restoreSemester")
                        : t("settings.archiveSemester")
                    }
                  >
                    <Archive />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() => onDeleteSemester(semester.id)}
                    aria-label={t("settings.deleteSemester", { name: semester.name })}
                  >
                    <Trash2 />
                  </button>
                </article>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="preferences" className="settings-section">
            <InstallAppOffer placement="settings" />
            <div className="preference-row">
              <div>
                <b>{t("settings.yourName")}</b>
                <small>{t("settings.yourNameHint")}</small>
              </div>
              <input
                aria-label={t("settings.yourName")}
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
                <b>{t("settings.theme")}</b>
                <small>{t("settings.themeHint")}</small>
              </div>
              <NativeSelect
                aria-label={t("settings.theme")}
                value={preferences.theme}
                onChange={(event) =>
                  onPreferences({
                    theme: event.target.value as Preferences["theme"],
                  })
                }
              >
                <NativeSelectOption value="system">
                  {t("settings.automatic")}
                </NativeSelectOption>
                <NativeSelectOption value="light">{t("settings.light")}</NativeSelectOption>
                <NativeSelectOption value="dark">{t("settings.dark")}</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="preference-row">
              <div>
                <b>{t("settings.reduceMotion")}</b>
                <small>{t("settings.reduceMotionHint")}</small>
              </div>
              <Switch
                aria-label={t("settings.reduceMotion")}
                checked={!!preferences.reduceMotion}
                onCheckedChange={(reduceMotion) =>
                  onPreferences({ reduceMotion })
                }
              />
            </div>
            <div className="backup-card">
              <FileJson />
              <div>
                <b>{t("settings.localBackup")}</b>
                <p>
                  {t("settings.backupHint")}
                </p>
                <div>
                  <button className="soft-button" onClick={onExport}>
                    <Download /> {t("settings.export")}
                  </button>
                  <button className="soft-button" onClick={onImport}>
                    <Upload /> {t("settings.import")}
                  </button>
                  <button
                    className="soft-button"
                    onClick={async () => {
                      try {
                        const old = await legacyBackup();
                        if (old) downloadBackup(old, "ipagell-vecchio-diario");
                        else
                          toast.info(
                            t("settings.noLegacyBackup"),
                          );
                      } catch {
                        toast.error(
                          t("settings.legacyUnreadable"),
                        );
                      }
                    }}
                  >
                    {t("settings.recoverLegacy")}
                  </button>
                </div>
              </div>
            </div>
            <div className="privacy-note">
              <CircleGauge /> {t("settings.privacyNote", { account: accountEmail })}
            </div>
            <button className="soft-button" onClick={onLogout}>
              {t("settings.logoutRemoveCopy")}
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
