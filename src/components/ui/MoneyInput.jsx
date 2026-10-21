import { useId, useState } from 'react';
import { useT } from '../../i18n';
import { formatNumber, getAmountSuggestions, parseMoneyInput } from '../../utils/format';
import { MAX_AMOUNT } from '../../utils/validators';
import { SupportingText } from './Field';

/**
 * Amount field that groups digits as you type (1.500.000 / 1,500,000).
 * While the typed number is still short it offers one-tap completions:
 * typing "2" shows 2.000 / 20.000 / 200.000 / 2.000.000.
 */
export default function MoneyInput({ value, onChange, label, error, hint, suffix = '₫', autoFocus, id, className = '' }) {
  const t = useT();
  const autoId = useId();
  const inputId = id || autoId;
  const [focused, setFocused] = useState(false);
  // Re-sync the visible text when the value is changed from outside (quick-fill, edit mode).
  const [prev, setPrev] = useState(value);
  const [display, setDisplay] = useState(value ? formatNumber(value) : '');
  if (prev !== value) {
    setPrev(value);
    if (parseMoneyInput(display) !== Number(value || 0)) {
      setDisplay(value === '' || value === undefined || value === null ? '' : formatNumber(value));
    }
  }

  function commit(raw) {
    if (raw > MAX_AMOUNT) raw = MAX_AMOUNT;
    setDisplay(raw ? formatNumber(raw) : '');
    setPrev(raw);
    onChange(raw);
  }

  const suggestions = focused ? getAmountSuggestions(parseMoneyInput(display), MAX_AMOUNT) : [];

  return (
    <div className={className}>
      <div className={`md-field ${error ? 'md-field-error' : ''}`}>
        <div className="relative min-w-0 flex-1">
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            autoFocus={autoFocus}
            autoComplete="off"
            placeholder=" "
            value={display}
            onChange={(e) => commit(parseMoneyInput(e.target.value))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-invalid={!!error}
            className="md-input text-title-lg font-medium tabular-nums"
          />
          {label && (
            <label htmlFor={inputId} className="md-label">
              {label} *
            </label>
          )}
        </div>
        <span className="text-title-md text-on-surface-variant">{suffix}</span>
      </div>
      {suggestions.length > 0 && (
        // mousedown is cancelled so tapping a chip never takes focus away from the
        // input: the keyboard stays open and the field keeps its focus ring.
        <div
          role="group"
          aria-label={t('money.suggestions')}
          onMouseDown={(e) => e.preventDefault()}
          className="no-scrollbar mt-2 flex animate-fade-in gap-2 overflow-x-auto overscroll-x-contain"
        >
          {suggestions.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => commit(amount)}
              aria-label={t('money.pick', { amount: `${formatNumber(amount)} ${suffix}` })}
              className="state-layer h-8 shrink-0 rounded-lg border border-line bg-card px-3 text-label-lg tabular-nums text-on-surface"
            >
              {formatNumber(amount)}
            </button>
          ))}
        </div>
      )}
      <SupportingText error={error} hint={hint} />
    </div>
  );
}
