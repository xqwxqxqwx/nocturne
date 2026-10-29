import { useActions } from '../actions-context';
import { IconBack, IconNext, ThornDivider } from '../components/art';
import { addMonths, fromISO, MONTHS, range, startOfMonth, startOfWeek, WEEKDAYS_SHORT, weekdayMon } from '../domain/dates';
import { occurrencesOn } from '../domain/recurrence';
import type { ISODate, Item } from '../domain/types';

export function MonthScreen({ items, anchor, onAnchor }: { items: Item[]; anchor: ISODate; onAnchor: (d: ISODate) => void }) {
  const { today, openDay } = useActions();
  const first = startOfMonth(anchor);
  const month = first.slice(0, 7);
  const gridStart = startOfWeek(first);
  // 6 недель, если месяц не влезает в 5
  const cells = range(gridStart, 42);
  const weeks = cells[35].slice(0, 7) === month ? 42 : 35;
  const d = fromISO(first);
  const isCurrent = month === today.slice(0, 7);

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => onAnchor(addMonths(first, -1))} aria-label="Прошлый месяц">
          <IconBack />
        </button>
        {!isCurrent ? <button className="pill" onClick={() => onAnchor(today)}>к текущему</button> : <span />}
        <button className="icon-btn" onClick={() => onAnchor(addMonths(first, 1))} aria-label="Следующий месяц">
          <IconNext />
        </button>
      </div>
      <h1 className="page-title">{MONTHS[d.getMonth()]}</h1>
      <div className="page-sub">{d.getFullYear()}</div>
      <ThornDivider />

      <div className="month-grid">
        {WEEKDAYS_SHORT.map((w) => (
          <div key={w} className="wh">{w}</div>
        ))}
        {cells.slice(0, weeks).map((date) => {
          const occ = occurrencesOn(items, date).filter((o) => !o.done);
          const other = date.slice(0, 7) !== month;
          const cls = [
            'mcell',
            other && 'other',
            date === today && 'today',
            weekdayMon(date) >= 5 && 'weekend',
            occ.length > 0 && 'has',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button key={date} className={cls} onClick={() => openDay(date)} aria-label={`${date}, дел: ${occ.length}`}>
              <span>{fromISO(date).getDate()}</span>
              <span className="dots">
                {occ.slice(0, 3).map((o) => (
                  <i key={o.item.id} className={o.item.priority === 'important' ? 'imp' : ''} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
