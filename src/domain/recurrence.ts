import { daysInMonth, fromISO, toMinutes, weekdayMon } from './dates';
import type { ISODate, Item, Occurrence } from './types';

/** Происходит ли дело в этот день (без учёта выполнения). */
export function occursOn(item: Item, date: ISODate): boolean {
  if (!item.date) return false;
  if (item.repeat.type === 'none') return item.date === date;
  if (date < item.date || item.skipDates.includes(date)) return false;

  switch (item.repeat.type) {
    case 'daily':
      return true;
    case 'weekdays':
      return weekdayMon(date) < 5;
    case 'weekly':
      return item.repeat.days.includes(weekdayMon(date));
    case 'monthly': {
      // 31-е число в коротком месяце переезжает на последний день месяца
      const want = fromISO(item.date).getDate();
      const day = fromISO(date).getDate();
      return day === Math.min(want, daysInMonth(date));
    }
  }
}

export function isDoneOn(item: Item, date: ISODate): boolean {
  return item.repeat.type === 'none' ? item.done : item.doneDates.includes(date);
}

export function occurrencesOn(items: Item[], date: ISODate): Occurrence[] {
  const out: Occurrence[] = [];
  for (const item of items) {
    if (occursOn(item, date)) out.push({ item, date, done: isDoneOn(item, date) });
  }
  return out.sort(compareOccurrences);
}

/** Сначала по времени, потом важные, потом по созданию. Выполненные — вниз. */
export function compareOccurrences(a: Occurrence, b: Occurrence): number {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const ta = a.item.start ? toMinutes(a.item.start) : 1e4;
  const tb = b.item.start ? toMinutes(b.item.start) : 1e4;
  if (ta !== tb) return ta - tb;
  if (a.item.priority !== b.item.priority) return a.item.priority === 'important' ? -1 : 1;
  return a.item.createdAt - b.item.createdAt;
}

/** Невыполненные разовые задачи прошлых дней. */
export function overdue(items: Item[], today: ISODate): Item[] {
  return items
    .filter((i) => i.kind === 'task' && i.repeat.type === 'none' && !i.done && i.date !== null && i.date < today)
    .sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : a.createdAt - b.createdAt));
}

export function undated(items: Item[]): Item[] {
  return items.filter((i) => i.kind === 'task' && i.date === null).sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt);
}
