import { useRef, useState } from 'react';
import { saveSettings } from '../db/db';
import { exportAll, importAll } from '../db/actions';
import { IconArrow, ThornDivider } from '../components/art';
import { askPermission, notificationsSupported, permission } from '../notify/reminders';
import { todayISO } from '../domain/dates';
import type { Item, Settings } from '../domain/types';

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

export function SettingsScreen({ settings, items, notify }: { settings: Settings; items: Item[]; notify: (t: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [perm, setPerm] = useState(permission());

  const toggleNotifications = async () => {
    if (settings.notifications) return saveSettings({ notifications: false });
    const ok = perm === 'granted' || (await askPermission());
    setPerm(permission());
    if (ok) {
      await saveSettings({ notifications: true });
      notify('напоминания включены');
    } else notify('браузер не разрешил уведомления');
  };

  const doExport = async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nocturne-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    notify(`сохранено дел: ${data.items.length}`);
  };

  const doImport = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!confirm('Импорт заменит все текущие дела данными из файла. Продолжить?')) return;
      const n = await importAll(data);
      notify(`загружено дел: ${n}`);
    } catch (e) {
      notify(e instanceof Error && e.message.includes('Ноктюрн') ? e.message : 'не удалось прочитать файл');
    }
  };

  const notifNote = !notificationsSupported()
    ? isIOS && !standalone
      ? 'на iPhone работают только у установленного приложения (iOS 16.4+)'
      : 'этот браузер не поддерживает уведомления'
    : perm === 'denied'
      ? 'запрещены в настройках браузера'
      : 'приходят, пока приложение открыто или свёрнуто';

  const active = items.filter((i) => i.repeat.type !== 'none' || !i.done).length;

  return (
    <div className="screen">
      <div className="topbar" />
      <h1 className="page-title">настройки</h1>
      <ThornDivider />

      <div className="section-title"><span>напоминания</span></div>
      <div className="card">
        <div className="set-row">
          <div className="txt">
            уведомления
            <small>{notifNote}</small>
          </div>
          <button
            className={`toggle ${settings.notifications && perm === 'granted' ? 'on' : ''}`}
            onClick={toggleNotifications}
            disabled={!notificationsSupported() || perm === 'denied'}
            role="switch"
            aria-checked={settings.notifications}
            aria-label="Уведомления"
          />
        </div>
        <div className="set-row">
          <div className="txt">
            «утром в день дела»
            <small>во сколько напоминать</small>
          </div>
          <input
            type="time"
            className="mono"
            value={settings.morningTime}
            onChange={(e) => e.target.value && saveSettings({ morningTime: e.target.value })}
          />
        </div>
      </div>

      <div className="section-title"><span>атмосфера</span></div>
      <div className="card">
        <div className="set-row">
          <div className="txt">
            плёночное зерно
            <small>лёгкий шум поверх экрана</small>
          </div>
          <button className={`toggle ${settings.grain ? 'on' : ''}`} onClick={() => saveSettings({ grain: !settings.grain })} role="switch" aria-checked={settings.grain} aria-label="Зерно" />
        </div>
      </div>

      <div className="section-title"><span>данные</span></div>
      <div className="card">
        <button className="set-btn" onClick={doExport}>
          <span className="txt">
            экспорт в JSON
            <small>активных дел: {active} · всего записей: {items.length}</small>
          </span>
          <IconArrow />
        </button>
        <button className="set-btn" onClick={() => file.current?.click()}>
          <span className="txt">
            импорт из JSON
            <small>заменит текущие данные</small>
          </span>
          <IconArrow />
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doImport(f);
            e.target.value = '';
          }}
        />
      </div>
      <p className="note-s">данные хранятся только на этом устройстве. делай экспорт время от времени.</p>

      {!standalone && (
        <>
          <div className="section-title"><span>установка</span></div>
          <div className="card" style={{ padding: '10px 14px' }}>
            {isIOS ? (
              <ol className="steps">
                <li>открой в Safari</li>
                <li>«Поделиться» → «На экран „Домой“»</li>
                <li>запускай с иконки — будет работать офлайн</li>
              </ol>
            ) : (
              <ol className="steps">
                <li>в меню браузера ⋮ выбери «Установить приложение» или «Добавить на гл. экран»</li>
                <li>запускай с иконки — будет работать офлайн</li>
              </ol>
            )}
          </div>
        </>
      )}

      <div className="about">
        <svg className="mark" viewBox="0 0 100 100" aria-hidden="true">
          <image href="./icons/icon-mark.svg" width="100" height="100" />
        </svg>
        <div className="name">Nocturne</div>
        <div>тихий планер · v1</div>
      </div>
    </div>
  );
}
