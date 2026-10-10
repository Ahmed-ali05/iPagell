"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bell, BookOpen, CalendarDays, Check, ChevronRight, Settings2, Trash2 } from "lucide-react";
import { ActionMenu } from "@/components/action-menu";
import { EmptyState } from "@/components/diary-empty-state";
import { useI18n } from "@/components/i18n-provider";
import { Spinner } from "@/components/ui/spinner";
import { groupAgendaItems, localAgendaDay, type AgendaGroupId } from "@/lib/agenda-list";
import { formatDate, formatNumber, selectPlural, type MessageKey } from "@/lib/i18n";
import type { AgendaDisplayItem, ClassSubscription } from "@/lib/classes/events";
import type { Subject } from "@/types/domain";

const groupLabels: Record<AgendaGroupId, MessageKey> = {
  overdue: "agenda.overdue", today: "agenda.today", upcoming: "agenda.upcoming",
  completed: "agenda.completed", cancelled: "agenda.cancelled",
};
const openGroups = ["overdue", "today", "upcoming"] as const;
const closedGroups = ["completed", "cancelled"] as const;

export function AgendaList({ items, subjects, onToggle, onDelete, onPersonal, onOpenNotes,
  pendingShared, blockedShared, focusItemId, compact = false, emptyTitle, heading, totalOpen, truncated = false, onShowAll,
}: {
  items: AgendaDisplayItem[];
  subjects: Subject[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPersonal: (item: ClassSubscription) => void;
  onOpenNotes: (item: AgendaDisplayItem) => void;
  pendingShared: (id: string) => boolean;
  blockedShared: (id: string) => boolean;
  focusItemId?: string | null;
  compact?: boolean;
  emptyTitle: string;
  heading?: string;
  totalOpen?: number;
  truncated?: boolean;
  onShowAll?: () => void;
}) {
  const { locale, t } = useI18n();
  const id = useId();
  const list = useRef<HTMLElement>(null);
  const lastFocus = useRef<string | null | undefined>(undefined);
  const toggleFocus = useRef<{ id: string; completed: boolean; nextId?: string; source: HTMLButtonElement } | null>(null);
  const [expanded, setExpanded] = useState({ completed: false, cancelled: false });
  const [day, setDay] = useState(() => new Date());
  useEffect(() => {
    // An agenda left open overnight must not keep yesterday's groups.
    const refresh = () => setDay(current => localAgendaDay(current) === localAgendaDay(new Date()) ? current : new Date());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  const groups = groupAgendaItems(items, day);
  const pending = openGroups.flatMap(group => groups[group]);
  useEffect(() => {
    if (!focusItemId) { lastFocus.current = null; return; }
    if (lastFocus.current === focusItemId) return;
    const item = items.find(item => item.id === focusItemId);
    if (!item) return;
    lastFocus.current = focusItemId;
    const group = item.shared?.event.status === "cancelled" ? "cancelled" : item.completed ? "completed" : null;
    if (group) queueMicrotask(() => setExpanded(current => ({ ...current, [group]: true })));
  }, [focusItemId, items]);
  useEffect(() => {
    const request = toggleFocus.current;
    if (!request) return;
    const changed = items.find(item => item.id === request.id);
    if (!changed || changed.completed === request.completed) return;
    toggleFocus.current = null;
    // A late class acknowledgement must not take focus away from another control or view.
    if (list.current?.closest("[hidden]") || (document.activeElement !== request.source && document.activeElement !== document.body)) return;
    const targetId = changed.completed ? request.nextId : request.id;
    const row = Array.from(list.current?.querySelectorAll<HTMLElement>("[data-agenda-id]") ?? []).find(row => row.dataset.agendaId === targetId);
    const preferred = row?.querySelector<HTMLButtonElement>(".round-check");
    const target = preferred && !preferred.disabled ? preferred : list.current?.querySelector<HTMLButtonElement>('.agenda-group .round-check:not(:disabled)') ?? list.current?.querySelector<HTMLButtonElement>('[data-history="completed"]');
    target?.focus({ preventScroll: true });
  }, [items]);

  const countLabel = (name: string, count: number) => t("agenda.groupCount", { name, count: formatNumber(locale, count), unit: t(selectPlural(locale, count, "agenda.itemOne", "agenda.itemMany")) });

  function renderItem(item: AgendaDisplayItem) {
    const subject = subjects.find(subject => subject.id === item.subjectId);
    const cancelled = item.shared?.event.status === "cancelled";
    const saving = !!item.shared && pendingShared(item.shared.id);
    const blocked = !!item.shared && blockedShared(item.shared.id);
    const position = pending.findIndex(candidate => candidate.id === item.id);
    return <article key={item.id} data-agenda-id={item.id}
      className={`agenda-row${item.completed ? " completed" : ""}${cancelled ? " cancelled" : ""}${item.id === focusItemId ? " home-focus" : ""}`}
      id={item.id === focusItemId ? "home-focused-agenda-item" : undefined} aria-current={item.id === focusItemId ? "location" : undefined}>
      <button type="button" className="round-check" disabled={saving || blocked || cancelled} aria-busy={saving}
        aria-pressed={item.completed} aria-label={t(saving ? "common.saving" : item.completed ? "agenda.markTodo" : "agenda.markDone") + `: ${item.title}`}
        onClick={event => { toggleFocus.current = { source: event.currentTarget, id: item.id, completed: item.completed, nextId: pending[position + 1]?.id ?? pending[position - 1]?.id }; onToggle(item.id); }}>
        {saving ? <Spinner aria-label={t("common.saving")} /> : item.completed && <Check size={17} aria-hidden="true" />}
      </button>
      <div className="agenda-row-copy">
        <h4>{item.title}</h4>
        <div className="agenda-row-meta">
          <span className="agenda-row-subject"><i className="subject-dot" style={{ background: subject?.color ?? "#7772d5" }} aria-hidden="true" />{subject?.name ?? item.shared?.event.subject}</span>
          <span>{item.kind === "test" ? t("entry.test") : t("entry.task")}</span>
          <time dateTime={item.dueAt}>{formatDate(locale, item.dueAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
          {item.shared && <span>{t(item.shared.detachedAt ? "agenda.personalOrigin" : "agenda.classOrigin")} · {item.shared.event.className}</span>}
          {item.reminder && <span className="agenda-reminder" title={t("agenda.reminderOpen")} aria-label={t("agenda.reminderOpen")}><Bell size={14} aria-hidden="true" /></span>}
        </div>
        <div className="agenda-row-links">
          {subject && <button type="button" className="text-link agenda-notes-link" aria-label={t("notes.forSubject", { name: subject.name })} onClick={() => onOpenNotes(item)}><BookOpen size={15} aria-hidden="true" />{t("notes.shortLabel")}</button>}
          {item.description && <details className="agenda-row-details"><summary><ChevronRight size={14} aria-hidden="true" />{t("common.details")}</summary><p>{item.description}</p></details>}
        </div>
      </div>
      <ActionMenu label={t("common.moreFor", { name: item.title })} items={[
        ...(item.shared ? [{ label: t("agenda.personalSettings"), icon: Settings2, onSelect: () => onPersonal(item.shared!), disabled: saving || blocked }] : []),
        { label: t(item.shared ? "agenda.removeShared" : "agenda.deleteActivity"), icon: Trash2, danger: true, disabled: saving || blocked, onSelect: () => onDelete(item.id) },
      ]} />
    </article>;
  }

  const count = totalOpen ?? pending.length;
  const countText = truncated ? t("agenda.visibleCount", { shown: formatNumber(locale, pending.length), total: formatNumber(locale, count) }) : formatNumber(locale, count);

  return <section ref={list} className={`panel agenda-list agenda-organized${compact ? " compact" : ""}`} aria-label={heading ?? t("agenda.list")}>
    <div className="agenda-list-heading"><h3>{heading ?? t("agenda.todo")}</h3><span aria-label={countLabel(heading ?? t("agenda.todo"), count)}>{countText}</span></div>
    {!items.length ? <EmptyState icon={CalendarDays} title={emptyTitle} /> : <>
      {!pending.length && <p className="agenda-no-open">{t("agenda.noOpen")}</p>}
      {openGroups.map(group => groups[group].length > 0 && <section className={`agenda-group ${group}`} key={group} aria-labelledby={`${id}-${group}`}>
        <h4 className="agenda-group-heading" id={`${id}-${group}`}>{t(groupLabels[group])}<span>{formatNumber(locale, groups[group].length)}</span></h4>
        {groups[group].map(renderItem)}
      </section>)}
      {closedGroups.map(group => {
        if (!groups[group].length) return null;
        const show = expanded[group];
        return <section className="agenda-history" key={group}>
          <button type="button" className="agenda-history-toggle" data-history={group} aria-label={countLabel(t(groupLabels[group]), groups[group].length)} aria-expanded={show} aria-controls={`${id}-${group}`}
            onClick={() => setExpanded(current => ({ ...current, [group]: !show }))}>
            <ChevronRight size={16} aria-hidden="true" /><span>{t(groupLabels[group])}</span><b>{formatNumber(locale, groups[group].length)}</b>
          </button>
          <div id={`${id}-${group}`} hidden={!show}>{show && groups[group].map(renderItem)}</div>
        </section>;
      })}
    </>}
    {truncated && onShowAll && <button type="button" className="text-link agenda-show-all" onClick={onShowAll}>{t("agenda.showAllActivities")}<ChevronRight size={16} aria-hidden="true" /></button>}
  </section>;
}
