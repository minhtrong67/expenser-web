import { useEffect, useId, useRef, useState } from 'react';
import { useT } from '../../i18n';
import Icon from './Icon';
import Emoji from './Emoji';
import { SupportingText } from './Field';

function OptionIcon({ opt, size }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${opt.color}26`, color: opt.color }}
    >
      {opt.emoji ? <Emoji size={size}>{opt.emoji}</Emoji> : <Icon name={opt.icon} size={size} />}
    </span>
  );
}

/** Dropdown for categories / wallets with icon + colour. Keyboard & screen-reader friendly. */
export default function ChoiceSelect({ label, options, value, onChange, placeholder, error, emptyLabel, required }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef(null);
  const listId = useId();
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return undefined;
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', onClickOutside);
    return () => document.removeEventListener('pointerdown', onClickOutside);
  }, [open]);

  function toggle() {
    setOpen((o) => {
      if (!o) setActive(Math.max(0, options.findIndex((x) => x.id === value)));
      return !o;
    });
  }

  function pick(opt) {
    onChange(opt.id);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return toggle();
      setActive((i) => Math.min(options.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1))));
    } else if (e.key === 'Enter' && open && options[active]) {
      e.preventDefault();
      pick(options[active]);
    }
  }

  return (
    <div className="relative" ref={ref} onKeyDown={onKeyDown}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={`md-field w-full cursor-pointer text-left ${selected ? 'md-field-floated' : ''} ${error ? 'md-field-error' : ''}`}
      >
        <span className="relative flex min-w-0 flex-1 items-center gap-2.5 py-1">
          <span className="md-label !left-0">
            {label}
            {required && ' *'}
          </span>
          {selected ? (
            <span className="mt-4 flex min-w-0 items-center gap-2.5">
              <OptionIcon opt={selected} size={18} />
              <span className="wrap-any text-body-lg text-on-surface">{selected.name}</span>
            </span>
          ) : (
            <span className="mt-4 h-8 text-body-lg text-transparent">{placeholder || '—'}</span>
          )}
        </span>
        <Icon name="expand_more" className={`text-on-surface-variant transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full animate-menu-in overflow-y-auto rounded-xl border border-line bg-popover p-1 shadow-elev-2"
        >
          {options.length === 0 && <li className="px-4 py-3 text-body-md text-on-surface-variant">{emptyLabel || t('common.noItems')}</li>}
          {options.map((opt, i) => (
            <li key={opt.id} role="option" aria-selected={opt.id === value}>
              <button
                type="button"
                onClick={() => pick(opt)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-body-lg transition-colors ${
                  opt.id === value ? 'bg-primary-container text-on-primary-container' : 'text-on-surface'
                } ${i === active && opt.id !== value ? 'bg-surface-container' : ''}`}
              >
                <OptionIcon opt={opt} size={18} />
                <span className="flex-1 wrap-any">{opt.name}</span>
                {opt.subtitle && <span className="text-body-sm text-on-surface-variant">{opt.subtitle}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <SupportingText error={error} />
    </div>
  );
}
