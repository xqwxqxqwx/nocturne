import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionsContext, type AppActions } from './actions-context';
import { useBackClose } from './backStack';
import { IconPlus } from './components/art';
import { ItemSheet } from './components/ItemSheet';
import { Nav, type Tab } from './components/Nav';
import { QuickAdd } from './components/QuickAdd';
import { blankDraft, moveOccurrence, setDone, type ItemDraft } from './db/actions';
import { relativeLabel } from './domain/dates';
import type { Item } from './domain/types';
import { useClock, useItems, useSettings } from './hooks';
import { scheduleReminders } from './notify/reminders';
import { DayScreen } from './screens/DayScreen';
import { MonthScreen } from './screens/MonthScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { WeekScreen } from './screens/WeekScreen';

interface Toast {
  id: number;
  text: string;
  undo?: () => Promise<void>;
}

export function App() {
  const items = useItems();
  const settings = useSettings();
  const { today, minutes } = useClock();

  const [tab, setTab] = useState<Tab>('today');
  const [day, setDay] = useState<string | null>(null);
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [monthAnchor, setMonthAnchor] = useState(today);
  const [sheet, setSheet] = useState<{ draft: ItemDraft; editing?: Item } | null>(null);
  const [quick, setQuick] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number>(0);

  const closeSheet = useCallback(() => setSheet(null), []);
  const closeQuick = useCallback(() => setQuick(false), []);
  const closeDay = useCallback(() => setDay(null), []);
  useBackClose(day !== null, closeDay);
  useBackClose(quick, closeQuick);
  useBackClose(sheet !== null, closeSheet);

  const notify = useCallback((text: string, undo?: () => Promise<void>) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, undo });
    toastTimer.current = window.setTimeout(() => setToast(null), undo ? 5000 : 2400);
  }, []);

  // убрать сплэш после первой загрузки данных
  useEffect(() => {
    if (!items) return;
    const s = document.getElementById('splash');
    s?.classList.add('gone');
    const t = setTimeout(() => s?.remove(), 500);
    return () => clearTimeout(t);
  }, [items]);

  useEffect(() => {
    if (items) scheduleReminders(items, settings, today);
  }, [items, settings, today, minutes]);

  const actions = useMemo<AppActions>(
    () => ({
      today,
      minutes,
      open: (item) => {
        const { id: _i, createdAt: _c, updatedAt: _u, done: _d, doneAt: _da, doneDates: _dd, skipDates: _s, ...draft } = item;
        setSheet({ draft, editing: item });
      },
      create: (date, kind = 'task') => setSheet({ draft: { ...blankDraft(date), kind } }),
      toggle: (occ, viaSwipe) => {
        void setDone(occ, !occ.done);
        if (viaSwipe) notify(occ.done ? 'возвращено' : 'выполнено', () => setDone(occ, occ.done));
      },
      move: (item, from, to) => {
        void moveOccurrence(item, from, to).then((undo) => notify(`перенесено · ${relativeLabel(to, today)}`, undo));
      },
      openDay: (date) => setDay(date),
    }),
    [today, minutes, notify],
  );

  const goTab = (t: Tab) => {
    setDay(null);
    setTab(t);
    if (t === 'week') setWeekAnchor(today);
    if (t === 'month') setMonthAnchor(today);
    window.scrollTo({ top: 0 });
  };

  const baseDate = day ?? today;

  let screen;
  if (!items) screen = null;
  else if (day) screen = <DayScreen date={day} items={items} onBack={closeDay} onDate={setDay} />;
  else if (tab === 'today') screen = <DayScreen date={today} items={items} />;
  else if (tab === 'week') screen = <WeekScreen items={items} anchor={weekAnchor} onAnchor={setWeekAnchor} />;
  else if (tab === 'month') screen = <MonthScreen items={items} anchor={monthAnchor} onAnchor={setMonthAnchor} />;
  else screen = <SettingsScreen settings={settings} items={items} notify={notify} />;

  return (
    <ActionsContext.Provider value={actions}>
      {settings.grain && <div className="grain" aria-hidden="true" />}
      <div className="vignette" aria-hidden="true" />

      <main className="app">{screen}</main>

      {(tab !== 'settings' || day) && !quick && !sheet && (
        <button className="fab" onClick={() => setQuick(true)} aria-label="Добавить">
          <IconPlus />
        </button>
      )}

      <Nav tab={day ? (tab === 'today' ? 'today' : tab) : tab} onTab={goTab} />

      {quick && (
        <QuickAdd
          date={baseDate}
          today={today}
          onClose={closeQuick}
          onAdded={(m) => notify(m)}
          onExpand={(text) => {
            setQuick(false);
            setSheet({ draft: { ...blankDraft(baseDate), title: text.trim() } });
          }}
        />
      )}

      {sheet && <ItemSheet draft={sheet.draft} editing={sheet.editing} onClose={closeSheet} onSaved={(m) => notify(m)} />}

      {toast && (
        <div className="toast" key={toast.id} role="status">
          <span>{toast.text}</span>
          {toast.undo && (
            <button
              onClick={() => {
                void toast.undo!();
                setToast(null);
              }}
            >
              отменить
            </button>
          )}
        </div>
      )}
    </ActionsContext.Provider>
  );
}
