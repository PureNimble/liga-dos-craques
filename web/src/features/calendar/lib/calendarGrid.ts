const TZ = 'Europe/Lisbon';
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** A single cell in a month grid. */
export interface CalendarDay {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
}

/** Formats an ISO datetime as its Lisbon-timezone calendar day key (YYYY-MM-DD). */
export function dayKey(iso: string): string {
  return dayKeyFmt.format(new Date(iso));
}

/** Builds a Monday-first, 6-week (42-day) grid covering the given month plus its leading/trailing days. */
export function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = (first.getUTCDay() + 6) % 7; // 0=Mon..6=Sun
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() - firstWeekday);

  const todayKey = dayKeyFmt.format(new Date());
  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = dayKeyFmt.format(d);
    days.push({ date: d, key, inMonth: d.getUTCMonth() === month - 1, isToday: key === todayKey });
  }
  return days;
}
