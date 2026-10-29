import type { HHMM, ISODate } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): ISODate {
  return toISO(new Date());
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function addMonths(s: ISODate, n: number): ISODate {
  const d = fromISO(s);
  return toISO(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

/** День недели, где 0 — понедельник, 6 — воскресенье. */
export function weekdayMon(s: ISODate): number {
  return (fromISO(s).getDay() + 6) % 7;
}

export function startOfWeek(s: ISODate): ISODate {
  return addDays(s, -weekdayMon(s));
}

export function startOfMonth(s: ISODate): ISODate {
  return s.slice(0, 8) + '01';
}

export function daysInMonth(s: ISODate): number {
  const d = fromISO(s);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function range(from: ISODate, count: number): ISODate[] {
  return Array.from({ length: count }, (_, i) => addDays(from, i));
}

export function toMinutes(t: HHMM): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(min: number): HHMM {
  const m = ((min % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** Локальный момент времени для даты и времени. */
export function at(date: ISODate, time: HHMM): Date {
  const d = fromISO(date);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export const WEEKDAYS = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
export const WEEKDAYS_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
export const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
export const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

/** «30 октября» */
export function formatDayMonth(s: ISODate): string {
  const d = fromISO(s);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

/** «сегодня» / «завтра» / «вчера» / «пт, 31 октября» */
export function relativeLabel(s: ISODate, today = todayISO()): string {
  if (s === today) return 'сегодня';
  if (s === addDays(today, 1)) return 'завтра';
  if (s === addDays(today, -1)) return 'вчера';
  return `${WEEKDAYS_SHORT[weekdayMon(s)]}, ${formatDayMonth(s)}`;
}
