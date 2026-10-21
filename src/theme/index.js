// Theme runtime helpers.
//
// The design tokens themselves live in ./expenser-theme.css (shadcn-style
// oklch variables for light + .dark). index.css maps them onto the role names
// the components use. This module only deals with the two things CSS cannot:
//   1. an optional accent colour chosen in Settings (overrides the green
//      primary / chart / sidebar-primary tokens at runtime), and
//   2. resolving CSS colours to plain hex for the places that need real
//      values (Recharts, toasts, <meta name="theme-color">).

// Splash screen colours. Keep in sync with: index.html (inline <style>),
// src/index.css (.splash) and vite.config.js (iOS startup images / manifest).
export const SPLASH = { light: '#008236', dark: '#0a0a0a' };

// Accent presets offered in Settings. `hex: ''` is the supplied theme itself
// (expenser-theme.css) - nothing is overridden. The others only need a hue:
// lightness/chroma are taken from the theme's own green ladder so contrast
// stays right in light and dark mode.
export const ACCENT_PRESETS = [
  { id: 'green', hex: '', swatch: '#008236' },
  { id: 'blue', hex: '#2563EB', swatch: '#2563EB' },
  { id: 'teal', hex: '#0D9488', swatch: '#0D9488' },
  { id: 'amber', hex: '#D97706', swatch: '#D97706' },
  { id: 'orange', hex: '#EA580C', swatch: '#EA580C' },
  { id: 'rose', hex: '#E11D48', swatch: '#E11D48' },
  { id: 'purple', hex: '#7C3AED', swatch: '#7C3AED' },
  { id: 'indigo', hex: '#4F46E5', swatch: '#4F46E5' },
];

export const DEFAULT_ACCENT = '';

const ACCENT_CACHE_KEY = 'qlct:accent';
const ACCENT_VARS = [
  '--primary',
  '--primary-foreground',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
];

export function isValidHex(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

// ---- colour maths ---------------------------------------------------------
function hexToOklch(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { chroma: Math.hypot(a, bb), hue: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}

// L / C pairs copied from the supplied theme's green ramp (chart-1 ... chart-5)
const RAMP = [
  [0.871, 0.15],
  [0.723, 0.219],
  [0.627, 0.194],
  [0.527, 0.154],
  [0.448, 0.119],
];

/** Accent hex -> { '--primary': 'oklch(...)', ... } for light or dark mode. */
export function accentVars(hex, dark) {
  const { hue, chroma } = hexToOklch(hex);
  const k = chroma < 0.03 ? 0 : 1; // a grey pick gives a neutral accent
  const o = (i, scale = 1) => `oklch(${RAMP[i][0]} ${(RAMP[i][1] * k * scale).toFixed(3)} ${hue.toFixed(1)})`;
  const fg = `oklch(0.985 ${(0.018 * k).toFixed(3)} ${hue.toFixed(1)})`;
  return {
    '--primary': dark ? o(4) : o(3),
    '--primary-foreground': fg,
    '--sidebar-primary': dark ? o(1) : o(2),
    '--sidebar-primary-foreground': fg,
    '--chart-1': o(0),
    '--chart-2': o(1),
    '--chart-3': o(2),
    '--chart-4': o(3),
    '--chart-5': o(4),
  };
}

const toCss = (vars) => Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');

/** Applies (or clears) the accent override on <html>. Empty/invalid = the supplied theme as-is. */
export function applyAccent(hex, dark, root = document.documentElement) {
  ACCENT_VARS.forEach((name) => root.style.removeProperty(name));
  if (!hex || !isValidHex(hex)) return;
  Object.entries(accentVars(hex, dark)).forEach(([name, value]) => root.style.setProperty(name, value));
}

/** Stored next to the setting so index.html can paint the right accent before React boots. */
export function cacheAccent(hex) {
  try {
    if (!hex || !isValidHex(hex)) localStorage.removeItem(ACCENT_CACHE_KEY);
    else localStorage.setItem(ACCENT_CACHE_KEY, JSON.stringify({ hex, light: toCss(accentVars(hex, false)), dark: toCss(accentVars(hex, true)) }));
  } catch {
    /* storage unavailable - the accent is simply re-applied by React */
  }
}

// ---- resolving CSS colours to hex ------------------------------------------
let probe;
let ctx;

function resolveToHex(cssValue) {
  if (!probe) {
    probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:0;height:0';
    document.body.appendChild(probe);
    ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    ctx.canvas.width = 1;
    ctx.canvas.height = 1;
  }
  probe.style.color = '';
  probe.style.color = cssValue;
  const computed = getComputedStyle(probe).color; // fully resolved (var(), color-mix(), oklch() ...)
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = '#000';
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  return a === 255 ? hex : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
}

const COLOR_VARS = {
  primary: '--md-primary',
  brand: '--brand',
  income: '--md-income',
  expense: '--md-expense',
  surface: '--md-surface',
  popover: '--popover',
  onSurface: '--md-on-surface',
  onSurfaceVariant: '--md-on-surface-variant',
  outlineVariant: '--md-outline-variant',
  inverseSurface: '--md-inverse-surface',
  inverseOnSurface: '--md-inverse-on-surface',
};

/** Active theme colours as plain hex (follows light/dark and the accent). Call after the vars are applied. */
export function readThemeColors() {
  return Object.fromEntries(Object.entries(COLOR_VARS).map(([key, name]) => [key, resolveToHex(`var(${name})`)]));
}

// Values of expenser-theme.css, used for the very first render (before the
// real ones can be read from the DOM).
export const FALLBACK_COLORS = {
  light: { primary: '#008236', brand: '#008236', income: '#008236', expense: '#e7000b', surface: '#ffffff', popover: '#ffffff', onSurface: '#0a0a0a', onSurfaceVariant: '#737373', outlineVariant: '#e5e5e5', inverseSurface: '#0a0a0a', inverseOnSurface: '#ffffff' },
  dark: { primary: '#016630', brand: '#00c950', income: '#00c950', expense: '#ff6467', surface: '#0a0a0a', popover: '#171717', onSurface: '#fafafa', onSurfaceVariant: '#a1a1a1', outlineVariant: '#262626', inverseSurface: '#fafafa', inverseOnSurface: '#0a0a0a' },
};

/** Sets every <meta name="theme-color"> (status bar / title bar colour). */
export function setThemeColor(color) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.removeAttribute('media'); // the in-app theme wins over the OS one
    meta.setAttribute('content', color);
  });
}

export function splashColor(dark = document.documentElement.classList.contains('dark')) {
  return dark ? SPLASH.dark : SPLASH.light;
}
