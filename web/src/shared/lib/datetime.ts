const TZ = 'Europe/Lisbon';

const dateTimeFmt = new Intl.DateTimeFormat('pt-PT', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TZ,
});

const dateFmt = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: TZ,
});

export function formatGameDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

/**
 * Converte um valor de <input type="datetime-local"> (hora local, sem fuso)
 * para ISO com fuso, para guardar em timestamptz.
 */
export function localInputToISO(localValue: string): string {
  return new Date(localValue).toISOString();
}

/** ISO → valor para <input type="datetime-local"> (hora local do browser). */
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
