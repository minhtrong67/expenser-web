import { useT } from '../../i18n';

/**
 * The one full-screen loading state (auth gate + top-level Suspense).
 * It deliberately paints no background: the page default shows through, so
 * there is no light/dark check when the app opens.
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
