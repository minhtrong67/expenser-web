import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import IconButton from '../ui/IconButton';
import { NAV_ITEMS } from './navConfig';
import { useAuth } from '../../contexts/AuthContext';
import { useT } from '../../i18n';

export default function Sidebar({ open, onClose }) {
  const t = useT();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 animate-fade-in bg-scrim/30 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        aria-label={t('nav.menu')}
        className={`fixed inset-y-0 left-0 z-40 flex w-[19rem] max-w-[85vw] flex-col rounded-r-2xl border-r border-line bg-card transition-transform duration-300 ease-emphasized lg:rounded-none ${
          open ? 'translate-x-0 shadow-elev-3 lg:shadow-none' : '-translate-x-full'
        }`}
      >
        {/* App name only - no logo, per the brand brief */}
        <div className="flex items-center justify-between px-7 pb-3 pt-6">
          <p className="text-title-lg font-semibold tracking-tight text-on-surface">Expenser</p>
          <IconButton icon="close" label={t('common.close')} onClick={onClose} className="-mr-3 lg:hidden" />
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => window.innerWidth < 1024 && onClose?.()}
              className={({ isActive }) =>
                `state-layer flex h-10 items-center gap-3 rounded-lg px-3 text-label-lg transition-colors duration-200 ${
                  isActive ? 'bg-secondary-container text-on-surface' : 'text-on-surface-variant'
                }`
              }
            >
              <Icon name={item.icon} size={20} />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-outline-variant p-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container text-title-md font-bold text-on-primary-container">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                (user?.displayName || user?.email || '?')[0]?.toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="wrap-any text-title-sm text-on-surface">{user?.displayName || t('common.user')}</p>
              <p className="wrap-any text-body-sm text-on-surface-variant">{user?.email}</p>
            </div>
            <IconButton icon="logout" label={t('common.logout')} variant="danger" onClick={() => { navigate('/', { replace: true }); logout(); }} />
          </div>
        </div>
      </aside>
    </>
  );
}
