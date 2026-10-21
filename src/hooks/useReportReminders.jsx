import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSettings } from '../contexts/SettingsContext';

const WEEKLY_KEY = 'qlct:reminder:weekly';
const MONTHLY_KEY = 'qlct:reminder:monthly';

function todayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthKeyOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Note: this is a client-only reminder - it has no server/push backend, so
 * it can only fire while the person actually has the app open (a tab or the
 * installed PWA), not truly in the background when the app/device is
 * closed. It checks once per app load whether today is Monday (weekly
 * report nudge) or the 1st of the month (monthly report nudge) and, if that
 * nudge hasn't already been shown this week/month, shows it once - via a
 * real browser Notification if permission was granted, or an in-app toast
 * otherwise.
 */
export function useReportReminders() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return permission;
    }
  }, [permission]);

  const fire = useCallback(
    (title, body) => {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          const n = new Notification(title, { body, icon: '/icons/icon-192.png', tag: title });
          n.onclick = () => {
            window.focus();
            navigate('/statistics');
            n.close();
          };
          return;
        } catch {
          /* fall through to in-app toast */
        }
      }
      toast(
        (t) => (
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</p>
              <p className="mt-0.5 text-xs text-on-surface-variant">{body}</p>
            </div>
            <button
              onClick={() => {
                navigate('/statistics');
                toast.dismiss(t.id);
              }}
              className="shrink-0 rounded-lg bg-accent-600 px-2.5 py-1.5 text-xs font-semibold text-white"
            >
              Xem
            </button>
          </div>
        ),
        { duration: 8000 }
      );
    },
    [navigate]
  );

  useEffect(() => {
    if (!settings.reportReminders) return;
    const now = new Date();

    // Monday -> weekly report nudge, once per week.
    if (now.getDay() === 1) {
      const key = todayKey(now);
      const lastShown = localStorage.getItem(WEEKLY_KEY);
      if (lastShown !== key) {
        fire('Báo cáo tuần trước', 'Đầu tuần mới rồi - xem lại báo cáo thu chi tuần trước của bạn nhé!');
        localStorage.setItem(WEEKLY_KEY, key);
      }
    }

    // 1st of the month -> monthly report nudge, once per month.
    if (now.getDate() === 1) {
      const key = monthKeyOf(now);
      const lastShown = localStorage.getItem(MONTHLY_KEY);
      if (lastShown !== key) {
        fire('Báo cáo tháng trước', 'Tháng mới bắt đầu - xem lại báo cáo thu chi tháng trước của bạn nhé!');
        localStorage.setItem(MONTHLY_KEY, key);
      }
    }
    // Only needs to run once per app load (plus whenever the setting itself
    // changes, e.g. the user just turned it on) - deliberately excludes
    // `fire` from deps so this doesn't re-fire on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.reportReminders]);

  return { permission, requestPermission };
}
