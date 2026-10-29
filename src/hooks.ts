import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from './db/db';
import { DEFAULT_SETTINGS, type Item, type Settings } from './domain/types';
import { nowMinutes, todayISO } from './domain/dates';

/** Все дела (личный планер — их немного, держим в памяти целиком). */
export function useItems(): Item[] | undefined {
  return useLiveQuery(() => db.items.toArray(), []);
}

export function useSettings(): Settings {
  return useLiveQuery(getSettings, [], DEFAULT_SETTINGS);
}

/** Текущие дата и минута; обновляется раз в 30 с и при возврате в приложение. */
export function useClock(): { today: string; minutes: number } {
  const read = () => ({ today: todayISO(), minutes: nowMinutes() });
  const [state, setState] = useState(read);
  useEffect(() => {
    const tick = () =>
      setState((prev) => {
        const next = read();
        return next.today === prev.today && next.minutes === prev.minutes ? prev : next;
      });
    const t = setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return state;
}
