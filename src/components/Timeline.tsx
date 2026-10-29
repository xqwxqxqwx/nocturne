import { useActions } from '../actions-context';
import { fromMinutes, toMinutes } from '../domain/dates';
import type { Occurrence } from '../domain/types';

const HOUR = 56; // px на час
const LABEL_W = 44;
const MIN_H = 34;

interface Placed {
  occ: Occurrence;
  start: number;
  end: number;
  col: number;
  cols: number;
}

/** Раскладка пересекающихся событий по колонкам. */
function layout(events: Occurrence[]): Placed[] {
  const list = events
    .map((occ) => {
      const start = toMinutes(occ.item.start!);
      let end = occ.item.end ? toMinutes(occ.item.end) : start + 60;
      if (end <= start) end = start + 30;
      return { occ, start, end, col: 0, cols: 1 };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  let group: Placed[] = [];
  let groupEnd = -1;
  const flush = () => {
    const cols = Math.max(1, ...group.map((p) => p.col + 1));
    group.forEach((p) => (p.cols = cols));
    group = [];
  };
  for (const p of list) {
    if (p.start >= groupEnd) {
      flush();
      groupEnd = -1;
    }
    const taken = new Set(group.filter((g) => g.end > p.start).map((g) => g.col));
    let c = 0;
    while (taken.has(c)) c++;
    p.col = c;
    group.push(p);
    groupEnd = Math.max(groupEnd, p.end);
  }
  flush();
  return list;
}

export function Timeline({ events, isToday }: { events: Occurrence[]; isToday: boolean }) {
  const { open, minutes } = useActions();
  const placed = layout(events);

  // показываем только нужный отрезок дня: от первого дела (или «сейчас») до последнего, с запасом
  let lo = Math.min(...placed.map((p) => p.start));
  let hi = Math.max(...placed.map((p) => p.end));
  // «сейчас» расширяет отрезок, только если оно рядом с делами — иначе ночью получим 18 пустых часов
  if (isToday && minutes >= lo - 120 && minutes <= hi + 120) {
    lo = Math.min(lo, minutes);
    hi = Math.max(hi, minutes);
  }
  let h0 = Math.max(0, Math.floor(lo / 60) - 1);
  let h1 = Math.min(24, Math.ceil(hi / 60) + 1);
  while (h1 - h0 < 4) h1 < 24 ? h1++ : h0--;

  const y = (min: number) => ((min - h0 * 60) / 60) * HOUR;
  const height = (h1 - h0) * HOUR;
  const hours = Array.from({ length: h1 - h0 + 1 }, (_, i) => h0 + i);

  return (
    <div className="timeline" style={{ height: height + 8 }}>
      {hours.map((h) => (
        <div key={h} className="tl-hour" style={{ top: y(h * 60) }}>
          <span>{String(h % 24).padStart(2, '0')}:00</span>
        </div>
      ))}
      {placed.map(({ occ, start, end, col, cols }) => {
        const top = y(start) + 1;
        const h = Math.max(MIN_H, y(end) - y(start) - 3);
        const past = isToday && end <= minutes;
        const w = `(100% - ${LABEL_W}px) / ${cols}`;
        return (
          <button
            key={occ.item.id}
            className={`tl-event ${occ.item.priority === 'important' ? 'important' : ''} ${past ? 'past' : ''}`}
            style={{ top, height: h, left: `calc(${LABEL_W}px + ${w} * ${col})`, width: `calc(${w} - 4px)` }}
            onClick={() => open(occ.item)}
          >
            <div className="t">{occ.item.title}</div>
            {h >= 44 && (
              <div className="time">
                {fromMinutes(start)}–{fromMinutes(end)}
              </div>
            )}
          </button>
        );
      })}
      {isToday && minutes >= h0 * 60 && minutes <= h1 * 60 && (
        <div className="tl-now" style={{ top: y(minutes) }} aria-label={`сейчас ${fromMinutes(minutes)}`}>
          <span>{fromMinutes(minutes)}</span>
        </div>
      )}
    </div>
  );
}
