import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Topbar from './Topbar';
import CommandPalette from './CommandPalette';
import TransactionFormModal from '../TransactionFormModal';
import FabStack from './FabStack';
import RouteFallback from '../ui/RouteFallback';
import { NAV_ITEMS } from './navConfig';
import { useT } from '../../i18n';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useReminderRuntime } from '../../hooks/useReminder';

export default function AppLayout() {
  const t = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [fabSlot, setFabSlot] = useState(null); // DOM node pages portal their FAB into
  const sentinelRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Tint the top bar once content scrolls under it (observer: no scroll handler cost).
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Start each page at the top (the drawer closes itself from its nav links).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const [txInitialType, setTxInitialType] = useState('expense');
  const openAddTx = useCallback((type) => {
    setTxInitialType(type === 'income' ? 'income' : 'expense');
    setTxModalOpen(true);
  }, []);

  // Deep link from the daily reminder notification: /?add=expense | /?add=income
  useEffect(() => {
    const add = new URLSearchParams(location.search).get('add');
    if (!add) return;
    openAddTx(add);
    navigate({ pathname: location.pathname, search: '' }, { replace: true });
  }, [location.search, location.pathname, navigate, openAddTx]);

  useReminderRuntime();

  const current = NAV_ITEMS.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));
  const title = current ? t(current.labelKey) : 'Expenser';
  usePageTitle(`${title} · Expenser`);

  return (
    <div className="min-h-dvh bg-surface">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">
        {t('common.skipToContent')}
      </a>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`flex min-h-dvh flex-col transition-[padding] duration-300 ease-emphasized ${sidebarOpen ? 'lg:pl-[19rem]' : 'lg:pl-0'}`}>
        <div ref={sentinelRef} className="absolute top-0 h-px w-px" aria-hidden="true" />
        <Topbar title={title} scrolled={scrolled} onSearchClick={() => setPaletteOpen(true)} onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-36 pt-2 sm:px-6 sm:pt-4 lg:px-8 lg:pb-28">
          <Suspense fallback={<RouteFallback />}>
            <div key={location.pathname} className="animate-fade-through">
              <Outlet context={{ openAddTx, fabSlot }} />
            </div>
          </Suspense>
        </main>
      </div>
      <MobileNav />
      <FabStack onSlot={setFabSlot} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onAddTransaction={openAddTx} />
      <TransactionFormModal open={txModalOpen} initialType={txInitialType} onClose={() => setTxModalOpen(false)} />
    </div>
  );
}
