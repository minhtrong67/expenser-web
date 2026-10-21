import Icon from '../components/ui/Icon';
import IconButton from '../components/ui/IconButton';
import { useSettings, THEME_MODES } from '../contexts/SettingsContext';
import { useI18n } from '../i18n';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatMoney } from '../utils/format';

export default function AuthLayout({ children }) {
  const { t, lang } = useI18n();
  const { settings, cycleThemeMode, toggleLanguage } = useSettings();
  const mode = THEME_MODES.find((m) => m.id === settings.themeMode) || THEME_MODES[2];
  usePageTitle(t('meta.title'));

  return (
    <div className="flex min-h-dvh bg-surface">
      {/* Brand panel (large screens) */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-primary-container p-10 text-on-primary-container lg:flex">
        <p className="relative text-title-lg font-bold tracking-tight">Expenser</p>

        <div className="relative">
          <p className="mb-6 max-w-sm text-headline-md font-semibold">{t('auth.heroTitle')}</p>
          <div className="w-full max-w-sm rounded-2xl border border-brand/20 bg-background/60 p-5">
            <p className="text-label-md opacity-70">{t('dashboard.totalBalance')}</p>
            <p className="mt-1 text-headline-sm font-bold tabular-nums">{formatMoney(12500000)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-md">
              <span className="flex items-center gap-1.5">
                <Icon name="arrow_upward" size={16} /> {t('tx.income')} {formatMoney(18000000)}
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="arrow_downward" size={16} /> {t('tx.expense')} {formatMoney(5500000)}
              </span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-primary/15">
              <div className="h-full w-2/3 rounded-full bg-primary/70" />
            </div>
          </div>
        </div>

        <p className="relative max-w-sm text-body-md opacity-70">{t('auth.heroSub')}</p>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Soft tonal backdrop for small screens, where the brand panel is hidden */}
        <div className="pointer-events-none absolute inset-0 -z-0 lg:hidden" aria-hidden="true">
        </div>

        <div className="relative z-10 flex items-center justify-between px-4 pt-4 sm:px-6" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <p className="text-title-lg font-bold text-brand lg:invisible">Expenser</p>
          <div className="flex items-center gap-1">
            <button onClick={toggleLanguage} aria-label={t('topbar.switchLanguage')} className="state-layer flex h-10 items-center gap-1 rounded-lg px-3 text-label-lg text-on-surface-variant">
              <Icon name="translate" size={18} />
              {lang.toUpperCase()}
            </button>
            <IconButton icon={mode.icon} label={`${t('topbar.themeMode')}: ${t(mode.labelKey)}`} onClick={cycleThemeMode} />
          </div>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-8 sm:px-10">
          <div className="w-full max-w-sm animate-slide-up">{children}</div>
        </div>

      </div>
    </div>
  );
}

export function AuthCard({ children }) {
  return <div className="rounded-2xl border border-line bg-card p-6 sm:p-8">{children}</div>;
}
