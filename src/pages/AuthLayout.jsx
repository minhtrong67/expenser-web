import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useSettings, THEME_MODES } from '../contexts/SettingsContext';
import { useI18n } from '../i18n';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatMoney } from '../utils/format';

const POINTS = ['auth.p1', 'auth.p2', 'auth.p3', 'auth.p4'];

/** Split-screen layout for the sign-in / register / reset screens. */
export default function AuthLayout({ children }) {
  const { t, lang } = useI18n();
  const { settings, cycleThemeMode, toggleLanguage } = useSettings();
  const mode = THEME_MODES.find((m) => m.id === settings.themeMode) || THEME_MODES[2];
  usePageTitle(t('meta.title'));

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Brand panel (large screens) */}
      <aside className="relative hidden w-[46%] max-w-[44rem] shrink-0 flex-col justify-between overflow-hidden bg-primary p-12 text-on-primary lg:flex">
        <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-white/[0.07]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/[0.06]" aria-hidden="true" />
        <div className="pointer-events-none absolute right-12 top-1/2 h-40 w-40 rounded-full bg-white/[0.05]" aria-hidden="true" />

        <Link to="/" className="relative flex w-fit items-center gap-3 text-title-lg font-bold tracking-tight" aria-label="Expenser">
          <img src="/icons/icon-192.png" alt="" width="36" height="36" className="h-9 w-9" />
          Expenser
        </Link>

        <div className="relative">
          <h2 className="max-w-md text-[2rem] font-bold leading-tight tracking-tight">{t('auth.heroTitle')}</h2>
          <ul className="mt-8 space-y-3.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-body-lg opacity-95">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon name="check" size={14} />
                </span>
                {t(p)}
              </li>
            ))}
          </ul>

          <div className="float-slow mt-10 w-full max-w-sm rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-label-md opacity-75">{t('dashboard.totalBalance')}</p>
            <p className="mt-1 text-headline-sm font-bold tabular-nums">{formatMoney(33500000)}</p>
            <div className="mt-4 flex items-center gap-4 text-body-md">
              <span className="flex items-center gap-1.5">
                <Icon name="arrow_upward" size={16} /> {formatMoney(21150000)}
              </span>
              <span className="flex items-center gap-1.5 opacity-80">
                <Icon name="arrow_downward" size={16} /> {formatMoney(9395000)}
              </span>
            </div>
            <div className="mt-4 flex h-10 items-end gap-1.5" aria-hidden="true">
              {[40, 65, 50, 85, 60, 95, 72].map((h, i) => (
                <span key={i} className="flex-1 rounded-t bg-white/60" style={{ height: `${h}%`, opacity: i % 2 ? 0.55 : 0.9 }} />
              ))}
            </div>
          </div>
        </div>

        <p className="relative text-body-sm opacity-70">{t('auth.cardCaption')}</p>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-4 sm:px-6" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <Link to="/" className="state-layer flex h-10 items-center gap-1.5 rounded-lg px-3 text-label-lg text-on-surface-variant">
            <Icon name="arrow_back" size={18} />
            {t('auth.back')}
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={toggleLanguage} aria-label={t('topbar.switchLanguage')} className="state-layer flex h-10 items-center gap-1 rounded-lg px-3 text-label-lg text-on-surface-variant">
              <Icon name="translate" size={18} />
              {lang.toUpperCase()}
            </button>
            <button onClick={cycleThemeMode} aria-label={`${t('topbar.themeMode')}: ${t(mode.labelKey)}`} className="state-layer flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant">
              <Icon name={mode.icon} size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-10">
          <div className="w-full max-w-[26rem] animate-slide-up">{children}</div>
        </div>

        <p className="px-6 pb-6 text-center text-body-sm text-on-surface-variant" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          © 2026 Expenser · MIT
        </p>
      </div>
    </div>
  );
}

export function AuthCard({ children }) {
  return <div className="rounded-2xl border border-line bg-card p-6 shadow-elev-1 sm:p-8">{children}</div>;
}
