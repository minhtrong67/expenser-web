import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';
import { MOBILE_NAV_ITEMS } from './navConfig';
import { useT } from '../../i18n';

export default function MobileNav() {
  const t = useT();
  return (
    <>
      <nav
        aria-label={t('nav.menu')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex h-16 max-w-xl items-stretch justify-around px-2">
          {MOBILE_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex flex-1 flex-col items-center justify-center gap-1 text-label-md transition-colors ${
                  isActive ? 'text-brand' : 'text-on-surface-variant'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-12 items-center justify-center transition-transform duration-200 ease-emphasized group-active:scale-95`}
                  >
                    <Icon name={item.icon} size={24} fill={isActive && false} />
                  </span>
                  <span className={isActive ? 'font-semibold' : ''}>{t(item.labelKey)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
