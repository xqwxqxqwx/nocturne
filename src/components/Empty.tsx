import { CatScene } from './art';

const TODAY_PHRASES = [
  'тишина. дел на сегодня нет.',
  'ночь пуста. можно просто быть.',
  'ни одного дела. только кот и луна.',
  'свободный день. редкая роскошь.',
  'всё спокойно. свет выключен.',
];

const DAY_PHRASES = ['в этот день тихо.', 'пусто. как в комнате без ламп.', 'ни одного дела.'];

/** Фраза выбирается по дате — в течение дня не скачет. */
function pick(list: string[], seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return list[Math.abs(h) % list.length];
}

export function EmptyDay({ date, isToday, allDone }: { date: string; isToday: boolean; allDone?: boolean }) {
  return (
    <div className="empty">
      <CatScene variant={allDone ? 'sleep' : 'sit'} />
      <div className="phrase">{allDone ? 'всё сделано. кот спит.' : pick(isToday ? TODAY_PHRASES : DAY_PHRASES, date)}</div>
      {!allDone && <div className="sub">нажми «+», чтобы добавить дело</div>}
    </div>
  );
}

export function EmptyLine({ text }: { text: string }) {
  return (
    <div className="empty small">
      <div className="phrase">{text}</div>
    </div>
  );
}
