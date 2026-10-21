// Vercel serverless function: sends the daily reminder as a Web Push notification.
//
// Call it every ~10 minutes (Vercel Cron on a Pro plan, GitHub Actions, cron-job.org ...):
//   GET /api/send-reminders      Authorization: Bearer <CRON_SECRET>
//
// For every enabled document in the `reminders` collection it works out the local
// time in the user's time zone and, once the chosen time has passed (and no reminder
// went out today yet), pushes one notification. Dead subscriptions are deleted.
//
// Environment variables (see README):
//   FIREBASE_SERVICE_ACCOUNT   service-account JSON (one line)
//   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT   web-push keys (npm run vapid)
//   CRON_SECRET                shared secret for the Authorization header
//   REMINDER_WINDOW_MINUTES    optional, how late a reminder may still be sent (default 90)

import webpush from 'web-push';
import admin from 'firebase-admin';

const TEXT = {
  vi: {
    title: 'Expenser · Đến giờ ghi chép rồi 💸',
    bodies: [
      'Hôm nay bạn đã chi gì chưa? Ghi lại chỉ mất vài giây.',
      'Một thói quen nhỏ mỗi ngày giúp ví của bạn khỏe hơn.',
      'Đừng để khoản chi nào “trốn” khỏi sổ của bạn nhé!',
      'Chạm để thêm giao dịch đầu tiên của hôm nay.',
    ],
    expenseLabel: 'Thêm chi tiêu',
    incomeLabel: 'Thêm thu nhập',
  },
  en: {
    title: 'Expenser · Time to log your day 💸',
    bodies: [
      'Spent anything today? Logging it takes just a few seconds.',
      'A small daily habit keeps your wallet healthy.',
      "Don't let any expense slip past your records!",
      'Tap to add your first transaction of today.',
    ],
    expenseLabel: 'Add expense',
    incomeLabel: 'Add income',
  },
};

/** Local calendar date (YYYY-MM-DD), minutes since midnight and day-of-month in a time zone. */
export function localParts(timeZone, now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    day: Number(parts.day),
  };
}

/** True when this reminder should be sent now. */
export function isDue(reminder, now = new Date(), windowMinutes = 90) {
  if (!reminder?.enabled || !/^\d{2}:\d{2}$/.test(reminder.time || '')) return false;
  let local;
  try {
    local = localParts(reminder.tz || 'UTC', now);
  } catch {
    local = localParts('UTC', now);
  }
  const [h, m] = reminder.time.split(':').map(Number);
  const target = h * 60 + m;
  return local.minutes >= target && local.minutes < target + windowMinutes && reminder.lastSentDate !== local.date;
}

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  return admin.firestore();
}

export default async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'server is not configured' });
  }

  const db = init();
  const windowMinutes = Number(process.env.REMINDER_WINDOW_MINUTES) || 90;
  const now = new Date();
  const snap = await db.collection('reminders').where('enabled', '==', true).get();
  const result = { checked: snap.size, sent: 0, removed: 0, failed: 0 };

  await Promise.all(
    snap.docs.map(async (docSnap) => {
      const r = docSnap.data();
      if (!isDue(r, now, windowMinutes)) return;
      const text = TEXT[r.lang] || TEXT.vi;
      const local = localParts(r.tz || 'UTC', now);
      const payload = JSON.stringify({
        title: text.title,
        body: text.bodies[local.day % text.bodies.length],
        expenseLabel: text.expenseLabel,
        incomeLabel: text.incomeLabel,
        lang: r.lang || 'vi',
        url: '/?add=expense',
      });
      try {
        await webpush.sendNotification(r.subscription, payload, { TTL: 60 * 60 * 6, urgency: 'normal' });
        await docSnap.ref.update({ lastSentDate: local.date });
        result.sent += 1;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await docSnap.ref.delete();
          result.removed += 1;
        } else {
          result.failed += 1;
        }
      }
    }),
  );

  return res.status(200).json(result);
}
