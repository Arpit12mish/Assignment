export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Used for the "Scheduled for"/"Deadline" fields on the add/edit task form — these can
// be set far in the past or future (unlike the task list's relative-feeling dates), so
// the year is worth showing, and dropping seconds keeps it from looking like a
// timestamp log rather than something a person picked.
export function formatFieldDateTime(date: Date): string {
  const datePart = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} · ${timePart}`;
}

export function timeUntil(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / 60000);
  const hours = Math.round(absMs / 3600000);
  const days = Math.round(absMs / 86400000);

  let label: string;
  if (minutes < 60) label = `${minutes}m`;
  else if (hours < 24) label = `${hours}h`;
  else label = `${days}d`;

  return diffMs < 0 ? `${label} overdue` : `in ${label}`;
}
