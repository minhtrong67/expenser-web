import Icon from '../ui/Icon';
import IconButton from '../ui/IconButton';
import { useSettings, THEME_MODES } from '../../contexts/SettingsContext';
import { useI18n } from '../../i18n';

export default function Topbar({ title, scrolled, onSearchClick, onMenuClick }) {
  const { t, lang } = useI18n();
  const { settings, cycleThemeMode, toggleLanguage } = useSettings();
  const currentMode = THEME_MODES.find((m) => m.id === settings.themeMode) || THEME_MODES[2];

  return (
    <header
      className={`sticky top-0 z-20 box-content flex h-14 items-center gap-1 px-2 transition-colors duration-300 sm:h-16 sm:gap-2 sm:px-4 lg:px-6 ${
        scrolled ? 'border-b border-line bg-background/85 backdrop-blur-md' : 'border-b border-transparent bg-background'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <IconButton icon="menu" label={t('nav.toggleMenu')} onClick={onMenuClick} />
      <h1 className="min-w-0 flex-1 wrap-any text-title-md text-on-surface sm:text-title-lg">{title}</h1>

      <button
        onClick={onSearchClick}
        className="state-layer hidden h-9 items-center gap-2 rounded-lg border border-line bg-card px-3 text-body-md text-on-surface-variant sm:flex"
      >
        <Icon name="search" size={18} />
        <span>{t('common.search')}</span>
        <kbd className="rounded border border-outline-variant px-1.5 py-0.5 text-label-sm">Ctrl K</kbd>
      </button>
      <IconButton icon="search" label={t('common.search')} onClick={onSearchClick} className="sm:hidden" />
      <button
        onClick={toggleLanguage}
        aria-label={t('topbar.switchLanguage')}
        title={t('topbar.switchLanguage')}
        className="state-layer flex h-10 min-w-10 items-center justify-center gap-1 rounded-lg px-2 text-label-lg text-on-surface-variant"
      >
        <Icon name="translate" size={18} />
        {lang.toUpperCase()}
      </button>
      <IconButton
        icon={currentMode.icon}
        label={`${t('topbar.themeMode')}: ${t(currentMode.labelKey)}`}
        onClick={cycleThemeMode}
      />
    </header>
  );
}
