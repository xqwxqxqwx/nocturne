import { useEffect, useRef, useState } from 'react';
import { createItem, deleteItem, updateItem, type ItemDraft } from '../db/actions';
import { addDays, fromMinutes, toMinutes, todayISO, weekdayMon, WEEKDAYS_SHORT } from '../domain/dates';
import type { Item, Reminder, Repeat } from '../domain/types';
import { needsTime } from '../notify/reminders';

interface Props {
  /** Новое дело (черновик) или редактирование существующего. */
  draft: ItemDraft;
  editing?: Item;
  onClose: () => void;
  onSaved?: (msg: string) => void;
}

const REMINDERS: [Reminder, string][] = [
  ['none', 'нет'],
  ['10m', '10 мин'],
  ['30m', '30 мин'],
  ['1h', '1 час'],
  ['morning', 'утром'],
];

const REPEATS: [Repeat['type'], string][] = [
  ['none', 'нет'],
  ['daily', 'каждый день'],
  ['weekdays', 'по будням'],
  ['weekly', 'по дням недели'],
  ['monthly', 'раз в месяц'],
];

export function ItemSheet({ draft: initial, editing, onClose, onSaved }: Props) {
  const [d, setD] = useState<ItemDraft>(initial);
  const titleRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<ItemDraft>) => setD((p) => ({ ...p, ...patch }));

  useEffect(() => {
    if (!editing) titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, onClose]);

  const today = todayISO();
  const isEvent = d.kind === 'event';
  const hasTime = !!d.start;

  const setKind = (kind: ItemDraft['kind']) => {
    if (kind === 'event') {
      const start = d.start ?? '09:00';
      set({ kind, start, end: d.end ?? fromMinutes(toMinutes(start) + 60), date: d.date ?? today });
    } else set({ kind, end: undefined });
  };

  const setStart = (start: string) => {
    if (!start) return set({ start: undefined, end: undefined, reminder: needsTime(d.reminder) ? 'none' : d.reminder });
    // сохраняем длительность события при сдвиге начала
    const dur = d.start && d.end ? toMinutes(d.end) - toMinutes(d.start) : 60;
    set({ start, end: isEvent ? fromMinutes(Math.min(toMinutes(start) + Math.max(dur, 15), 23 * 60 + 59)) : undefined });
  };

  const setRepeat = (type: Repeat['type']) => {
    if (type === 'weekly') {
      const base = d.date ?? today;
      set({ repeat: { type, days: d.repeat.type === 'weekly' ? d.repeat.days : [weekdayMon(base)] } });
    } else set({ repeat: { type } as Repeat });
  };

  const toggleDay = (i: number) => {
    if (d.repeat.type !== 'weekly') return;
    const days = d.repeat.days.includes(i) ? d.repeat.days.filter((x) => x !== i) : [...d.repeat.days, i].sort();
    set({ repeat: { type: 'weekly', days } });
  };

  const valid = d.title.trim().length > 0 && (!isEvent || (!!d.start && !!d.date)) && (d.repeat.type !== 'weekly' || d.repeat.days.length > 0);

  const save = async () => {
    if (!valid) return;
    const clean: ItemDraft = { ...d, title: d.title.trim(), note: d.note.trim() };
    if (isEvent && clean.start && (!clean.end || toMinutes(clean.end) <= toMinutes(clean.start))) {
      clean.end = fromMinutes(Math.min(toMinutes(clean.start) + 60, 23 * 60 + 59));
    }
    if (!clean.date) clean.repeat = { type: 'none' };
    if (needsTime(clean.reminder) && !clean.start) clean.reminder = 'none';
    if (editing) await updateItem(editing.id, clean);
    else await createItem(clean);
    onSaved?.(editing ? 'сохранено' : 'добавлено');
    onClose();
  };

  const remove = async () => {
    if (!editing) return;
    const msg = editing.repeat.type !== 'none' ? 'Удалить всю серию повторов?' : 'Удалить это дело?';
    if (!confirm(msg)) return;
    await deleteItem(editing.id);
    onSaved?.('удалено');
    onClose();
  };

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={editing ? 'Редактирование' : 'Новое дело'}>
        <div className="grab" />
        <h2>{editing ? 'правка' : 'новое дело'}</h2>

        <div className="field">
          <div className="seg stretch">
            <button className={!isEvent ? 'on' : ''} onClick={() => setKind('task')}>задача</button>
            <button className={isEvent ? 'on' : ''} onClick={() => setKind('event')}>событие</button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="f-title">название</label>
          <input
            id="f-title"
            ref={titleRef}
            className="input title"
            value={d.title}
            onChange={(e) => set({ title: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder={isEvent ? 'встреча, тренировка…' : 'что нужно сделать'}
            enterKeyHint="done"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <div className="lbl">{isEvent ? 'день' : 'срок'}</div>
          <div className="seg" style={{ marginBottom: 8 }}>
            <button className={d.date === today ? 'on' : ''} onClick={() => set({ date: today })}>сегодня</button>
            <button className={d.date === addDays(today, 1) ? 'on' : ''} onClick={() => set({ date: addDays(today, 1) })}>завтра</button>
            {!isEvent && (
              <button className={d.date === null ? 'on' : ''} onClick={() => set({ date: null, start: undefined, repeat: { type: 'none' } })}>без даты</button>
            )}
          </div>
          {d.date !== null && (
            <input type="date" className="input" value={d.date} onChange={(e) => e.target.value && set({ date: e.target.value })} aria-label="Дата" />
          )}
        </div>

        {d.date !== null && (
          <div className="field">
            <div className="lbl">{isEvent ? 'время' : 'время (необязательно)'}</div>
            {isEvent ? (
              <div className="two">
                <div>
                  <div className="sublbl">начало</div>
                  <input type="time" className="input" value={d.start ?? ''} onChange={(e) => setStart(e.target.value)} aria-label="Начало" />
                </div>
                <div>
                  <div className="sublbl">конец</div>
                  <input type="time" className="input" value={d.end ?? ''} onChange={(e) => set({ end: e.target.value || undefined })} aria-label="Конец" />
                </div>
              </div>
            ) : (
              <div className="two">
                <input type="time" className="input" value={d.start ?? ''} onChange={(e) => setStart(e.target.value)} aria-label="Срок до" />
                {hasTime && (
                  <button className="btn ghost" onClick={() => setStart('')}>
                    убрать время
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="field">
          <div className="lbl">приоритет</div>
          <div className="seg stretch">
            <button className={d.priority === 'normal' ? 'on' : ''} onClick={() => set({ priority: 'normal' })}>обычный</button>
            <button className={d.priority === 'important' ? 'on' : ''} onClick={() => set({ priority: 'important' })}>✝ важный</button>
          </div>
        </div>

        {d.date !== null && (
          <>
            <div className="field">
              <div className="lbl">напоминание</div>
              <div className="seg">
                {REMINDERS.map(([r, label]) => (
                  <button key={r} className={d.reminder === r ? 'on' : ''} disabled={needsTime(r) && !hasTime} onClick={() => set({ reminder: r })}>
                    {label}
                  </button>
                ))}
              </div>
              {!hasTime && <p className="note-s">«за N минут» доступно, если указать время</p>}
            </div>

            <div className="field">
              <div className="lbl">повтор</div>
              <div className="seg">
                {REPEATS.map(([r, label]) => (
                  <button key={r} className={d.repeat.type === r ? 'on' : ''} onClick={() => setRepeat(r)}>
                    {label}
                  </button>
                ))}
              </div>
              {d.repeat.type === 'weekly' && (
                <div className="seg days" style={{ marginTop: 8 }}>
                  {WEEKDAYS_SHORT.map((w, i) => (
                    <button key={w} className={d.repeat.type === 'weekly' && d.repeat.days.includes(i) ? 'on' : ''} onClick={() => toggleDay(i)}>
                      {w}
                    </button>
                  ))}
                </div>
              )}
              {editing && editing.repeat.type !== 'none' && <p className="note-s">изменения применятся ко всей серии</p>}
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="f-note">заметка</label>
          <textarea id="f-note" className="textarea" value={d.note} onChange={(e) => set({ note: e.target.value })} placeholder="пара слов на память" />
        </div>

        <div className="btn-row">
          {editing && (
            <button className="btn ghost" onClick={remove}>
              удалить
            </button>
          )}
          <button className="btn" onClick={onClose}>
            отмена
          </button>
          <button className="btn primary" onClick={save} disabled={!valid}>
            {editing ? 'сохранить' : 'добавить'}
          </button>
        </div>
      </div>
    </>
  );
}
