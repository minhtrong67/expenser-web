export default function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-primary' : 'bg-surface-container-highest'} ${disabled ? 'opacity-50' : ''}`}
    >
      {/* left-0.5 + translate-x-5 keeps an even 2px gap on both ends */}
      <span
        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-elev-1 transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}
