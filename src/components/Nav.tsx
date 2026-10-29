import { IconMonth, IconSettings, IconToday, IconWeek } from './art';

export type Tab = 'today' | 'week' | 'month' | 'settings';

const TABS: [Tab, string, typeof IconToday][] = [
  ['today', 'Сегодня', IconToday],
  ['week', 'Неделя', IconWeek],
  ['month', 'Месяц', IconMonth],
  ['settings', 'Настройки', IconSettings],
];

export function Nav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => onTab(id)} aria-current={tab === id ? 'page' : undefined}>
            <Icon />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
