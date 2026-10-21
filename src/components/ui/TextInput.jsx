import { forwardRef, useId } from 'react';
import Icon from './Icon';
import { SupportingText } from './Field';

const ALWAYS_FLOATED = ['date', 'datetime-local', 'time', 'month'];

/** Outlined text field with a floating label. */
const TextInput = forwardRef(function TextInput(
  { label, error, hint, icon, trailing, required, className = '', id, type = 'text', ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  const floated = ALWAYS_FLOATED.includes(type);
  return (
    <div className={className}>
      <div className={`md-field ${error ? 'md-field-error' : ''} ${floated ? 'md-field-floated' : ''}`}>
        {icon && <Icon name={icon} className="text-on-surface-variant" />}
        <div className="relative min-w-0 flex-1">
          <input
            ref={ref}
            id={inputId}
            type={type}
            placeholder=" "
            required={required}
            aria-invalid={!!error}
            className="md-input"
            {...rest}
          />
          {label && (
            <label htmlFor={inputId} className="md-label">
              {label}
              {required && ' *'}
            </label>
          )}
        </div>
        {trailing}
      </div>
      <SupportingText error={error} hint={hint} />
    </div>
  );
});

export default TextInput;
