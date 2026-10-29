import { useActions } from '../actions-context';
import { IconBack, IconNext, ThornDivider } from '../components/art';
import { addDays, formatDayMonth, fromISO, range, startOfWeek, WEEKDAYS, WEEKDAYS_SHORT } from '../domain/dates';
import { occurrencesOn } from '../domain/recurrence';
import type { ISODate, Item } from '../domain/types';

const LOAD_MAX = 6;

function plural(n: number) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'дело';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дела';
  return 'дел';
}

export function WeekScreen({ items, anchor, onAnchor }: { items: Item[]; anchor: ISODate; onAnchor: (d: ISODate) => void }) {
  const { today, openDay } = useActions();
  const start = startOfWeek(anchor);
  const days = range(start, 7);
  const end = days[6];
  const isCurrent = start === startOfWeek(today);

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => onAnchor(addDays(start, -7))} aria-label="Прошлая неделя">
          <IconBack />
        </button>
        {!isCurrent ? (
          <button className="pill" onClick={() => onAnchor(today)}>к текущей</button>
        ) : (
          <span />
        )}
        <button className="icon-btn" onClick={() => onAnchor(addDays(start, 7))} aria-label="Следующая неделя">
          <IconNext />
        </button>
      </div>
      <h1 className="page-title">неделя</h1>
      <div className="page-sub">
        {formatDayMonth(start)} — {formatDayMonth(end)}
      </div>
      <ThornDivider />

      <div className="week">
        {days.map((date, i) => {
          const occ = occurrencesOn(items, date);
          const done = occ.filter((o) => o.done).length;
          const total = occ.length;
          const load = Math.min(LOAD_MAX, total - done);
          const d = fromISO(date);
          const cls = `wday ${date === today ? 'today' : ''} ${date < today ? 'past' : ''}`;
          return (
            <button key={date} className={cls} onClick={() => openDay(date)}>
              <div className="d">
                <b>{d.getDate()}</b>
                <small>{WEEKDAYS_SHORT[i]}</small>
              </div>
              <div className="info">
                <div className="name">{date === today ? 'сегодня' : WEEKDAYS[i]}</div>
                <div className="cnt">
                  {total === 0 ? 'пусто' : `${total} ${plural(total)}${done ? ` · сделано ${done}` : ''}`}
                </div>
                {total > 0 && <div className="peek">{occ.filter((o) => !o.done).slice(0, 3).map((o) => o.item.title).join(' · ')}</div>}
              </div>
              <div className="load" aria-label={`загруженность ${load} из ${LOAD_MAX}`}>
                {Array.from({ length: LOAD_MAX }, (_, k) => (
                  <i key={k} className={k < load ? 'on' : ''} style={{ height: 8 + k * 2.8 }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
