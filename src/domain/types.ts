/** Дата без времени в локальной зоне: 'YYYY-MM-DD'. */
export type ISODate = string;
/** Время 24ч: 'HH:MM'. */
export type HHMM = string;

export type ItemKind = 'event' | 'task';
export type Priority = 'normal' | 'important';
export type Reminder = 'none' | '10m' | '30m' | '1h' | 'morning';

export type Repeat =
  | { type: 'none' }
  | { type: 'daily' }
  | { type: 'weekdays' }
  /** days: 0 = понедельник … 6 = воскресенье */
  | { type: 'weekly'; days: number[] }
  | { type: 'monthly' };

export interface Item {
  id: string;
  kind: ItemKind;
  title: string;
  note: string;
  priority: Priority;
  /** День дела (для повторов — дата начала серии). null — задача без даты. */
  date: ISODate | null;
  /** Событие: начало/конец. Задача: необязательное время дедлайна. */
  start?: HHMM;
  end?: HHMM;
  reminder: Reminder;
  repeat: Repeat;
  /** Разовая задача выполнена. */
  done: boolean;
  doneAt?: number;
  /** Повторяющиеся: даты выполненных повторов. */
  doneDates: ISODate[];
  /** Повторяющиеся: даты, убранные из серии (например, перенесённые). */
  skipDates: ISODate[];
  createdAt: number;
  updatedAt: number;
}

/** Конкретное появление дела в конкретный день. */
export interface Occurrence {
  item: Item;
  date: ISODate;
  done: boolean;
}

export interface Settings {
  /** Время утреннего напоминания «утром в день дела». */
  morningTime: HHMM;
  notifications: boolean;
  grain: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  morningTime: '09:00',
  notifications: false,
  grain: true,
};

/* ── Этап 2: таблицы заведены в базе заранее, UI появится позже ── */
export interface Habit {
  id: string;
  title: string;
  /** В какие дни недели ожидается (0 = пн). Пусто — каждый день. */
  days: number[];
  createdAt: number;
  archived: boolean;
}

export interface HabitLog {
  habitId: string;
  date: ISODate;
}

export interface DayNote {
  date: ISODate;
  text: string;
  updatedAt: number;
}
