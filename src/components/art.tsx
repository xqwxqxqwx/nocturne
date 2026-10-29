/* Вся графика приложения — собственные SVG. */
import { useId, type ReactNode } from 'react';

/** Острый крест с заточенными концами. */
export function Cross({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 0 8.2 4v2.8H11L14 8l-3 1.2H8.2V16L7 20l-1.2-4V9.2H3L0 8l3-1.2h2.8V4Z"
      />
    </svg>
  );
}

/** Разделитель: терновая лоза с крестом посередине. */
export function ThornDivider() {
  const id = useId().replace(/:/g, '');
  const line = (flip: boolean) => (
    <svg className="line" preserveAspectRatio="none" aria-hidden="true" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <defs>
        <pattern id={`${id}${flip ? 'b' : 'a'}`} width="16" height="10" patternUnits="userSpaceOnUse">
          <rect y="4.6" width="16" height="0.8" fill="currentColor" />
          <path fill="currentColor" d="M2 5Q5 4.3 6.6 .6 6.4 4 8.6 5Z" />
          <path fill="currentColor" d="M9.5 5q3 .7 4.6 4.4-.2-3.4 1.9-4.4Z" />
        </pattern>
      </defs>
      <rect width="100%" height="10" fill={`url(#${id}${flip ? 'b' : 'a'})`} />
    </svg>
  );
  return (
    <div className="thorns" role="separator">
      {line(false)}
      <Cross className="mid" />
      {line(true)}
    </div>
  );
}

/** «Tribal»-завиток в духе Y2K-принтов: острые лезвия, расходящиеся от центра. */
export function Flourish({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 92 40" aria-hidden="true" fill="currentColor">
      <path d="M92 20C72 17 52 7 24 1c16 8 34 15 46 19.5C56 23 38 30 12 39c28-4 54-11 80-19Z" />
      <path d="M84 20C62 19.4 34 19 0 20c34 1 62 .6 84 0Z" />
      <path d="M60 14.5C56 9 50 6 42 6.5c7 2 11 5.5 13 10Z" />
      <path d="M60 25.5c-4 5.5-10 8.5-18 8 7-2 11-5.5 13-10Z" />
      <path d="M36 9.5c-3-1-6-1-9 .5 3 0 5.5 1 7.5 3Z" opacity=".7" />
    </svg>
  );
}

/** Чёрный котик у светящегося окна — для пустых состояний. */
export function CatScene({ variant = 'sit' }: { variant?: 'sit' | 'sleep' }) {
  const id = useId().replace(/:/g, '');
  const cat =
    variant === 'sit' ? (
      <>
        <path d="M40 104c-6 0-8-8-6-18 2-12 10-20 18-22s14 4 16 14 2 22-2 26Z" />
        <circle cx="55" cy="56" r="11" />
        <path d="M46.5 50 44.5 37l9 9.5Z" />
        <path d="m57.5 46.5 9-9.5-1.6 13Z" />
        <path d="M66 102c14 2 24-4 22-12-1-4-5-4-6-1 2 3-2 9-14 9Z" />
      </>
    ) : (
      <>
        <path d="M30 104c-4-12 6-22 24-22 16 0 26 8 26 22Z" />
        <ellipse cx="34" cy="98" rx="11" ry="8" />
        <path d="m26 92-1-10 7 6Z" />
        <path d="m36 89 6-7v10Z" />
        <path d="M80 102c6 0 10 2 8 4-6 1-14 0-14-4Z" />
      </>
    );
  return (
    <svg viewBox="0 0 150 120" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}g`}>
          <stop offset="0" stopColor="#e8e6e3" stopOpacity=".2" />
          <stop offset=".55" stopColor="#e8e6e3" stopOpacity=".06" />
          <stop offset="1" stopColor="#e8e6e3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="96" cy="46" r="44" fill={`url(#${id}g)`} />
      {/* окно с переплётом */}
      <g stroke="#2a2a2e" strokeWidth="1.2" fill="none">
        <path d="M76 74V34a20 20 0 0 1 40 0v40Z" />
        <path d="M96 14v60M76 46h40" />
      </g>
      <circle cx="104" cy="30" r="5" fill="#e8e6e3" opacity=".55" style={{ filter: 'drop-shadow(0 0 4px #e8e6e3)' }} />
      {/* подоконник — колючая линия */}
      <path d="M14 104h122" stroke="#2a2a2e" strokeWidth="1" />
      <path fill="#2a2a2e" d="M100 104l3-4 1 4ZM118 104l2 3.5 1.5-3.5ZM22 104l3-4 1 4Z" />
      {/* контур (свет сзади), потом заливка поверх — получается только внешняя кромка */}
      <g fill="#8a8a8f" stroke="#8a8a8f" strokeWidth="1.6" opacity=".55">{cat}</g>
      <g fill="#050505">{cat}</g>
      {variant === 'sit' ? (
        <g fill="#e8e6e3" style={{ filter: 'drop-shadow(0 0 2px #e8e6e3)' }}>
          <ellipse cx="51" cy="56.5" rx="1.7" ry="1" />
          <ellipse cx="59" cy="56.5" rx="1.7" ry="1" />
        </g>
      ) : (
        <path d="M30 98q2 1.5 4 0M36 98q2 1.5 4 0" stroke="#55555a" strokeWidth="1" fill="none" />
      )}
    </svg>
  );
}

/* ── иконки интерфейса ── */
type IP = { className?: string };
const S = (p: { children: ReactNode; className?: string }) => (
  <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {p.children}
  </svg>
);

export const IconToday = (p: IP) => (
  <S {...p}>
    <circle cx="12" cy="12" r="7.5" />
    <path d="M12 8.5 14 12l-2 3.5L10 12Z" fill="currentColor" />
    <path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2" />
  </S>
);
export const IconWeek = (p: IP) => (
  <S {...p}>
    <path d="M4 18v-6M7.3 18V9M10.6 18v-4M13.9 18V6M17.2 18v-8M20.5 18v-3M3 21h18" />
  </S>
);
export const IconMonth = (p: IP) => (
  <S {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    <path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" strokeWidth="2.2" />
  </S>
);
export const IconSettings = (p: IP) => (
  <S {...p}>
    <path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="17" cy="17" r="2" />
  </S>
);
export const IconPlus = (p: IP) => (
  <S {...p}>
    <path d="M12 4v16M4 12h16" strokeWidth="2" />
  </S>
);
export const IconCheck = (p: IP) => (
  <S {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" strokeWidth="2.2" />
  </S>
);
export const IconBack = (p: IP) => (
  <S {...p}>
    <path d="M15 5 8 12l7 7" />
  </S>
);
export const IconNext = (p: IP) => (
  <S {...p}>
    <path d="m9 5 7 7-7 7" />
  </S>
);
export const IconSend = (p: IP) => (
  <S {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" strokeWidth="2" />
  </S>
);
export const IconExpand = (p: IP) => (
  <S {...p}>
    <path d="M5 8h14M5 12h14M5 16h9" />
  </S>
);
export const IconBell = (p: IP) => (
  <S {...p}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
  </S>
);
export const IconRepeat = (p: IP) => (
  <S {...p}>
    <path d="M4 11V9a3 3 0 0 1 3-3h12l-3-3M20 13v2a3 3 0 0 1-3 3H5l3 3" />
  </S>
);
export const IconClock = (p: IP) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </S>
);
export const IconArrow = (p: IP) => (
  <S {...p}>
    <path d="M4 12h15M14 7l5 5-5 5" />
  </S>
);
