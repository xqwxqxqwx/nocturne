import { useActions } from '../actions-context';
import { addDays, relativeLabel } from '../domain/dates';
import type { Item, Occurrence } from '../domain/types';
import { Cross, IconArrow, IconBell, IconCheck, IconClock, IconRepeat } from './art';
import { SwipeRow } from './SwipeRow';

export function Check({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button className={`check ${on ? 'on' : ''}`} onClick={onToggle} role="checkbox" aria-checked={on} aria-label={label}>
      <i>
        <IconCheck />
      </i>
    </button>
  );
}

function Meta({ item, showDate }: { item: Item; showDate?: string }) {
  const { today } = useActions();
  const parts = [];
  if (showDate) parts.push(<span key="d">{relativeLabel(showDate, today)}</span>);
  if (item.start)
    parts.push(
      <span key="t">
        <IconClock /> {item.kind === 'event' && item.end ? `${item.start}–${item.end}` : `до ${item.start}`}
      </span>,
    );
  if (item.repeat.type !== 'none') parts.push(<span key="r"><IconRepeat /></span>);
  if (item.reminder !== 'none') parts.push(<span key="b"><IconBell /></span>);
  if (item.note) parts.push(<span key="n">· заметка</span>);
  return parts.length ? <div className="meta">{parts}</div> : null;
}

/** Задача дня: чекбокс + свайпы (вправо — выполнено, влево — на завтра). */
export function TaskRow({ occ }: { occ: Occurrence }) {
  const { open, toggle, move } = useActions();
  const { item, date, done } = occ;
  const cls = `row ${done ? 'done' : ''} ${item.priority === 'important' ? 'important' : ''}`;
  return (
    <SwipeRow
      onRight={() => toggle(occ, true)}
      onLeft={done ? undefined : () => move(item, date, addDays(date, 1))}
      rightLabel={<><IconCheck className="sw-i" /> {done ? 'вернуть' : 'сделано'}</>}
      leftLabel={<>завтра <IconArrow className="sw-i" /></>}
    >
      <div className={cls}>
        <Check on={done} onToggle={() => toggle(occ)} label={item.title} />
        {item.priority === 'important' && !done && <Cross className="cross" />}
        <button className="body" onClick={() => open(item)}>
          <span className="title">{item.title}</span>
          <Meta item={item} />
        </button>
      </div>
    </SwipeRow>
  );
}

/** Задача без даты. */
export function UndatedRow({ item }: { item: Item }) {
  const { open, toggle, move, today } = useActions();
  const occ: Occurrence = { item, date: today, done: item.done };
  return (
    <SwipeRow
      onRight={() => toggle(occ, true)}
      onLeft={item.done ? undefined : () => move(item, null, today)}
      rightLabel={<><IconCheck className="sw-i" /> сделано</>}
      leftLabel={<>на сегодня <IconArrow className="sw-i" /></>}
    >
      <div className={`row ${item.done ? 'done' : ''} ${item.priority === 'important' ? 'important' : ''}`}>
        <Check on={item.done} onToggle={() => toggle(occ)} label={item.title} />
        <button className="body" onClick={() => open(item)}>
          <span className="title">{item.title}</span>
          <Meta item={item} />
        </button>
      </div>
    </SwipeRow>
  );
}

/** Просроченная задача: перенос одним касанием. */
export function OverdueRow({ item }: { item: Item }) {
  const { open, toggle, move, today } = useActions();
  const occ: Occurrence = { item, date: item.date!, done: false };
  return (
    <SwipeRow
      onRight={() => toggle(occ, true)}
      onLeft={() => move(item, item.date, addDays(today, 1))}
      rightLabel={<><IconCheck className="sw-i" /> сделано</>}
      leftLabel={<>завтра <IconArrow className="sw-i" /></>}
    >
      <div className={`row ${item.priority === 'important' ? 'important' : ''}`}>
        <Check on={false} onToggle={() => toggle(occ)} label={item.title} />
        <button className="body" onClick={() => open(item)}>
          <span className="title">{item.title}</span>
          <Meta item={item} showDate={item.date!} />
        </button>
        <div className="pill-btns">
          <button className="pill" onClick={() => move(item, item.date, today)}>сегодня</button>
          <button className="pill" onClick={() => move(item, item.date, addDays(today, 1))}>завтра</button>
        </div>
      </div>
    </SwipeRow>
  );
}
