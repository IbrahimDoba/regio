export interface EditLogEntry {
  ts: string;
  field: string;
  from: string | number | boolean | null;
  to: string | number | boolean | null;
}

const LOG_KEY = "regio_edit_log";

export function getEditLog(listingId: string): EditLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LOG_KEY);
    if (!stored) return [];
    return (JSON.parse(stored) as Record<string, EditLogEntry[]>)[listingId] ?? [];
  } catch {
    return [];
  }
}

export function appendEditLog(listingId: string, entries: EditLogEntry[]) {
  if (typeof window === "undefined" || entries.length === 0) return;
  try {
    const stored = localStorage.getItem(LOG_KEY);
    const all: Record<string, EditLogEntry[]> = stored ? JSON.parse(stored) : {};
    all[listingId] = [...(all[listingId] ?? []), ...entries];
    localStorage.setItem(LOG_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}
