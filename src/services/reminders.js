// Daily reminder notifications - client side.
//
// Delivery paths (best available wins; all use the same notification tag so a day
// never shows two reminders):
//   1. Web Push from /api/send-reminders  - works with the app closed. Needs
//      VITE_VAPID_PUBLIC_KEY and the server env described in the README.
//   2. Periodic Background Sync           - Chrome/Android installed PWAs, no server.
//   3. In-page timer                      - while the app is open or in the background.
//
// The saved subscription lives in the top-level `reminders` collection
// (document id: `<uid>_<hash of the push endpoint>`), one document per device.

export const DEFAULT_REMINDER = { enabled: false, time: '06:00' };
export const REMINDER_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const CONFIG_CACHE = 'expenser-reminder-config';
const CONFIG_URL = '/__reminder-config';
const LAST_LOCAL_KEY = 'qlct:reminder:lastLocal';

export const pushConfigured = !!VAPID_KEY;

export function isSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function getPermission() {
  return isSupported() ? Notification.permission : 'unsupported';
}

export async function requestPermission() {
  if (!isSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export function normalizeTime(value) {
  return REMINDER_TIME_RE.test(value || '') ? value : DEFAULT_REMINDER.time;
}

// ---- Notification content (mirrors public/sw-push.js) ---------------------------
export function buildReminder(t, lang, date = new Date()) {
  const n = 1 + (date.getDate() % 4);
  return {
    title: t('reminder.n.title'),
    body: t(`reminder.n.b${n}`),
    messages: [1, 2, 3, 4].map((i) => t(`reminder.n.b${i}`)),
    expenseLabel: t('reminder.n.expense'),
    incomeLabel: t('reminder.n.income'),
    lang,
    url: '/?add=expense',
  };
}

function notificationOptions(r) {
  return {
    body: r.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    image: '/notif-banner.png',
    tag: 'daily-reminder',
    renotify: false,
    lang: r.lang,
    vibrate: [80, 40, 80],
    timestamp: Date.now(),
    data: { url: r.url },
    actions: [
      { action: 'add-expense', title: r.expenseLabel },
      { action: 'add-income', title: r.incomeLabel },
    ],
  };
}

/** Shows the reminder right now (used by "send a test" and by the in-page timer). */
export async function showReminder(t, lang) {
  if (getPermission() !== 'granted') return false;
  const r = buildReminder(t, lang);
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) await reg.showNotification(r.title, notificationOptions(r));
  else new Notification(r.title, { body: r.body, icon: '/icons/icon-192.png', tag: 'daily-reminder' });
  return true;
}

// ---- Scheduling ------------------------------------------------------------------
/** Milliseconds until the next occurrence of `time` ("HH:MM") on this device. */
export function msUntilNext(time, now = new Date()) {
  const [h, m] = normalizeTime(time).split(':').map(Number);
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next - now;
}

export function wasShownToday() {
  try {
    return localStorage.getItem(LAST_LOCAL_KEY) === new Date().toDateString();
  } catch {
    return false;
  }
}
export function markShownToday() {
  try {
    localStorage.setItem(LAST_LOCAL_KEY, new Date().toDateString());
  } catch {
    /* ignore */
  }
}

/** Gives the service worker what it needs for the Periodic Background Sync fallback. */
export async function syncWorkerConfig({ enabled, time }, t, lang) {
  if (!('caches' in window)) return;
  const cache = await caches.open(CONFIG_CACHE);
  if (!enabled) {
    await cache.delete(CONFIG_URL);
  } else {
    const r = buildReminder(t, lang);
    await cache.put(CONFIG_URL, new Response(JSON.stringify({ enabled: true, time: normalizeTime(time), ...r })));
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg?.periodicSync) return;
    if (enabled) await reg.periodicSync.register('expenser-daily-reminder', { minInterval: 12 * 60 * 60 * 1000 });
    else await reg.periodicSync.unregister('expenser-daily-reminder');
  } catch {
    /* permission not granted / unsupported: the other paths still work */
  }
}

// ---- Web Push + Firestore ---------------------------------------------------------
function urlBase64ToUint8Array(base64) {
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function sha(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

async function pushSubscription({ create }) {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg?.pushManager) return null;
  let sub = await reg.pushManager.getSubscription();
  if (!sub && create) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) });
  }
  return sub;
}

async function firestore() {
  const [fs, { db }] = await Promise.all([import('firebase/firestore'), import('../firestore')]);
  return { ...fs, db };
}

/** Creates / updates this device's reminder document. Returns false if push isn't available. */
export async function saveServerReminder({ uid, time, lang }) {
  if (!pushConfigured) return false;
  const sub = await pushSubscription({ create: true });
  if (!sub) return false;
  const { doc, setDoc, serverTimestamp, db } = await firestore();
  const id = `${uid}_${await sha(sub.endpoint)}`;
  await setDoc(
    doc(db, 'reminders', id),
    {
      uid,
      enabled: true,
      time: normalizeTime(time),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      lang,
      subscription: sub.toJSON(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return true;
}

/** Removes this device's reminder (and the push subscription). Safe to call any time. */
export async function removeServerReminder(uid) {
  try {
    const sub = await pushSubscription({ create: false });
    if (sub && uid) {
      const { doc, deleteDoc, db } = await firestore();
      await deleteDoc(doc(db, 'reminders', `${uid}_${await sha(sub.endpoint)}`));
    }
    if (sub) await sub.unsubscribe();
  } catch {
    /* best effort - the server also drops dead subscriptions (HTTP 404/410) */
  }
}
