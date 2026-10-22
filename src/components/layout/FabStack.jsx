import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import { useT } from '../../i18n';

/**
 * Bottom-right column for floating buttons. It always holds the "back to top"
 * button (once the page is scrolled) and exposes a slot (`onSlot`) that a page
 * can fill with its own FAB via <Fab> - so the two stack in one column and can
 * never overlap. On phones the column sits above the bottom navigation bar.
 */
export default function FabStack({ onSlot }) {
  const t = useT();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setShowTop(window.scrollY > 360));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fab-stack">
      {showTop && (
        <button
          type="button"
          aria-label={t('common.scrollTop')}
          title={t('common.scrollTop')}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="state-layer flex h-12 w-12 animate-scale-in items-center justify-center rounded-xl border border-line bg-primary text-on-primary shadow-elev-2 transition-transform duration-200 ease-emphasized active:scale-95"
        >
          <Icon name="arrow_upward" size={24} />
        </button>
      )}
      <div ref={onSlot} className="fab-slot" />
    </div>
  );
}
