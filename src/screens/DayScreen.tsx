import { useActions } from '../actions-context';
import { Flourish, IconBack, IconNext, ThornDivider } from '../components/art';
import { EmptyDay, EmptyLine } from '../components/Empty';
import { OverdueRow, TaskRow, UndatedRow } from '../components/TaskRow';
import { Timeline } from '../components/Timeline';
import { addDays, fromISO, MONTHS, WEEKDAYS } from '../domain/dates';
import { occurrencesOn, overdue, undated } from '../domain/recurrence';
import type { ISODate, Item } from '../domain/types';

interface Props {
  date: ISODate;
  items: Item[];
  /** Открыт из недели/месяца — показываем «назад» и листание дней. */
  onBack?: () => void;
  onDate?: (d: ISODate) => void;
}

export function DayScreen({ date, items, onBack, onDate }: Props) {
  const { today, move } = useActions();
  const isToday = date === today;
  const d = fromISO(date);

  const occ = occurrencesOn(items, date);
  const events = occ.filter((o) => o.item.kind === 'event' && o.item.start);
  const tasks = occ.filter((o) => !(o.item.kind === 'event' && o.item.start));
  const late = isToday ? overdue(items, today) : [];
  const noDate = isToday ? undated(items).filter((i) => !i.done || (i.doneAt ?? 0) > Date.now() - 86_400_000) : [];

  const nothing = events.length === 0 && tasks.length === 0 && late.length === 0 && noDate.length === 0;
  const tasksLeft = tasks.filter((t) => !t.done).length;

  return (
    <div className="screen" key={date}>
      <div className="topbar">
        {onBack ? (
          <button className="icon-btn" onClick={onBack} aria-label="Назад">
            <IconBack />
          </button>
        ) : (
          <span className="mono dim" style={{ fontSize: 11, letterSpacing: '.25em' }}>{d.getFullYear()}</span>
        )}
        {onDate ? (
          <div style={{ display: 'flex' }}>
            <button className="icon-btn" onClick={() => onDate(addDays(date, -1))} aria-label="Предыдущий день">
              <IconBack />
            </button>
            <button className="icon-btn" onClick={() => onDate(addDays(date, 1))} aria-label="Следующий день">
              <IconNext />
            </button>
          </div>
        ) : (
          <span className="mono dim" style={{ fontSize: 11, letterSpacing: '.2em' }}>
            {tasks.length > 0 ? `${tasks.length - tasksLeft}/${tasks.length}` : ''}
          </span>
        )}
      </div>

      <header className="date-head">
        <Flourish className="flourish l" />
        <Flourish className="flourish r" />
        <div className="num">{d.getDate()}</div>
        <div className="wd">{WEEKDAYS[(d.getDay() + 6) % 7]}</div>
        <div className="mo">
          {MONTHS[d.getMonth()]}
          {isToday ? ' · сегодня' : ''}
        </div>
      </header>

      <ThornDivider />

      {late.length > 0 && (
        <section>
          <div className="section-title">
            <span>просрочено · {late.length}</span>
            {late.length > 1 && (
              <button className="act" onClick={() => late.forEach((i) => move(i, i.date, today))}>
                всё на сегодня
              </button>
            )}
          </div>
          <div className="list">
            {late.map((i) => (
              <OverdueRow key={i.id} item={i} />
            ))}
          </div>
        </section>
      )}

      {nothing ? (
        <EmptyDay date={date} isToday={isToday} />
      ) : (
        <>
          {events.length > 0 && (
            <section>
              <div className="section-title">
                <span>события</span>
              </div>
              <Timeline events={events} isToday={isToday} />
            </section>
          )}

          <section>
            <div className="section-title">
              <span>задачи</span>
            </div>
            {tasks.length > 0 ? (
              <div className="list">
                {tasks.map((o) => (
                  <TaskRow key={o.item.id + o.date} occ={o} />
                ))}
              </div>
            ) : (
              <EmptyLine text="задач нет. только время." />
            )}
            {tasks.length > 0 && tasksLeft === 0 && <EmptyDay date={date} isToday={isToday} allDone />}
          </section>

          {noDate.length > 0 && (
            <section>
              <div className="section-title">
                <span>без срока</span>
              </div>
              <div className="list">
                {noDate.map((i) => (
                  <UndatedRow key={i.id} item={i} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
