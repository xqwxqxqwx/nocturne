import { useEffect, useRef, useState } from 'react';
import { createItem } from '../db/actions';
import { relativeLabel } from '../domain/dates';
import { quickParse } from '../domain/quickParse';
import type { ISODate } from '../domain/types';
import { IconExpand, IconSend } from './art';

interface Props {
  date: ISODate;
  today: ISODate;
  onClose: () => void;
  /** Открыть полный редактор с уже набранным текстом. */
  onExpand: (text: string) => void;
  onAdded: (msg: string) => void;
}

/** Одна строка — и задача добавлена. Поле остаётся открытым для следующей. */
export function QuickAdd({ date, today, onClose, onExpand, onAdded }: Props) {
  const [text, setText] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const parsed = text.trim() ? quickParse(text, date, today) : null;

  const submit = async () => {
    if (!parsed) return;
    await createItem({
      kind: parsed.kind,
      title: parsed.title,
      note: '',
      priority: parsed.priority,
      date: parsed.date,
      start: parsed.start,
      end: parsed.end,
      reminder: 'none',
      repeat: { type: 'none' },
    });
    setText('');
    onAdded(`добавлено · ${relativeLabel(parsed.date, today)}`);
    input.current?.focus();
  };

  const hint = parsed
    ? `${parsed.kind === 'event' ? `событие ${parsed.start}–${parsed.end}` : 'задача'} · ${relativeLabel(parsed.date, today)}${parsed.priority === 'important' ? ' · ✝ важно' : ''}`
    : 'напр.: «завтра позвонить маме», «18:30 зал», «отчёт!»';

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="quick" role="dialog" aria-label="Быстрое добавление">
        <div className="quick-inner">
          <div className="hint">
            <span>{hint}</span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <button type="button" className="icon-btn" onClick={() => onExpand(text)} aria-label="Подробнее">
              <IconExpand />
            </button>
            <input
              ref={input}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="что сделать?"
              enterKeyHint="send"
              autoComplete="off"
              aria-label="Новая задача"
            />
            <button className="send" type="submit" disabled={!parsed} aria-label="Добавить">
              <IconSend />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
