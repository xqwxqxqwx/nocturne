import Dexie, { type EntityTable } from 'dexie';
import { DEFAULT_SETTINGS, type DayNote, type Habit, type HabitLog, type Item, type Settings } from '../domain/types';

interface SettingsRow {
  key: 'settings';
  value: Settings;
}

class PlannerDB extends Dexie {
  items!: EntityTable<Item, 'id'>;
  settings!: EntityTable<SettingsRow, 'key'>;
  // этап 2
  habits!: EntityTable<Habit, 'id'>;
  habitLogs!: Dexie.Table<HabitLog, [string, string]>;
  dayNotes!: EntityTable<DayNote, 'date'>;

  constructor() {
    super('nocturne');
    this.version(1).stores({
      items: 'id, date, kind, updatedAt',
      settings: 'key',
      habits: 'id, createdAt',
      habitLogs: '[habitId+date], date',
      dayNotes: 'date',
    });
  }
}

export const db = new PlannerDB();

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get('settings');
  return { ...DEFAULT_SETTINGS, ...row?.value };
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await getSettings();
  await db.settings.put({ key: 'settings', value: { ...cur, ...patch } });
}

/** Просим браузер не вычищать данные при нехватке места. */
export function requestPersistence(): void {
  navigator.storage?.persist?.().catch(() => {});
}
