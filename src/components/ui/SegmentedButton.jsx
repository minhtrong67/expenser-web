import Icon from './Icon';

/**
 * Segmented control: a muted track with a raised active segment.
 * options: [{ id, label, icon?, activeClass? }]
 * `activeClass` lets a segment use semantic colours (e.g. income / expense).
 */
export default function SegmentedButton({ options, value, onChange, className = '', ariaLabel }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`flex w-full gap-1 rounded-lg bg-surface-container p-1 ${className}`}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={`state-layer flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-label-lg transition-colors duration-200 ${
              active ? o.activeClass || 'bg-background text-on-surface shadow-elev-1' : 'text-on-surface-variant'
            }`}
          >
            {o.icon && <Icon name={o.icon} size={16} />}
            <span className="wrap-any">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
