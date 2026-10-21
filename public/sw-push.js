/* eslint-disable no-restricted-globals */
// Extra service-worker code, pulled into the generated Workbox worker through
// `workbox.importScripts` in vite.config.js. It handles:
//   - `push`          : a daily reminder sent by /api/send-reminders (Web Push)
//   - `periodicsync`  : best-effort local reminder when no push server is configured
//   - `notificationclick`: opens the app on the add-transaction form
//
// The notification look is defined once here (ICON/BADGE/IMAGE + actions) and
// mirrored in src/services/reminders.js for the in-app "send a test" button.

const ICON = '/icons/icon-192.png';
const BADGE = '/icons/badge-96.png'; // monochrome glyph for the status bar
const IMAGE = '/notif-banner.png'; // wide banner shown when the notification is expanded
const CONFIG_CACHE = 'expenser-reminder-config';
const CONFIG_URL = '/__reminder-config';

function options(data) {
  return {
    body: data.body,
    icon: ICON,
    badge: BADGE,
    image: IMAGE,
    tag: 'daily-reminder', // a newer reminder replaces the previous one instead of stacking
    renotify: false,
    lang: data.lang || 'vi',
    vibrate: [80, 40, 80],
    timestamp: Date.now(),
    data: { url: data.url || '/?add=expense' },
    actions: [
      { action: 'add-expense', title: data.expenseLabel || 'Thêm chi tiêu' },
      { action: 'add-income', title: data.incomeLabel || 'Thêm thu nhập' },
    ],
  };
}

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Expenser';
  event.waitUntil(self.registration.showNotification(title, options(data)));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const base = (event.notification.data && event.notification.data.url) || '/?add=expense';
  const url =
    event.action === 'add-income' ? '/?add=income' : event.action === 'add-expense' ? '/?add=expense' : base;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

// ---- Local fallback (Chrome / Android installed PWAs) ---------------------------
// The page stores { time, messages, ... } in the cache; the browser wakes the worker
// now and then and we show today's reminder if its time has passed.
self.addEventListener('periodicsync', (event) => {
  if (event.tag !== 'expenser-daily-reminder') return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CONFIG_CACHE);
      const res = await cache.match(CONFIG_URL);
      if (!res) return;
      const cfg = await res.json();
      if (!cfg.enabled) return;
      const now = new Date();
      const [h, m] = String(cfg.time || '06:00').split(':').map(Number);
      const due = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      const today = now.toDateString();
      if (now < due || cfg.lastShown === today) return;
      const body = cfg.messages[now.getDate() % cfg.messages.length];
      await self.registration.showNotification(cfg.title, options({ ...cfg, body }));
      await cache.put(CONFIG_URL, new Response(JSON.stringify({ ...cfg, lastShown: today })));
    })(),
  );
});
