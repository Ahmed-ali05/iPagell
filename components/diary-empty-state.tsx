import { CalendarDays, CheckCircle2 } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  text,
  actionLabel,
  onAction,
}: {
  icon: typeof CalendarDays;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <Icon />
      <b>{title}</b>
      <p>{text}</p>
      {actionLabel && onAction && (
        <button className="primary-button small" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
export function EmptyMini({ text }: { text: string }) {
  return (
    <div className="empty-mini">
      <CheckCircle2 />
      {text}
    </div>
  );
}
