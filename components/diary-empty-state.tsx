import { CalendarDays, CheckCircle2 } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof CalendarDays;
  title: string;
  text: string;
}) {
  return (
    <div className="empty-state">
      <Icon />
      <b>{title}</b>
      <p>{text}</p>
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
