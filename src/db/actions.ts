import { db, getSettings } from './db';
import type { ISODate, Item, Occurrence } from '../domain/types';

export function uid(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type ItemDraft = Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'done' | 'doneDates' | 'skipDates' | 'doneAt'>;

export function blankDraft(date: ISODate | null): ItemDraft {
  return { kind: 'task', title: '', note: '', priority: 'normal', date, reminder: 'none', repeat: { type: 'none' } };
}

export async function createItem(draft: ItemDraft): Promise<Item> {
  const now = Date.now();
  const item: Item = { ...draft, id: uid(), done: false, doneDates: [], skipDates: [], createdAt: now, updatedAt: now };
  await db.items.add(item);
  return item;
}

export async function updateItem(id: string, patch: Partial<Item>): Promise<void> {
  await db.items.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteItem(id: string): Promise<void> {
  await db.items.delete(id);
}

export async function setDone(occ: Occurrence, done: boolean): Promise<void> {
  const { item, date } = occ;
  if (item.repeat.type === 'none') {
    await updateItem(item.id, { done, doneAt: done ? Date.now() : undefined });
  } else {
    const set = new Set(item.doneDates);
    if (done) set.add(date);
    else set.delete(date);
    await updateItem(item.id, { doneDates: [...set].sort() });
  }
}

/**
 * Перенести одно появление дела на другой день.
 * Для повторяющихся: этот день убирается из серии, на новый день создаётся разовая копия.
 */
export async function moveOccurrence(item: Item, fromDate: ISODate | null, toDate: ISODate): Promise<() => Promise<void>> {
  const snapshot = { ...item };
  const restore = () => db.items.put(snapshot).then(() => {});
  if (item.repeat.type === 'none' || !fromDate) {
    await updateItem(item.id, { date: toDate });
    return restore;
  }
  const copyId = await db.transaction('rw', db.items, async () => {
    await updateItem(item.id, { skipDates: [...new Set([...item.skipDates, fromDate])].sort() });
    const { id: _id, createdAt: _c, updatedAt: _u, done: _d, doneDates: _dd, skipDates: _s, doneAt: _da, ...rest } = item;
    return (await createItem({ ...rest, date: toDate, repeat: { type: 'none' } })).id;
  });
  return async () => {
    await db.items.delete(copyId);
    await restore();
  };
}

/* ── Экспорт / импорт ── */

export interface Backup {
  app: 'nocturne';
  version: 1;
  exportedAt: string;
  items: Item[];
  settings: Awaited<ReturnType<typeof getSettings>>;
  habits: unknown[];
  habitLogs: unknown[];
  dayNotes: unknown[];
}

export async function exportAll(): Promise<Backup> {
  return {
    app: 'nocturne',
    version: 1,
    exportedAt: new Date().toISOString(),
    items: await db.items.toArray(),
    settings: await getSettings(),
    habits: await db.habits.toArray(),
    habitLogs: await db.habitLogs.toArray(),
    dayNotes: await db.dayNotes.toArray(),
  };
}

/** Полностью заменяет данные содержимым резервной копии. */
export async function importAll(raw: unknown): Promise<number> {
  const data = raw as Partial<Backup>;
  if (!data || data.app !== 'nocturne' || !Array.isArray(data.items)) {
    throw new Error('Это не файл резервной копии Ноктюрна.');
  }
  const items = data.items.filter((i): i is Item => !!i && typeof i.id === 'string' && typeof i.title === 'string');
  await db.transaction('rw', [db.items, db.settings, db.habits, db.habitLogs, db.dayNotes], async () => {
    await Promise.all([db.items.clear(), db.habits.clear(), db.habitLogs.clear(), db.dayNotes.clear()]);
    // старые/неполные записи дополняем значениями по умолчанию
    await db.items.bulkAdd(items.map((i) => ({ ...i, doneDates: i.doneDates ?? [], skipDates: i.skipDates ?? [], note: i.note ?? '' })));
    if (data.settings) await db.settings.put({ key: 'settings', value: data.settings });
    if (Array.isArray(data.habits)) await db.habits.bulkPut(data.habits as never[]);
    if (Array.isArray(data.habitLogs)) await db.habitLogs.bulkPut(data.habitLogs as never[]);
    if (Array.isArray(data.dayNotes)) await db.dayNotes.bulkPut(data.dayNotes as never[]);
  });
  return items.length;
}
