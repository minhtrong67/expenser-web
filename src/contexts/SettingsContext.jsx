import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { I18nContext, LANGUAGES, createT, detectLanguage } from '../i18n';
import { setFormatLocale } from '../utils/format';
import { DEFAULT_REMINDER, normalizeTime } from '../services/reminders';
import {
  DEFAULT_ACCENT,
  FALLBACK_COLORS,
  applyAccent,
  cacheAccent,
  isValidHex,
  readThemeColors,
  setThemeColor,
} from '../theme';

const SettingsContext = createContext(null);

const FONT_SCALES = { sm: 0.92, md: 1, lg: 1.1 };

// Shared metadata for the 3 theme modes so any component (Topbar quick
// toggle, Settings page selector, ...) stays in sync.
export const THEME_MODES = [
  { id: 'light', labelKey: 'settings.mode.light', icon: 'light_mode' },
  { id: 'dark', labelKey: 'settings.mode.dark', icon: 'dark_mode' },
  { id: 'system', labelKey: 'settings.mode.system', icon: 'brightness_auto' },
];

const DEFAULT_SETTINGS = {
  themeMode: 'system', // light | dark | system
  fontSize: 'md', // sm | md | lg
  language: detectLanguage(), // vi | en
  reminder: DEFAULT_REMINDER, // daily notification: { enabled, time: 'HH:MM' } - per device
  accentColor: DEFAULT_ACCENT, // '' = the supplied theme (expenser-theme.css); or any #RRGGBB accent
};

function getSystemPrefersDark() {
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

export function SettingsProvider({ children }) {
  const [stored, setStored] = useLocalStorage('qlct:settings', DEFAULT_SETTINGS);
  // Old installs saved fewer fields (and a now-removed notification flag) -
  // merge over the defaults so every field is always defined.
  const settings = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const { seedColor: legacySeed, ...merged } = { ...DEFAULT_SETTINGS, ...stored }; // seedColor = removed Material 3 setting
    if (!LANGUAGES.some((l) => l.id === merged.language)) merged.language = DEFAULT_SETTINGS.language;
    if (merged.accentColor && !isValidHex(merged.accentColor)) merged.accentColor = DEFAULT_ACCENT;
    merged.reminder = { enabled: !!merged.reminder?.enabled, time: normalizeTime(merged.reminder?.time) };
    if (merged.fontSize === 'xl') merged.fontSize = 'lg'; // removed size
    if (!FONT_SCALES[merged.fontSize]) merged.fontSize = 'md';
    return merged;
  }, [stored]);

  const [systemDark, setSystemDark] = useState(getSystemPrefersDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = settings.themeMode === 'system' ? systemDark : settings.themeMode === 'dark';

  // ---- Theme: tokens come from expenser-theme.css, the accent is an optional override ----
  const accent = settings.accentColor;
  const [colors, setColors] = useState(() => FALLBACK_COLORS[isDark ? 'dark' : 'light']);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
    applyAccent(accent, isDark, root);
    cacheAccent(accent);
    let resolved;
    try {
      resolved = readThemeColors();
    } catch {
      resolved = FALLBACK_COLORS[isDark ? 'dark' : 'light']; // very old browser without oklch / color-mix in canvas
    }
    setColors(resolved);
    // While a splash screen is showing it owns the status-bar colour (see SplashScreen).
    if (!document.querySelector('.splash')) setThemeColor(resolved.surface);
    root.style.backgroundColor = resolved.surface;
  }, [isDark, accent]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(FONT_SCALES[settings.fontSize] || 1));
  }, [settings.fontSize]);

  // ---- Language ----------------------------------------------------------------
  const lang = settings.language;
  const i18n = useMemo(() => {
    // Render-time on purpose: formatters must follow the new language before
    // any child renders with it.
    setFormatLocale(lang);
    return { lang, locale: LANGUAGES.find((l) => l.id === lang)?.locale, t: createT(lang) };
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', i18n.t('meta.description'));
  }, [lang, i18n]);

  // ---- Actions -----------------------------------------------------------------
  const update = useCallback((patch) => setStored((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...patch })), [setStored]);

  const cycleThemeMode = useCallback(() => {
    setStored((prev) => {
      const order = THEME_MODES.map((m) => m.id);
      const current = { ...DEFAULT_SETTINGS, ...prev }.themeMode;
      return { ...DEFAULT_SETTINGS, ...prev, themeMode: order[(order.indexOf(current) + 1) % order.length] };
    });
  }, [setStored]);

  const toggleLanguage = useCallback(() => {
    setStored((prev) => {
      const current = { ...DEFAULT_SETTINGS, ...prev }.language;
      return { ...DEFAULT_SETTINGS, ...prev, language: current === 'vi' ? 'en' : 'vi' };
    });
  }, [setStored]);

  // Resets appearance only - the language is an explicit choice, so it stays.
  const resetSettings = useCallback(
    () => setStored((prev) => ({ ...DEFAULT_SETTINGS, language: { ...DEFAULT_SETTINGS, ...prev }.language })),
    [setStored],
  );

  const value = useMemo(
    () => ({ settings, update, cycleThemeMode, toggleLanguage, resetSettings, isDark, colors, FONT_SCALES }),
    [settings, update, cycleThemeMode, toggleLanguage, resetSettings, isDark, colors],
  );

  return (
    <SettingsContext.Provider value={value}>
      <I18nContext.Provider value={i18n}>{children}</I18nContext.Provider>
    </SettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
