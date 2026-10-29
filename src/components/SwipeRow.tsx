import { useRef, useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Свайп вправо. */
  onRight?: () => void;
  /** Свайп влево. */
  onLeft?: () => void;
  rightLabel?: ReactNode;
  leftLabel?: ReactNode;
}

const THRESHOLD = 84;

/**
 * Горизонтальный свайп по строке. Вертикальная прокрутка не перехватывается:
 * направление определяется по первым ~8 px движения.
 */
export function SwipeRow({ children, onRight, onLeft, rightLabel, leftLabel }: Props) {
  const fg = useRef<HTMLDivElement>(null);
  const s = useRef({ x0: 0, y0: 0, dx: 0, mode: 'idle' as 'idle' | 'pending' | 'h' | 'v', suppressClick: false });
  const [dir, setDir] = useState<'' | 'right' | 'left'>('');
  const [armed, setArmed] = useState(false);

  const place = (dx: number, animate: boolean) => {
    const el = fg.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 220ms cubic-bezier(.22,.61,.36,1)' : 'none';
    el.style.transform = dx ? `translateX(${dx}px)` : '';
  };

  const finish = (commit: (() => void) | undefined, sign: number) => {
    const width = fg.current?.offsetWidth ?? 320;
    if (commit) {
      navigator.vibrate?.(8);
      place(sign * width, true);
      window.setTimeout(() => {
        commit();
        place(0, false);
        setDir('');
        setArmed(false);
      }, 200);
    } else {
      place(0, true);
      window.setTimeout(() => setDir(''), 220);
      setArmed(false);
    }
  };

  return (
    <div className="swipe">
      <div className={`swipe-bg ${dir ? (armed ? 'go-' : 'hint-') + dir : ''}`} aria-hidden="true">
        <span className="r">{rightLabel}</span>
        <span className="l" style={{ marginLeft: 'auto' }}>{leftLabel}</span>
      </div>
      <div
        ref={fg}
        className="swipe-fg"
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          s.current = { x0: e.clientX, y0: e.clientY, dx: 0, mode: 'pending', suppressClick: false };
        }}
        onPointerMove={(e) => {
          const st = s.current;
          if (st.mode === 'idle' || st.mode === 'v') return;
          const dx = e.clientX - st.x0;
          const dy = e.clientY - st.y0;
          if (st.mode === 'pending') {
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
              st.mode = 'h';
              e.currentTarget.setPointerCapture(e.pointerId);
            } else if (Math.abs(dy) > 8) {
              st.mode = 'v';
              return;
            } else return;
          }
          let x = dx;
          if ((x > 0 && !onRight) || (x < 0 && !onLeft)) x *= 0.15;
          const ax = Math.abs(x);
          if (ax > THRESHOLD) x = Math.sign(x) * (THRESHOLD + (ax - THRESHOLD) * 0.35);
          st.dx = x;
          place(x, false);
          setDir(x > 0 ? 'right' : x < 0 ? 'left' : '');
          setArmed(Math.abs(dx) >= THRESHOLD && ((dx > 0 && !!onRight) || (dx < 0 && !!onLeft)));
        }}
        onPointerUp={() => {
          const st = s.current;
          if (st.mode === 'h') {
            st.suppressClick = true;
            if (st.dx >= THRESHOLD && onRight) finish(onRight, 1);
            else if (st.dx <= -THRESHOLD && onLeft) finish(onLeft, -1);
            else finish(undefined, 0);
          }
          st.mode = 'idle';
        }}
        onPointerCancel={() => {
          if (s.current.mode === 'h') finish(undefined, 0);
          s.current.mode = 'idle';
        }}
        onClickCapture={(e) => {
          if (s.current.suppressClick) {
            e.stopPropagation();
            e.preventDefault();
            s.current.suppressClick = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
