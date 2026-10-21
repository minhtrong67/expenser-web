import { useEffect } from 'react';
import { useT } from '../../i18n';
import { readThemeColors, setThemeColor, splashColor } from '../../theme';

/**
 * The one full-screen loading state. Its markup/styles match the splash inside
 * index.html, so the page goes: static splash -> (React mounts) -> same splash
 * -> app. It never flashes a different spinner - or a white screen - in between.
 * The colour follows the light/dark theme (see .splash in index.css).
 */
export default function SplashScreen() {
  const t = useT();

  // Keep the status bar the same colour as the splash while it is visible, then
  // hand it back to the app surface colour.
  // useEffect(() => {
  //   setThemeColor(splashColor());
  //   return () => setThemeColor(readThemeColors().surface);
  // }, []);

  return (
    <div className="splash" role="status" aria-live="polite">
      <img className="splash-logo" src="/icons/icon-192.png" width="96" height="96" alt="" draggable="false" />
      <div className="splash-spinner" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}
