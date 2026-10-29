import { addDays, fromMinutes, toMinutes } from './dates';
import type { HHMM, ISODate, ItemKind, Priority } from './types';

export interface QuickResult {
  title: string;
  kind: ItemKind;
  date: ISODate;
  start?: HHMM;
  end?: HHMM;
  priority: Priority;
}

/**
 * Быстрый ввод одной строкой:
 *   «купить хлеб»            → задача на выбранный день
 *   «завтра позвонить маме»  → задача на завтра
 *   «18:30 зал»              → событие 18:30–19:30
 *   «отчёт!»                 → важная задача
 */
export function quickParse(input: string, baseDate: ISODate, today: ISODate): QuickResult {
  let text = ` ${input.trim()} `;
  let date = baseDate;
  let priority: Priority = 'normal';
  let start: HHMM | undefined;
  let end: HHMM | undefined;

  const dayWords: [RegExp, number][] = [
    [/\sпослезавтра\s/i, 2],
    [/\sзавтра\s/i, 1],
    [/\sсегодня\s/i, 0],
  ];
  for (const [re, n] of dayWords) {
    if (re.test(text)) {
      date = addDays(today, n);
      text = text.replace(re, ' ');
      break;
    }
  }

  const time = text.match(/\s(?:в\s)?([01]?\d|2[0-3])[:.]([0-5]\d)(?:\s?[-–—]\s?([01]?\d|2[0-3])[:.]([0-5]\d))?\s/);
  if (time) {
    start = `${time[1].padStart(2, '0')}:${time[2]}`;
    end = time[3] ? `${time[3].padStart(2, '0')}:${time[4]}` : fromMinutes(Math.min(toMinutes(start) + 60, 23 * 60 + 59));
    text = text.replace(time[0], ' ');
  }

  if (/!\s*$/.test(text.trim()) || /\s!\s/.test(text)) {
    priority = 'important';
    text = text.replace(/!+/g, ' ');
  }

  const title = text.replace(/\s+/g, ' ').trim();
  return { title: title || input.trim(), kind: start ? 'event' : 'task', date, start, end, priority };
}
