import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useI18n } from '../i18n';
import {
  DEFAULT_REMINDER,
  getPermission,
  isSupported,
  markShownToday,
  msUntilNext,
  normalizeTime,
  pushConfigured,
  removeServerReminder,
  requestPermission,
  saveServerReminder,
  showReminder,
  syncWorkerConfig,
  wasShownToday,
} from '../services/reminders';

/**
 * Keeps the daily reminder alive while the signed-in shell is mounted:
 * syncs the push subscription, the worker fallback and an in-page timer with
 * the settings. Mount once (AppLayout).
 */
export function useReminderRuntime() {
  const { user } = useAuth();
  const { settings, update } = useSettings();
  const { t, lang } = useI18n();
  const reminder = settings.reminder || DEFAULT_REMINDER;
  const uid = user?.uid;
  const tRef = useRef(t);
  tRef.current = t;

  // Permission revoked in the browser -> reflect it instead of pretending it's on.
  useEffect(() => {
    if (reminder.enabled && getPermission() !== 'granted') {
      update({ reminder: { ...reminder, enabled: false } });
    }
  }, [reminder, update]);

  // Subscription + worker config follow the settings (time / language / on-off).
  useEffect(() => {
    if (!uid || !isSupported()) return;
    const active = reminder.enabled && getPermission() === 'granted';
    syncWorkerConfig({ enabled: active, time: reminder.time }, t, lang).catch(() => {});
    if (active) saveServerReminder({ uid, time: reminder.time, lang }).catch(() => {});
  }, [uid, reminder.enabled, reminder.time, lang, t]);

  // In-page timer: fires at the chosen time while the app is open / backgrounded.
  useEffect(() => {
    if (!reminder.enabled || getPermission() !== 'granted') return undefined;
    let timer;
    const arm = () => {
      timer = setTimeout(async () => {
        if (!wasShownToday()) {
          markShownToday();
          showReminder(tRef.current, lang).catch(() => {});
        }
        arm();
      }, Math.min(msUntilNext(reminder.time), 2 ** 31 - 1));
    };
    arm();
    return () => clearTimeout(timer);
  }, [reminder.enabled, reminder.time, lang]);
}

/** State + actions for the Settings card. */
export function useReminderSettings() {
  const { user } = useAuth();
  const { settings, update } = useSettings();
  const { t, lang } = useI18n();
  const reminder = settings.reminder || DEFAULT_REMINDER;
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState(getPermission());

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const result = await requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        toast.error(t(result === 'unsupported' ? 'reminder.unsupported' : 'reminder.denied'));
        return;
      }
      update({ reminder: { enabled: true, time: normalizeTime(reminder.time) } });
      toast.success(t('reminder.on', { time: normalizeTime(reminder.time) }));
    } catch {
      toast.error(t('reminder.error'));
    } finally {
      setBusy(false);
    }
  }, [reminder.time, t, update]);

  const disable = useCallback(async () => {
    setBusy(true);
    update({ reminder: { ...reminder, enabled: false } });
    await removeServerReminder(user?.uid);
    await syncWorkerConfig({ enabled: false }, t, lang).catch(() => {});
    setBusy(false);
    toast(t('reminder.off'));
  }, [lang, reminder, t, update, user?.uid]);

  const setTime = useCallback(
    (time) => {
      if (!/^\d{2}:\d{2}$/.test(time)) return;
      update({ reminder: { ...reminder, time: normalizeTime(time) } });
    },
    [reminder, update],
  );

  const sendTest = useCallback(async () => {
    try {
      const result = permission === 'granted' ? 'granted' : await requestPermission();
      setPermission(result);
      if (result !== 'granted') return toast.error(t('reminder.denied'));
      await showReminder(t, lang);
      toast.success(t('reminder.testSent'));
    } catch {
      toast.error(t('reminder.error'));
    }
  }, [lang, permission, t]);

  return {
    supported: isSupported(),
    permission,
    pushConfigured,
    enabled: reminder.enabled && permission === 'granted',
    time: normalizeTime(reminder.time),
    busy,
    enable,
    disable,
    setTime,
    sendTest,
  };
}
