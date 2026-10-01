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
import { GradeScopeFilter } from "@/components/grade-scope-filter";
import { initialGradeScope, resolveGradeScope, scopeGrades, scopePeriods, type GradeScope } from "@/lib/grade-scope";
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
import { PersonalNotesView } from "@/components/notes-view";
import { flushOpenNotes } from "@/lib/notes/flush";
import { useNotes } from "@/hooks/use-notes";
import type { ClassNote, NoteCopySeed, NoteDraft, NotesBackupV3 } from "@/types/notes";
import { PersonalEventDialog } from "@/components/class-events-panel";
import { useClassAgenda } from "@/hooks/use-class-agenda";
import { usePendingActions } from "@/hooks/use-pending-actions";
import { Spinner } from "@/components/ui/spinner";
import { subscriptionAgenda, type AgendaDisplayItem, type ClassSubscription } from "@/lib/classes/events";
import { makeNotesBackup,parseAnyBackup,remapDiaryForImport,estimatedImportUsage,planNotesImport } from "@/lib/notes/backup";
import { listPersonal,listClassDrafts,readMeta,readImportPlan,writeImportPlan,readPersonal,forgetNotes,type ImportPlan } from "@/lib/notes/storage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  generalAverage,
  neededGrade,
  subjectAverage,
} from "@/lib/calculations";
import {
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

type TabId = "home" | "agenda" | "grades" | "absences" | "stats" | "classes" | "notes";

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
const navKeys = { home: "common.home", agenda: "nav.agenda", grades: "nav.grades", absences: "nav.absences", classes: "nav.classes", stats: "nav.stats", notes: "notes.my" } as const;

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
        onAuthenticated={session.authenticate}
        onLogout={session.logout}
      />
    );
  return <DiaryWorkspace session={session} key={session.user!.id} />;
}

function DiaryWorkspace({ session }: { session: ReturnType<typeof useDiary> }) {
  const { t, locale } = useI18n();
  const { data, preferences } = session.diary!;
  const classAgenda = useClassAgenda(session.user!.id);
  const notes = useNotes(session.user!.id);
  const classActions = usePendingActions();
  const allAgenda = useMemo(() => [...data.agenda, ...subscriptionAgenda(classAgenda.items.filter(s => !data.agenda.some(a => a.id === `class-snapshot-${s.id}`)))], [data.agenda, classAgenda.items]);
  const [personalEvent, setPersonalEvent] = useState<ClassSubscription | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [notesIntent,setNotesIntent]=useState<{subjectId:string;newNote:boolean;openId:string;serial:number}>({subjectId:"",newNote:false,openId:"",serial:0});
  const [notesOrigin,setNotesOrigin]=useState<{tab:TabId;agendaItemId?:string}>({tab:"home"});
  const [copyToClass,setCopyToClass]=useState<NoteCopySeed|null>(null);
  const [classesVisited, setClassesVisited] = useState(false);
  const [agendaVisited,setAgendaVisited]=useState(false);
  const [agendaFocusId, setAgendaFocusId] = useState<string | null>(null);
  const [selectedGradeSubjectId, setSelectedGradeSubjectId] = useState("");
  const gradeScroll = useRef(0);
  useEffect(() => {
    if (activeTab !== "grades" && activeTab !== "stats") return;
    const frame = requestAnimationFrame(() => window.scrollTo(0, activeTab === "grades" ? gradeScroll.current : 0));
    return () => cancelAnimationFrame(frame);
  }, [activeTab]);
  const [gradeScope, setGradeScope] = useState<GradeScope>(() => initialGradeScope(data.semesters, preferences.currentSemesterId));
  const [modal, setModal] = useState<ModalType>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);
  const [deleteSemesterId, setDeleteSemesterId] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupPayload | NotesBackupV3 | null>(
    null,
  );
  const [backupExported,setBackupExported]=useState(false);
  const [importPlanExists,setImportPlanExists]=useState(false);
  const [removal, setRemoval] = useState<{
    title: string;
    description: string;
    actionLabel: string;
    run: () => Promise<void | boolean>;
    subscriptionId?: string;
    offerExport?: boolean;
  } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  useEffect(()=>{void readImportPlan(session.user!.id).then(plan=>setImportPlanExists(!!plan)).catch(()=>undefined);},[session.user]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    queueMicrotask(() => {
      if (query.get("view") === "agenda") {setAgendaVisited(true);setActiveTab("agenda");}
      if (
        query.get("view") === "classes" ||
        window.location.hash.includes("join=")
      ) {
        setClassesVisited(true);
        setActiveTab("classes");
      }
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
  const readingScope = useMemo(() => resolveGradeScope(gradeScope, data.semesters, currentSemester.id), [gradeScope, data.semesters, currentSemester.id]);
  const visibleGrades = useMemo(() => scopeGrades(data.grades, data.semesters, readingScope), [data.grades, data.semesters, readingScope]);
  const visiblePeriods = scopePeriods(data.semesters, readingScope);
  const scopeLabel = readingScope.kind === "all" ? t("scope.all") : readingScope.kind === "year"
    ? `${t("scope.year")} · ${readingScope.schoolYear}`
    : `${visiblePeriods[0]?.name ?? ""} · ${visiblePeriods[0]?.schoolYear ?? ""}`;
  const semesterAgenda: AgendaDisplayItem[] = useMemo(() => allAgenda.filter(
    (item) => item.semesterId === currentSemester.id || ((item as AgendaDisplayItem).shared && !data.semesters.some(s => s.id === item.semesterId)),
  ), [allAgenda, currentSemester.id, data.semesters]);
  const semesterAbsences = data.absences.filter(
    (absence) => absence.semesterId === currentSemester.id,
  );
  const average = generalAverage(data.subjects, semesterGrades);
  const navigate = async (tab: TabId, agendaItemId?: string) => {
    try { await flushOpenNotes(); } catch { toast.error(t("notes.saveFailed")); return false; }
    if(tab === "agenda")setAgendaFocusId(agendaItemId ?? null);
    else if(tab !== "notes")setAgendaFocusId(null);
    if (tab === "classes") setClassesVisited(true);
    if (tab === "agenda")setAgendaVisited(true);
    if (activeTab === "grades" && tab !== "grades") gradeScroll.current = window.scrollY;
    setActiveTab(tab);
    return true;
  };
  const openNotes=async(subjectId="",newNote=false,openId="",agendaItemId?:string)=>{
    if(await navigate("notes")){
      if(activeTab!=="notes")setNotesOrigin({tab:activeTab,agendaItemId:agendaItemId??agendaFocusId??undefined});
      setNotesIntent({subjectId,newNote,openId,serial:Date.now()});
    }
  };
  const copyClassToPersonal=async(note:ClassNote)=>{
    const id=crypto.randomUUID();
    const draft:NoteDraft={userId:session.user!.id,id,space:"personal",subjectId:"",subjectName:note.subjectName,title:note.title,content:note.content,contentFormat:note.contentFormat,pinned:false,baseRevision:0,mutationId:crypto.randomUUID(),localVersion:0,localEditedAt:Date.now()};
    try{await notes.savePersonalDraft(draft,null);openNotes("",false,id);}catch{toast.error(t("notes.saveFailed"));}
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

  const exportBackup = async () => {
    try {
      await flushOpenNotes();
      let complete=true;
      try{await notes.pullForBackup();const meta=await readMeta(session.user!.id);complete=meta.complete&&navigator.onLine;}catch{complete=false;}
      let authored:ClassNote[]=[];
      if(complete){try{let after="";while(true){const page=await notes.request<{notes:ClassNote[];nextAfter:string;hasMore:boolean}>(`/api/my-class-notes?after=${after}`);authored.push(...page.notes);after=page.nextAfter;if(!page.hasMore)break;if(!page.notes.length)throw new Error("Incomplete archive");}}catch{complete=false;authored=[];}}
      const [records,drafts]=await Promise.all([listPersonal(session.user!.id).catch(()=>{complete=false;return notes.records;}),listClassDrafts(session.user!.id).catch(()=>{complete=false;return notes.classDrafts;})]);
      if(!complete&&!window.confirm(t("notes.backupPartial")))return;
      const backup=makeNotesBackup(data,preferences,classAgenda.items,records,drafts,authored,complete);
      downloadBackup(backup,"ipagell-diario-appunti");
      setBackupExported(true);
      toast.success(t("backup.ready"));
    } catch(error) { toast.error(error instanceof Error&&error.message==="BACKUP_LIMIT"?t("notes.backupLimit"):t("entry.saveFailed")); }
  };

  const resumeImport=async(start?:ImportPlan)=>{
    const userId=session.user!.id;
    let plan=start??await readImportPlan(userId);
    if(!plan||plan.userId!==userId)return;
    if(!plan.diaryCommitted){
      const already=data.semesters.length===plan.data.semesters.length&&plan.data.semesters.every(s=>data.semesters.some(d=>d.id===s.id));
      if(!already)await session.commit(()=>plan!.data,plan.preferences);
      plan={...plan,diaryCommitted:true};await writeImportPlan(plan,userId);
    }
    for(let index=plan.next;index<plan.entries.length;index++){
      const entry=plan.entries[index];
      if(!await readPersonal(userId,entry.id))await notes.savePersonalDraft(entry,null);
      plan={...plan,next:index+1};await writeImportPlan(plan,userId);
    }
    await writeImportPlan(null,userId);setImportPlanExists(false);await notes.refresh();
  };

  const confirmImport=async()=>{
    const backup=pendingBackup;if(!backup)return;
    try{
      await flushOpenNotes();
      if("backupVersion" in backup){
        if(!backupExported){toast.error(t("backup.exportCurrent"));return;}
        await notes.pullForBackup();
        const records=await listPersonal(session.user!.id);
        if(!estimatedImportUsage(records,backup).withinLimit){toast.error(t("notes.importQuota"));return;}
        const existing=await readImportPlan(session.user!.id);
        if(existing){toast.error(t("notes.importPreview",{count:existing.entries.length}));return;}
        const plan=planNotesImport(session.user!.id,backup);
        await writeImportPlan(plan,session.user!.id);setImportPlanExists(true);
        await resumeImport(plan);
      } else {
        const remapped=remapDiaryForImport(backup.data,backup.preferences);
        await session.commit(()=>remapped.data,remapped.preferences);
      }
      setPendingBackup(null);toast.success(t("backup.imported"));
    }catch{toast.error(t("entry.saveFailed"));}
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 24*1024*1024)
        throw new Error(t("error.backupTooLarge"));
      const parsed: unknown = JSON.parse(await file.text());
      const backup=parseAnyBackup(parsed);
      if(!("backupVersion" in backup)&&file.size>1_500_000)throw new Error(t("error.backupTooLarge"));
      setBackupExported(false);
      setPendingBackup(backup);
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
            {activeTab !== "home" && activeTab !== "agenda" && <span className="space-context">{activeTab === "classes" ? t("workspace.shared") : t("workspace.private")}</span>}
          </div>
          <div className="top-actions">
            <LanguageSelect className="language-select" />
            {!["classes", "notes", "grades", "stats"].includes(activeTab) && (
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
          {importPlanExists&&<button className="soft-button" onClick={()=>void resumeImport().catch(reportError)}>{t("notes.retry")} · {t("notes.backupImport")}</button>}
          {!["classes", "notes", "grades", "stats"].includes(activeTab) && (
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
        {["grades", "stats"].includes(activeTab) && <GradeScopeFilter scope={readingScope} semesters={data.semesters} currentSemesterId={currentSemester.id} onChange={setGradeScope} />}
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
                onOpenNotes={()=>openNotes()}
                onNewNote={()=>openNotes("",true)}
                recentNotes={notes.records}
                onResumeNote={(id)=>openNotes("",false,id)}
                onSubjectNotes={(id)=>openNotes(id)}
              />
              <InstallAppOffer placement="home" hasRealContent={data.grades.length + data.agenda.length + data.absences.length > 0} />
            </>
          )}
          {activeTab === "grades" && (
            <GradesView
              subjects={data.subjects}
              grades={visibleGrades}
              semesters={data.semesters}
              periods={visiblePeriods}
              scopeLabel={scopeLabel}
              history={readingScope.kind === "all"}
              onShowHistory={() => setGradeScope({ kind: "all" })}
              goal={preferences.gradeGoal}
              onGoal={(gradeGoal) => savePreference({ gradeGoal })}
              onAdd={() => data.subjects.length ? setModal("grade") : openSubjectEditor()}
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
              onOpenNotes={(subjectId)=>openNotes(subjectId)}
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
              periods={visiblePeriods}
              scopeLabel={scopeLabel}
              grades={visibleGrades}
              onShowHistory={() => setGradeScope({ kind: "all" })}
              historyAvailable={data.grades.length > visibleGrades.length}
              goal={preferences.gradeGoal}
              onAddGrade={() => setModal("grade")}
              onBackToGrades={() => navigate("grades")}
            />
          )}
          {activeTab === "notes" && <PersonalNotesView key={notesIntent.serial} controller={notes} userId={session.user!.id} data={data} initialSubjectId={notesIntent.subjectId} initialNew={notesIntent.newNote} initialOpenId={notesIntent.openId} onBackToContext={()=>void navigate(notesOrigin.tab,notesOrigin.agendaItemId)} contextLabel={t(navKeys[notesOrigin.tab])} onAddSubject={()=>openSubjectEditor()} onCopyToClass={(note)=>{void navigate("classes").then(ok=>{if(ok)setCopyToClass(note);});}} />}
        </div>
          {agendaVisited&&<div hidden={activeTab !== "agenda"}>
            <AgendaView
              items={semesterAgenda}
              focusItemId={agendaFocusId}
              subjects={data.subjects}
              onAdd={() => data.subjects.length ? setModal("agenda") : openSubjectEditor()}
              onClasses={() => navigate("classes")}
              onOpenNotes={(item)=>openNotes(item.subjectId,false,"",item.id)}
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
                  subscriptionId: shared?.id,
                  run: () =>
                    shared ? classAgenda.remove(shared) : updateData((current) => ({
                      ...current,
                      agenda: current.agenda.filter((item) => item.id !== id),
                    })),
                });
              }}
              onNotifications={requestNotifications}
              pendingShared={classAgenda.pendingSubscription}
              blockedShared={classAgenda.blockedSubscription}
            />
          </div>}
        {classesVisited && (
          <div className="view-stage" style={activeTab === "classes" ? undefined : { display: "none" }}>
            <ClassesView
              active={activeTab === "classes"}
              currentUserId={session.user!.id}
              defaultDisplayName={preferences.studentName}
              data={data}
              semesterId={currentSemester.id}
              agenda={classAgenda}
              actions={classActions}
              notes={notes}
              copyToClass={copyToClass}
              onCopyConsumed={()=>setCopyToClass(null)}
              onCopyPersonal={(note)=>void copyClassToPersonal(note)}
            />
          </div>
        )}
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
        initialSubjectId={activeTab === "grades" || activeTab === "stats" ? selectedGradeSubjectId : undefined}
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
        onLogout={async () => {
          try {
            await flushOpenNotes();
            const [records,drafts]=await Promise.all([listPersonal(session.user!.id),listClassDrafts(session.user!.id)]);
            const pending=records.filter(record=>record.draft).length+drafts.length;
            setRemoval({
              title:t("account.logoutConfirm"),
              description:pending?t("notes.logoutWarning",{count:pending}):t("account.logoutWarning"),
              actionLabel:pending?t("notes.logoutKeepDevice"):t("settings.logoutRemoveCopy"),
              offerExport:pending>0,
              run:async()=>{
                await flushOpenNotes();
                const [latest,latestDrafts]=await Promise.all([listPersonal(session.user!.id),listClassDrafts(session.user!.id)]);
                if(!latest.some(record=>record.draft)&&latestDrafts.length===0)await forgetNotes(session.user!.id);
                await session.logout(true);
              },
            });
          } catch { toast.error(t("notes.saveFailed")); }
        }}
        accountEmail={session.user!.username}
        accountId={session.user!.id}
        securityDisabled={session.diary!.dirty || session.status !== "saved" || notes.pending>0}
        onSecurityChanged={async(operation)=>{await flushOpenNotes();if(operation==="delete")await forgetNotes(session.user!.id);session.reauthenticate();}}
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
              {pendingBackup&&<span> {"backupVersion" in pendingBackup?t("notes.importPreview",{count:pendingBackup.notes.length+pendingBackup.pendingNotes.length+pendingBackup.classDrafts.length+pendingBackup.authoredClassNotes.length}):t("notes.importLegacy")}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <button className="soft-button" onClick={()=>void exportBackup()}>
            {t("backup.exportCurrent")}
          </button>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmImport()}
            >
            {t("backup.importReplace")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!removal}
        onOpenChange={(open) => !open && !classActions.has("removal") && setRemoval(null)}
      >
        <AlertDialogContent className="confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{removal?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {removal?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {removal?.offerExport&&<button className="soft-button" onClick={()=>void exportBackup()}>{t("sync.export")}</button>}
            <AlertDialogCancel disabled={classActions.has("removal")}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={classActions.has("removal") || !!(removal?.subscriptionId && (classAgenda.pendingSubscription(removal.subscriptionId) || classAgenda.blockedSubscription(removal.subscriptionId)))}
              aria-busy={classActions.has("removal")}
              onClick={(event) => {
                event.preventDefault();
                if (!removal) return;
                void classActions.run("removal", removal.run).then((result) => {
                  if (result.started && result.value !== false) setRemoval(null);
                }).catch(reportError);
              }}
            >
              {classActions.has("removal") ? t("common.saving") : removal?.actionLabel}
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
  onOpenNotes,
  onNewNote,
  recentNotes,
  onResumeNote,
  onSubjectNotes,
}: {
  data: SchoolData;
  grades: Grade[];
  agenda: AgendaDisplayItem[];
  average: number | null;
  onNavigate: (tab: TabId, agendaItemId?: string) => void;
  onAdd: (type: ModalType) => void;
  onManageSubjects: () => void;
  onOpenNotes: () => void;
  onNewNote: () => void;
  recentNotes: ReturnType<typeof useNotes>["records"];
  onResumeNote: (id:string) => void;
  onSubjectNotes: (id:string) => void;
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
  const recent = recentNotes.filter(record=>record.draft?!record.draft.deleted:record.remote&&!record.remote.deletedAt)
    .sort((a,b)=>((b.draft?.localEditedAt??b.remote?.updatedAt)??0)-((a.draft?.localEditedAt??a.remote?.updatedAt)??0)).slice(0,3);
  const emptyDiary = !agenda.length && !grades.length && !recent.length;

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
            {subject&&<button className="secondary-action" onClick={()=>onSubjectNotes(subject.id)}>{t("notes.forSubject",{name:subject.name})}</button>}
          </>
        ) : overdue.length ? (
          <div className="empty-hero">
            <h2>{t("home.noUpcoming")}</h2>
          </div>
        ) : (
          <div className="empty-hero">
            <h2>{emptyDiary ? t("home.start") : t("home.noUpcoming")}</h2>
            {emptyDiary && <p>{data.subjects.length ? t("home.firstValue") : t("home.firstSubjects")}</p>}
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

      {future.length > 1 && <section className="panel today-panel dashboard-upcoming">
        <div className="panel-title"><div><h3>{t("home.upcoming")}</h3></div><button aria-label={t("home.addActivity")} onClick={() => onAdd("agenda")}><Plus size={20} /></button></div>
        {future.slice(1, 4).map((item) => {
          const itemSubject = findSubject(data.subjects, item.subjectId);
          return <button className="activity-row" key={item.id} onClick={() => onNavigate("agenda", item.id)}><span className="subject-dot" style={{ background: itemSubject?.color ?? "var(--accent)" }} /><div><b>{item.title}</b><small>{itemSubject?.name ?? item.shared?.event.subject} · {formatDate(locale, item.dueAt)}</small></div><ChevronRight size={18} /></button>;
        })}
      </section>}

      {grades.length > 0 ? <button className="grade-summary" onClick={() => onNavigate("grades")}><span>{t("home.gradeSituation")}</span><strong>{t("home.average", { value: gradeText(locale, average) })}</strong><small>{selectPlural(locale, grades.length, t("home.gradeCountOne"), t("home.gradeCount", { count: grades.length }))} · {selectPlural(locale, gradedSubjects, t("home.subjectCountOne"), t("home.subjectCount", { count: gradedSubjects }))}</small><ChevronRight size={18} /></button> : !emptyDiary && <section className="grade-prompt"><div><b>{t("home.noGrades")}</b></div><button onClick={() => data.subjects.length ? onAdd("grade") : onManageSubjects()}>{data.subjects.length ? t("grades.add") : t("home.addSubject")}</button></section>}
      <section className="panel notes-home-card"><div className="panel-title"><div><h3>{t("notes.my")}</h3><p>{t(recent.length?"notes.resumeHelp":"notes.personalHelp")}</p></div><BookOpen size={22}/></div>{recent.length>0&&<div className="notes-recent-list">{recent.map(record=>{const note=(record.draft??record.remote)!;return <button className="notes-recent-row" key={record.id} onClick={()=>onResumeNote(record.id)}><div><b>{note.title||t("notes.untitled")}</b><small>{data.subjects.find(s=>s.id===note.subjectId)?.name||note.subjectName||t("notes.chooseSubject")}</small></div><ChevronRight size={18}/></button>;})}</div>}<div className="notes-actions"><button className="soft-button" onClick={onOpenNotes}>{t("notes.viewAll")}</button><button className="primary-button" onClick={onNewNote}><Plus size={17}/>{t("notes.new")}</button></div></section>
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
  onOpenNotes,
  onPersonal,
  pendingShared,
  blockedShared,
}: {
  items: AgendaDisplayItem[];
  focusItemId?: string | null;
  subjects: Subject[];
  onAdd: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onNotifications: () => void;
  onClasses: () => void;
  onOpenNotes: (item:AgendaDisplayItem) => void;
  onPersonal: (item: ClassSubscription) => void;
  pendingShared: (id: string) => boolean;
  blockedShared: (id: string) => boolean;
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
  const lastFocused=useRef<string|null|undefined>(undefined);
  useEffect(()=>{
    if(!focusedItem){lastFocused.current=undefined;return;}
    if(lastFocused.current===focusedItem.id)return;
    lastFocused.current=focusedItem.id;
    const date=new Date(focusedItem.dueAt);
    queueMicrotask(()=>{setMonth(new Date(date.getFullYear(),date.getMonth(),1));setSelectedDay(localDayKey(date));});
  },[focusedItem]);
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
          <button className="soft-button" onClick={onClasses}><UsersRound size={18} /> {t("agenda.openClasses")}</button>
          <button className="soft-button" onClick={onNotifications}>
            <Bell size={18} /> {t("agenda.reminders")}
          </button>
          <button className="primary-button" onClick={onAdd}>
            <Plus size={18} /> {subjects.length ? t("entry.newActivity") : t("home.addSubject")}
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
                onOpenNotes={onOpenNotes}
                pendingShared={pendingShared}
                blockedShared={blockedShared}
                focusItemId={focusItemId}
                compact
                emptyTitle={selectedDay ? t("agenda.emptyDay") : !allItems.length ? t("agenda.emptyTitle") : scope !== "all" && !items.length ? t("agenda.emptyFilter") : t("agenda.noOpen")}
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
            onOpenNotes={onOpenNotes}
            pendingShared={pendingShared}
            blockedShared={blockedShared}
            focusItemId={focusItemId}
            emptyTitle={scope === "all" ? t("agenda.emptyTitle") : t("agenda.emptyFilter")}
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
  onOpenNotes,
  pendingShared,
  blockedShared,
  focusItemId,
  compact = false,
  emptyTitle,
}: {
  items: AgendaDisplayItem[];
  subjects: Subject[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPersonal: (item: ClassSubscription) => void;
  onOpenNotes: (item:AgendaDisplayItem) => void;
  pendingShared: (id: string) => boolean;
  blockedShared: (id: string) => boolean;
  focusItemId?: string | null;
  compact?: boolean;
  emptyTitle: string;
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
                disabled={!!item.shared && (pendingShared(item.shared.id) || blockedShared(item.shared.id))}
                aria-busy={!!item.shared && pendingShared(item.shared.id)}
                aria-label={
                  item.shared && pendingShared(item.shared.id)
                    ? t("common.saving")
                    : item.completed
                    ? t("agenda.markTodo")
                    : t("agenda.markDone")
                }
                onClick={() => onToggle(item.id)}
              >
                {item.shared && pendingShared(item.shared.id) ? <Spinner aria-label={t("common.saving")} /> : item.completed && <Check size={15} />}
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
                {subject&&<button className="text-link agenda-notes-link" onClick={()=>onOpenNotes(item)}><BookOpen size={15}/>{t("notes.forSubject",{name:subject.name})}</button>}
                <small>
                  {item.kind === "test" ? t("entry.test") : t("entry.task")} ·{" "}
                  {intlDate(locale, item.dueAt, { hour: "2-digit", minute: "2-digit" })}
                  {item.reminder ? ` · ${t("agenda.reminderOpen")}` : ""}
                </small>
              </div>
              <button
                className="icon-button subtle"
                disabled={!!item.shared && (pendingShared(item.shared.id) || blockedShared(item.shared.id))}
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
          title={emptyTitle}
        />
      )}
    </section>
  );
}

function GradesView({
  subjects,
  grades,
  semesters,
  periods,
  scopeLabel,
  history,
  onShowHistory,
  goal,
  selectedId,
  onSelectSubject,
  onGoal,
  onAdd,
  onDelete,
  onOpenStats,
  onOpenNotes,
}: {
  subjects: Subject[];
  grades: Grade[];
  semesters: Semester[];
  periods: Semester[];
  scopeLabel: string;
  history: boolean;
  onShowHistory: () => void;
  goal: number;
  selectedId: string;
  onSelectSubject: (id: string) => void;
  onGoal: (value: number) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onOpenStats: () => void;
  onOpenNotes: (subjectId:string) => void;
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
          {!!subjects.length && <button className="grades-stats-link" onClick={()=>subject&&onOpenNotes(subject.id)}><BookOpen size={17}/>{t("notes.forSubject",{name:subject?.name??t("common.subject")})}</button>}
          {!!subjects.length && <button className="grades-stats-link" onClick={onOpenStats}><BarChart3 size={17} /> {t("grades.stats")}</button>}
          <button className="primary-button" onClick={onAdd}><Plus size={18} /> {subjects.length ? t("grades.add") : t("home.addSubject")}</button>
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
                <p className="scope-note">{scopeLabel} · {t("scope.count", { count: intlNumber(locale, subjectGrades.length) })}</p>
              </div>
              <div className="big-average" style={{ color: subject.color }}>
                {gradeText(locale, average)}
              </div>
            </div>
            <p className="scope-note">{t("scope.calculated")}</p>
            {periods.length > 1 && <div className="grade-period-summary" aria-label={t("scope.byPeriod")}>
              {periods.map((period) => {
                const values = subjectGrades.filter((grade) => grade.semesterId === period.id);
                return <div key={period.id}><span>{period.name} · {period.schoolYear}</span><b>{gradeText(locale, subjectAverage(subject, values))}</b><small>{t("scope.count", { count: intlNumber(locale, values.length) })}</small></div>;
              })}
            </div>}
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
                      {formatDate(locale, grade.date, { day: "numeric", month: "short", year: "numeric" })} · {t("grades.weight", { value: gradeText(locale, grade.weight) })}
                    </small>
                    <small>
                      {semesters.find((period) => period.id === grade.semesterId)?.name} · {semesters.find((period) => period.id === grade.semesterId)?.schoolYear}
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
                actionLabel={!history ? t("scope.showHistory") : undefined}
                onAction={!history ? onShowHistory : undefined}
              />
            )}
          </section>
          <aside className="panel simulator-card">
            {history ? <><h3>{t("grades.needed")}</h3><p className="scope-note">{t("scope.historySimulation")}</p></> : <>
            <p className="scope-note">{t("scope.simulation")}</p>
            <h3>{t("grades.needed")}</h3>
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
            </>}
          </aside>
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={t("grades.noSubject")}
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
  onSecurityChanged: (operation:"password"|"delete") => Promise<void>;
}) {
  const { t, locale } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="settings-dialog" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t("common.settings")}</DialogTitle>
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
                    {(subject.teacher || subject.coefficient !== 1) && <small>
                      {[subject.teacher, subject.coefficient !== 1 ? t("settings.coefficient", { value: intlNumber(locale, subject.coefficient) }) : null].filter(Boolean).join(" · ")}
                    </small>}
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
                <div>
                  <button className="soft-button" onClick={onExport}>
                    <Download /> {t("settings.export")} · {t("notes.backupComplete")}
                  </button>
                  <button className="soft-button" onClick={onImport}>
                    <Upload /> {t("settings.import")}
                  </button>
                </div>
                <details className="legacy-backup">
                  <summary>{t("settings.oldVersion")}</summary>
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
                    {t("settings.exportLegacy")}
                  </button>
                </details>
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
