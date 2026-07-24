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

const dateShortFmt = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: 'short',
  timeZone: TZ,
});

/** Formats an ISO datetime as a short date + time string in the Europe/Lisbon timezone. */
export function formatGameDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

/** Formats an ISO datetime as a long date string in the Europe/Lisbon timezone. */
export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

/** Formats an ISO datetime as a short date (e.g. "17 jul."), for tight spaces. */
export function formatDateShort(iso: string): string {
  return dateShortFmt.format(new Date(iso));
}

/** Converts a `<input type="datetime-local">` value (local time, no offset) to a timezone-aware ISO string. */
export function localInputToISO(localValue: string): string {
  return new Date(localValue).toISOString();
}

/** Converts an ISO datetime to a value for `<input type="datetime-local">` (browser's local time). */
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/**
 * Formata data/hora consoante a linguagem selecionata useT (ver i18n/useT.tsx) - para mostrar no ecrã.
 * @param iso Data/hora em ISO (timestamptz)
 * @param lang Código da linguagem ('pt' ou 'en')
 * @returns Data/hora formatada consoante a linguagem
 */

export function formatGameDateTimeByLang(iso: string, lang: 'pt' | 'en'): string {
  const date = new Date(iso);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  };

  return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-PT' : 'en-US', options).format(date);
}
