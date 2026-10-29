/*
 * Напоминания через Notification API.
 * Бэкенда нет, поэтому push с сервера невозможен: напоминания срабатывают, пока приложение
 * открыто или висит в фоне (на iOS — только у установленного PWA, iOS 16.4+).
 * Любая ошибка здесь глушится: напоминание никогда не должно ломать приложение.
 */
import { addDays, at } from '../domain/dates';
import { occurrencesOn } from '../domain/recurrence';
import type { ISODate, Item, Reminder, Settings } from '../domain/types';

const FIRED_KEY = 'nocturne.fired';
const LOOKBACK = 10 * 60_000; // пропущенное не больше 10 минут назад ещё покажем
const MAX_DELAY = 2 ** 31 - 1;

let timers: number[] = [];

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function askPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

const OFFSETS: Record<Exclude<Reminder, 'none' | 'morning'>, number> = { '10m': 10, '30m': 30, '1h': 60 };

export function reminderTime(item: Item, date: ISODate, morning: string): Date | null {
  if (item.reminder === 'none') return null;
  if (item.reminder === 'morning') return at(date, morning);
  if (!item.start) return null;
  return new Date(at(date, item.start).getTime() - OFFSETS[item.reminder] * 60_000);
}

function readFired(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(FIRED_KEY) || '{}');
  } catch {
    return {};
  }
}

function markFired(key: string) {
  try {
    const fired = readFired();
    const weekAgo = Date.now() - 7 * 86_400_000;
    for (const k of Object.keys(fired)) if (fired[k] < weekAgo) delete fired[k];
    fired[key] = Date.now();
    localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
  } catch {
    /* хранилище недоступно — переживём */
  }
}

async function show(item: Item, date: ISODate) {
  const body = item.start ? `${item.start}${item.end && item.kind === 'event' ? '–' + item.end : ''}` : 'сегодня';
  const opts: NotificationOptions = { body, icon: './icons/icon-192.png', badge: './icons/icon-192.png', tag: `${item.id}:${date}` };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return void (await reg.showNotification(item.title, opts));
    new Notification(item.title, opts);
  } catch {
    /* Android Chrome без SW бросает на new Notification — просто молчим */
  }
}

export function scheduleReminders(items: Item[], settings: Settings, today: ISODate): void {
  timers.forEach(clearTimeout);
  timers = [];
  if (!settings.notifications || permission() !== 'granted') return;

  const now = Date.now();
  const fired = readFired();
  for (const date of [today, addDays(today, 1)]) {
    for (const occ of occurrencesOn(items, date)) {
      if (occ.done) continue;
      const when = reminderTime(occ.item, date, settings.morningTime);
      if (!when) continue;
      const key = `${occ.item.id}:${date}:${occ.item.reminder}:${occ.item.start ?? ''}`;
      if (fired[key]) continue;
      const delay = when.getTime() - now;
      if (delay < -LOOKBACK) continue;
      const fire = () => {
        markFired(key);
        void show(occ.item, date);
      };
      if (delay <= 0) fire();
      else if (delay < MAX_DELAY) timers.push(window.setTimeout(fire, delay));
    }
  }
}

/** Подпись для списка: «за 10 мин», «утром». */
export const REMINDER_LABEL: Record<Reminder, string> = {
  none: 'нет',
  '10m': 'за 10 мин',
  '30m': 'за 30 мин',
  '1h': 'за 1 час',
  morning: 'утром',
};

export function needsTime(r: Reminder): boolean {
  return r !== 'none' && r !== 'morning';
}
