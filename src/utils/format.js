// Locale-aware formatting helpers. The active locale is set once by
// SettingsProvider (setFormatLocale) so every helper — including ones called
// from non-component code like the exporters — follows the app language.
let locale = 'vi-VN';
let lang = 'vi';
const cache = new Map();

export function setFormatLocale(language) {
  lang = language === 'en' ? 'en' : 'vi';
  locale = lang === 'en' ? 'en-GB' : 'vi-VN';
  cache.clear();
}

// Intl formatters are expensive to construct, so they are cached per locale.
function formatter(kind, options) {
  const key = `${locale}|${kind}|${JSON.stringify(options)}`;
  let f = cache.get(key);
  if (!f) {
    f = kind === 'number' ? new Intl.NumberFormat(locale, options) : new Intl.DateTimeFormat(locale, options);
    cache.set(key, f);
  }
  return f;
}

function toDate(date) {
  return date instanceof Date ? date : new Date(date);
}

export function formatMoney(amount) {
  const n = Number(amount) || 0;
  return formatter('number', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

export function formatNumber(n) {
  return formatter('number', {}).format(Number(n) || 0);
}

// Parses a formatted money string like "1.500.000" back to a raw number
export function parseMoneyInput(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const cleaned = String(str).replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

export function formatDate(date) {
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return '';
  return formatter('date', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

export function formatDateShort(date) {
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return '';
  return formatter('date', { day: '2-digit', month: '2-digit' }).format(d);
}

export function formatTime(date) {
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return '';
  return formatter('date', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}

export function formatMonthYear(date) {
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return '';
  return lang === 'vi' ? `Tháng ${d.getMonth() + 1}/${d.getFullYear()}` : formatter('date', { month: 'long', year: 'numeric' }).format(d);
}

// e.g. "Thứ Ba, 22/09/2026" / "Tuesday, 22/09/2026" - day-section header in the list.
export function formatDayHeader(date) {
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${formatter('date', { weekday: 'long' }).format(d)}, ${formatDate(d)}`;
}

export function toInputDate(date) {
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return '';
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function toInputDateTimeLocal(date) {
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return '';
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

// "YYYY-MM-DD" key for grouping by calendar day (local time, not UTC).
export function dayKey(date) {
  const d = toDate(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function monthKey(date) {
  const d = toDate(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthStartInput(date = new Date()) {
  return toInputDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function monthEndInput(date = new Date()) {
  return toInputDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

// Parses a "YYYY-MM-DD" input value as a LOCAL date (avoids the UTC-midnight
// shift that plain `new Date(str)` introduces in non-UTC timezones).
export function parseLocalDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function parseLocalDateEnd(str) {
  const d = parseLocalDate(str);
  if (!d) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

// 1.5tr / 200k (vi) or 1.5M / 200K (en) - for chart axes and calendar cells.
export function formatCompactMoney(n) {
  const num = Number(n) || 0;
  const abs = Math.abs(num);
  const unit = lang === 'en' ? { m: 'M', k: 'K' } : { m: 'tr', k: 'k' };
  const decimal = lang === 'en' ? '.' : ',';
  if (abs >= 1_000_000_000) {
    const v = num / 1_000_000_000;
    return `${(Number.isInteger(v) ? v : v.toFixed(1)).toString().replace('.', decimal)}${lang === 'en' ? 'B' : 'tỷ'}`;
  }
  if (abs >= 1_000_000) {
    const v = num / 1_000_000;
    return `${(Number.isInteger(v) ? v : v.toFixed(1)).toString().replace('.', decimal)}${unit.m}`;
  }
  if (abs >= 1000) return `${Math.round(num / 1000)}${unit.k}`;
  return String(num);
}

/**
 * Quick-pick amounts for a short typed number. Typing "2" offers
 * 2.000 / 20.000 / 200.000 / 2.000.000 (the number x 10^3 ... 10^6), so a
 * VND amount can be entered with a tap instead of typing every zero.
 * Only offered while the number is still short (< 1.000) - once the user has
 * typed a real amount there is nothing left to guess.
 */
export function getAmountSuggestions(value, max = Number.MAX_SAFE_INTEGER) {
  const n = Math.floor(Number(value) || 0);
  if (n <= 0 || n >= 1000) return [];
  return [1_000, 10_000, 100_000, 1_000_000]
    .map((mult) => n * mult)
    .filter((amount) => amount <= max);
}
