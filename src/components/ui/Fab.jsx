import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import Icon from './Icon';

/**
 * Page-level floating action button. Rendered into the layout's FAB column (so
 * it stacks with the back-to-top button). Only the pages that render <Fab>
 * show one. Extended (with label) on large screens.
 */
export default function Fab({ label, onClick, icon = 'add' }) {
  const ctx = useOutletContext();
  const slot = ctx?.fabSlot;
  if (!slot) return null;
  return createPortal(
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="state-layer flex h-12 min-w-12 animate-scale-in items-center justify-center gap-2 rounded-xl bg-primary px-3 text-on-primary shadow-elev-2 transition-transform duration-200 ease-emphasized active:scale-95 lg:px-4"
    >
      <Icon name={icon} size={22} />
      <span className="hidden text-label-lg lg:inline">{label}</span>
    </button>,
    slot,
  );
}
