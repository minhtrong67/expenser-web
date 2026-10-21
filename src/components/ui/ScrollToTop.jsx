import { useEffect, useState } from 'react';
import { useT } from '../../i18n';
import IconButton from './IconButton';

export default function ScrollToTop() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 320);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <IconButton
      icon="arrow_upward"
      label={t('common.scrollTop')}
      variant="outlined"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bg-card bottom-[calc(10.5rem+env(safe-area-inset-bottom))] right-5 z-30 animate-scale-in shadow-elev-2 lg:bottom-8 lg:right-8"
    />
  );
}
