import { describe, expect, it } from 'vitest';
import { occursOn, overdue, isDoneOn } from './recurrence';
import { quickParse } from './quickParse';
import { startOfWeek, weekdayMon } from './dates';
import type { Item, Repeat } from './types';

const make = (date: string | null, repeat: Repeat = { type: 'none' }, extra: Partial<Item> = {}): Item => ({
  id: 'x', kind: 'task', title: 't', note: '', priority: 'normal', date, reminder: 'none', repeat,
  done: false, doneDates: [], skipDates: [], createdAt: 0, updatedAt: 0, ...extra,
});

describe('даты', () => {
  it('неделя начинается с понедельника', () => {
    expect(weekdayMon('2026-10-26')).toBe(0); // пн
    expect(weekdayMon('2026-11-01')).toBe(6); // вс
    expect(startOfWeek('2026-11-01')).toBe('2026-10-26');
  });
});

describe('повторы', () => {
  it('разовое — только в свой день', () => {
    const i = make('2026-10-30');
    expect(occursOn(i, '2026-10-30')).toBe(true);
    expect(occursOn(i, '2026-10-31')).toBe(false);
  });
  it('каждый день — начиная с даты', () => {
    const i = make('2026-10-30', { type: 'daily' });
    expect(occursOn(i, '2026-10-29')).toBe(false);
    expect(occursOn(i, '2027-01-05')).toBe(true);
  });
  it('по будням', () => {
    const i = make('2026-10-26', { type: 'weekdays' });
    expect(occursOn(i, '2026-10-30')).toBe(true); // пт
    expect(occursOn(i, '2026-10-31')).toBe(false); // сб
  });
  it('по выбранным дням недели', () => {
    const i = make('2026-10-26', { type: 'weekly', days: [1, 3] }); // вт, чт
    expect(occursOn(i, '2026-10-27')).toBe(true);
    expect(occursOn(i, '2026-10-28')).toBe(false);
    expect(occursOn(i, '2026-10-29')).toBe(true);
  });
  it('раз в месяц, 31-е переезжает на последний день', () => {
    const i = make('2026-01-31', { type: 'monthly' });
    expect(occursOn(i, '2026-02-28')).toBe(true);
    expect(occursOn(i, '2026-03-31')).toBe(true);
    expect(occursOn(i, '2026-03-30')).toBe(false);
  });
  it('пропущенные и выполненные даты', () => {
    const i = make('2026-10-26', { type: 'daily' }, { skipDates: ['2026-10-28'], doneDates: ['2026-10-27'] });
    expect(occursOn(i, '2026-10-28')).toBe(false);
    expect(isDoneOn(i, '2026-10-27')).toBe(true);
    expect(isDoneOn(i, '2026-10-29')).toBe(false);
  });
  it('просроченные — только разовые невыполненные задачи прошлых дней', () => {
    const items = [
      make('2026-10-28', undefined, { id: 'a' }),
      make('2026-10-28', undefined, { id: 'b', done: true }),
      make('2026-10-28', { type: 'daily' }, { id: 'c' }),
      make('2026-10-30', undefined, { id: 'd' }),
      make(null, undefined, { id: 'e' }),
    ];
    expect(overdue(items, '2026-10-30').map((i) => i.id)).toEqual(['a']);
  });
});

describe('быстрый ввод', () => {
  const today = '2026-10-30';
  it('простая задача', () => {
    expect(quickParse('купить хлеб', today, today)).toMatchObject({ title: 'купить хлеб', kind: 'task', date: today });
  });
  it('завтра + важное', () => {
    expect(quickParse('завтра позвонить маме!', today, today)).toMatchObject({ title: 'позвонить маме', date: '2026-10-31', priority: 'important' });
  });
  it('время превращает в событие на час', () => {
    expect(quickParse('18:30 зал', today, today)).toMatchObject({ title: 'зал', kind: 'event', start: '18:30', end: '19:30' });
  });
  it('интервал времени', () => {
    expect(quickParse('встреча в 9:00-10:30', today, today)).toMatchObject({ title: 'встреча', start: '09:00', end: '10:30' });
  });
});
