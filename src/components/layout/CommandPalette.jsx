import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { NAV_ITEMS } from './navConfig';
import { useT } from '../../i18n';
import { useSettings } from '../../contexts/SettingsContext';

export default function CommandPalette({ open, onClose, onAddTransaction }) {
  const t = useT();
  const { cycleThemeMode, toggleLanguage } = useSettings();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const actions = useMemo(
    () => [
      { id: 'add-tx', label: t('palette.addTransaction'), icon: 'add_circle', run: () => onAddTransaction?.() },
      ...NAV_ITEMS.map((n) => ({ id: n.to, label: t('palette.goTo', { page: t(n.labelKey) }), icon: n.icon, run: () => navigate(n.to) })),
      { id: 'theme', label: t('palette.toggleTheme'), icon: 'brightness_auto', run: cycleThemeMode },
      { id: 'lang', label: t('palette.toggleLanguage'), icon: 'translate', run: toggleLanguage },
    ],
    [t, navigate, onAddTransaction, cycleThemeMode, toggleLanguage],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? actions.filter((a) => a.label.toLowerCase().includes(q)) : actions;
  }, [actions, query]);

  useEffect(() => {
    if (!open) return undefined;
    const id = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filtered[activeIndex];
        if (item) {
          item.run();
          onClose();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, filtered, activeIndex, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 sm:pt-28">
      <div className="absolute inset-0 animate-fade-in bg-scrim/30" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={t('common.search')} className="relative z-10 w-full max-w-lg animate-scale-in overflow-hidden rounded-2xl border border-line bg-popover shadow-elev-3">
        <div className="flex items-center gap-3 px-5 py-3">
          <Icon name="search" className="text-on-surface-variant" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder={t('palette.placeholder')}
            className="h-10 flex-1 bg-transparent text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant"
          />
          <kbd className="rounded border border-outline-variant px-1.5 py-0.5 text-label-sm text-on-surface-variant">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto border-t border-outline-variant p-2">
          {filtered.length === 0 && <p className="px-3 py-8 text-center text-body-md text-on-surface-variant">{t('common.noResults')}</p>}
          {filtered.map((item, i) => (
            <button
              key={item.id}
              onClick={() => {
                item.run();
                onClose();
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-body-lg transition-colors ${
                i === activeIndex ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface'
              }`}
            >
              <Icon name={item.icon} size={20} />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
