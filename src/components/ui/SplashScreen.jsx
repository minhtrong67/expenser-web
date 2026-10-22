import { useT } from '../../i18n';

/**
 * The one full-screen loading state (auth gate + top-level Suspense).
 * Its styles (.splash, .splash-logo, .splash-spinner) live in index.html so the
 * same splash is already on screen before the JS bundle loads; the page
 * background comes from <html> (light/dark set by the inline script there).
 */
export default function SplashScreen() {
  const t = useT();

  return (
    <div className="splash" role="status" aria-live="polite">
      <img className="splash-logo" src="/icons/icon-192.png" width="96" height="96" alt="" draggable="false" />
      <div className="splash-spinner" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}
