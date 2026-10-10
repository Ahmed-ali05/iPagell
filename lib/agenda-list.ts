import type { AgendaDisplayItem } from "./classes/events";

export type AgendaGroupId = "overdue" | "today" | "upcoming" | "completed" | "cancelled";
export type AgendaGroups = Record<AgendaGroupId, AgendaDisplayItem[]>;

export function localAgendaDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isOpenActivity(item: AgendaDisplayItem): boolean {
  return !item.completed && item.shared?.event.status !== "cancelled";
}

export function orderAgendaItems(items: readonly AgendaDisplayItem[], newestFirst = false): AgendaDisplayItem[] {
  // Compare instants, not the spelling of ISO timestamps (offsets can differ in backups).
  return [...items].sort((a, b) => {
    const difference = Date.parse(a.dueAt) - Date.parse(b.dueAt);
    return (newestFirst ? -difference : difference) || a.id.localeCompare(b.id);
  });
}

export function groupAgendaItems(items: readonly AgendaDisplayItem[], now: Date): AgendaGroups {
  const groups: AgendaGroups = { overdue: [], today: [], upcoming: [], completed: [], cancelled: [] };
  const today = localAgendaDay(now);
  for (const item of orderAgendaItems(items)) {
    if (item.shared?.event.status === "cancelled") groups.cancelled.push(item);
    else if (item.completed) groups.completed.push(item);
    else {
      const day = localAgendaDay(new Date(item.dueAt));
      groups[day < today ? "overdue" : day === today ? "today" : "upcoming"].push(item);
    }
  }
  // No completion timestamp is stored: history is ordered by due date, never described as completion order.
  groups.completed = orderAgendaItems(groups.completed, true);
  groups.cancelled = orderAgendaItems(groups.cancelled, true);
  return groups;
}
