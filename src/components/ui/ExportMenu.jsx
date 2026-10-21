import { useEffect, useRef, useState } from 'react';
import Button from './Button';
import Icon from './Icon';

/** Button + M3 menu. formats: [{ id, label, icon }]; shows a spinner on `busyId`. */
export default function ExportMenu({ label, formats, onSelect, disabled, variant = 'tonal', size = 'md', busyId, align = 'right', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <Button className="w-full" variant={variant} size={size} icon="download" disabled={disabled} loading={!!busyId} onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        {label}
      </Button>
      {open && (
        <div role="menu" className={`absolute ${align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'} z-30 mt-1 w-56 animate-menu-in overflow-hidden rounded-xl border border-line bg-popover p-1 shadow-elev-2`}>
          {formats.map((f) => (
            <button
              key={f.id}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSelect(f.id);
              }}
              className="state-layer flex h-12 w-full items-center gap-3 px-4 text-left text-body-lg text-on-surface"
            >
              <Icon name={f.icon} size={20} className="text-on-surface-variant" />
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
